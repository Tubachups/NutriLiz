from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from appwrite.client import Client
from appwrite.services.storage import Storage
from appwrite.services.tables_db import TablesDB
from appwrite.query import Query
from appwrite.exception import AppwriteException
import os
import serial
import time
import threading
import warnings
import openfoodfacts
from concurrent.futures import ThreadPoolExecutor, as_completed


# ─────────────── SUPPRESS DEPRECATION WARNINGS ───────────────
warnings.filterwarnings("ignore", category=DeprecationWarning)

# ─────────────── LOAD ENVIRONMENT ───────────────
load_dotenv()

app = Flask(__name__)
CORS(app)

client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
client.set_key(os.getenv('APPWRITE_API_KEY'))

tabledb = TablesDB(client)
storage = Storage(client)

DATABASE_ID = os.getenv('APPWRITE_DATABASE_ID')
COLLECTION_ID = os.getenv('APPWRITE_COLLECTION_ID')
FRESH_PROD_COLLECTION_ID = os.getenv('APPWRITE_FRESH_PROD_COLLECTION_ID')
BUCKET_ID = os.getenv('APPWRITE_BUCKET_ID')

latest_barcode = None

# Initialize OpenFoodFacts API
api = openfoodfacts.API(user_agent="NutriLiz/1.0", timeout=15)


def log_barcode(message):
    print(f"[Barcode] {message}")


def log_appwrite(message):
    print(f"[Appwrite] {message}")


def normalize_barcode_input(barcode):
    """Normalize scanner/input barcode to digits only."""
    return ''.join(filter(str.isdigit, str(barcode or '').strip()))


def build_openfoodfacts_barcode_candidates(barcode_digits):
    """Build likely UPC/EAN variants for OpenFoodFacts lookup."""
    if not barcode_digits:
        return []

    candidates = [barcode_digits]

    if len(barcode_digits) == 12:
        candidates.append(f"0{barcode_digits}")

    if len(barcode_digits) == 13 and barcode_digits.startswith('0'):
        candidates.append(barcode_digits[1:])

    seen = set()
    ordered = []
    for code in candidates:
        if code and code not in seen:
            ordered.append(code)
            seen.add(code)
    return ordered

# ─────────────── GROUP COLUMN DEFINITIONS ───────────────
# RS groups (7-digit barcodes)
RS_GROUP_COLUMNS = [
    'rs_fhvn', 'rs_rs', 'rs_edlp', 'rs_bmpc', 'rs_slf',
    'rs_sl', 'rs_phvn', 'rs_gf', 'rs_rte'
]

# SM groups (8-digit barcodes)
SM_GROUP_COLUMNS = [
    'sm_nvu', 'sm_size', 'sm_nvt', 'sm_smb', 'sm_lr',
    'sm_sae', 'sm_lfu', 'sm_nlfj', 'sm_smbu', 'sm_fc',
    'sm_ch', 'sm_lgi', 'sm_glbl', 'sm_dzn'
]

# All group columns combined
ALL_GROUP_COLUMNS = RS_GROUP_COLUMNS + SM_GROUP_COLUMNS


def extract_group_data(doc):
    """
    Extract group data from document, filtering out null/empty values.
    Returns a dict with only the groups that have values.
    """
    rs_groups = {}
    sm_groups = {}
    
    for col in RS_GROUP_COLUMNS:
        value = doc.get(col)
        if value is not None and value != '' and value != 'N/A':
            rs_groups[col] = value
    
    for col in SM_GROUP_COLUMNS:
        value = doc.get(col)
        if value is not None and value != '' and value != 'N/A':
            sm_groups[col] = value
    
    return {
        'rs_groups': rs_groups if rs_groups else None,
        'sm_groups': sm_groups if sm_groups else None,
        'active_groups': list(rs_groups.keys()) + list(sm_groups.keys())
    }


def get_product_name_from_fresh_prod(document_id):
    """
    Fetch product name from fresh_prod collection using the document_id.
    Returns the name if found, otherwise returns None.
    """
    if not FRESH_PROD_COLLECTION_ID or not document_id:
        return None
    
    try:
        # Get the row directly using its ID from fresh_prod collection
        row = tabledb.get_row(
            DATABASE_ID,
            FRESH_PROD_COLLECTION_ID,
            document_id
        )

        if row:
            row_dict = row.to_dict() if hasattr(row, "to_dict") else {}
            data = row_dict.get("data", {}) if isinstance(row_dict, dict) else {}
            name = data.get("name") or row_dict.get("name")
            if name and name != '' and name != 'N/A':
                print(f"[Appwrite] Found name in fresh_prod: {name}")
                return name
        
        return None
    except AppwriteException as e:
        print(f"[Appwrite] Error fetching from fresh_prod: {e}")
        return None
    except Exception as e:
        print(f"[Appwrite] Unexpected error fetching from fresh_prod: {e}")
        return None


def get_product_data_appwrite(barcode_value):
    try:
        # ───────────── PREPARE BARCODE VARIANTS ─────────────
        barcode_str = ''.join(filter(str.isdigit, str(barcode_value).strip()))
        
        if not barcode_str:
            return {
                'success': False,
                'barcode': barcode_value,
                'message': 'Invalid barcode - no digits found'
            }
        
        # Appwrite table columns accept numeric barcode values for direct lookups.
        direct_barcode_value = int(barcode_str)
        # Group columns are integer attributes.
        sm_group_value = int(barcode_str[:8]) if len(barcode_str) >= 8 else int(barcode_str)
        rs_group_value = int(barcode_str[:7]) if len(barcode_str) >= 7 else int(barcode_str)

        log_appwrite(f"Searching barcode: {barcode_str}")

        # ───────────── PARALLEL QUERY FUNCTION ─────────────
        def rows_to_plain_dicts(row_list):
            """Convert SDK Row objects to plain dicts with user-defined columns."""
            return [row.to_dict() for row in (row_list.rows or [])]

        def query_column(col, value):
            """Query a single column, return (col, result) tuple"""
            try:
                result = tabledb.list_rows(
                    DATABASE_ID,
                    COLLECTION_ID,
                    queries=[Query.equal(col, [value])]
                )
                rows = rows_to_plain_dicts(result)
                if rows:
                    return (col, {'documents': rows})
            except Exception as e:
                # Direct barcode columns are optional fallbacks; avoid noisy logs unless
                # we hit an unexpected failure on the grouping columns.
                if col not in {'sm_bar', 'rs_bar'}:
                    log_appwrite(f"Error querying {col}: {e}")
            return (col, None)

        # ───────────── BUILD ALL QUERIES ─────────────
        # Direct barcode columns plus grouping columns.
        queries_to_run = [
            ('sm_bar', direct_barcode_value),
            ('rs_bar', direct_barcode_value),
        ]
        # Add SM group columns (8 digits)
        for col in SM_GROUP_COLUMNS:
            queries_to_run.append((col, sm_group_value))
        # Add RS group columns (7 digits)
        for col in RS_GROUP_COLUMNS:
            queries_to_run.append((col, rs_group_value))

        # ───────────── EXECUTE IN PARALLEL ─────────────
        matched_column = None
        result = {'documents': []}
        
        # Use ThreadPoolExecutor to run queries in parallel
        # max_workers=10 balances speed vs not overwhelming Appwrite
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {
                executor.submit(query_column, col, val): col 
                for col, val in queries_to_run
            }
            
            for future in as_completed(futures):
                col, query_result = future.result()
                if query_result and query_result.get('documents'):
                    matched_column = col
                    result = query_result
                    # Cancel remaining futures - we found a match
                    for f in futures:
                        f.cancel()
                    break

        # ───────────── HANDLE RESULTS ─────────────
        if not result['documents']:
            log_appwrite("Product not found in database")
            return {
                'success': False,
                'barcode': barcode_value,
                'message': 'No product found for this barcode',
            }

        log_appwrite(f"Product found in column: {matched_column}")

        # Rest of your existing code to format the document...
        doc = result['documents'][0]
        row_data = doc.get('data', {}) if isinstance(doc, dict) else {}
        document_id = doc.get('$id')
        
        product_name = row_data.get('name') or doc.get('name')
        if not product_name or product_name == '' or product_name == 'N/A' or product_name.lower() == 'unknown product':
            fresh_prod_name = get_product_name_from_fresh_prod(document_id)
            if fresh_prod_name:
                product_name = fresh_prod_name
            else:
                product_name = 'N/A'
        
        file_id = (
            row_data.get('image_id')
            or row_data.get('imageId')
            or doc.get('image_id')
            or doc.get('imageId')
            or doc.get('$id')
        )
        image_url = None
        if file_id:
            image_url = (
                f"{os.getenv('APPWRITE_ENDPOINT')}/storage/buckets/"
                f"{BUCKET_ID}/files/{file_id}/preview?project={os.getenv('APPWRITE_PROJECT_ID')}"
            )
        
        group_data = extract_group_data(row_data or doc)
        
        product_data = {
            'source': 'appwrite',
            'barcode': barcode_value,
            'matched_column': matched_column,
            'document_id': document_id,
            'sm_bar': row_data.get('sm_bar') or doc.get('sm_bar'),
            'rs_bar': row_data.get('rs_bar') or doc.get('rs_bar'),
            'product': {
                'name': product_name,
                'category': row_data.get('category') or doc.get('category', 'N/A'),
            },
            'image_url': image_url,
            'nutrition': {
                'carbohydrates': row_data.get('carbohydrates', doc.get('carbohydrates', 'N/A')),
                'protein': row_data.get('protein', doc.get('protein', 'N/A')),
                'fat': row_data.get('fat', doc.get('fat', 'N/A')),
                'fiber': row_data.get('fiber', doc.get('fiber', 'N/A')),
                'sugar': row_data.get('sugar', doc.get('sugar', 'N/A')),
                'calcium': row_data.get('calcium', doc.get('calcium', 'N/A')),
                'iron': row_data.get('iron', doc.get('iron', 'N/A')),
                'water': row_data.get('water', doc.get('water', 'N/A')),
                'potassium': row_data.get('potassium', doc.get('potassium', 'N/A')),
                'magnesium': row_data.get('magnesium', doc.get('magnesium', 'N/A')),
                'sodium': row_data.get('sodium', doc.get('sodium', 'N/A')),
                'phosphorus': row_data.get('phosphorus', doc.get('phosphorus', 'N/A')),
                'vitamin_c': row_data.get('vitamin_c', doc.get('vitamin_c', 'N/A')),
                'vitamin_a': row_data.get('vitamin_a', doc.get('vitamin_a', 'N/A')),
                'vitamin_e': row_data.get('vitamin_e', doc.get('vitamin_e', 'N/A')),
            },
            'groups': group_data,
        }
        
        return product_data

    except AppwriteException as e:
        return {'success': False, 'error': str(e), 'barcode': barcode_value}
    except Exception as e:
        return {'success': False, 'error': str(e), 'barcode': barcode_value}


def get_product_data_openfoodfacts(barcode):
    """Fetch product data from OpenFoodFacts using SDK."""
    try:
        # Use SDK's product lookup with correct syntax
        raw_data = api.product.get(
            barcode,
            fields=[
                "code", "product_name", "categories", "categories_tags",
                "manufacturing_places", "quantity", "serving_quantity",
                "image_url", "image_front_url", "image_front_small_url",
                "image_ingredients_url", "image_nutrition_url",
                "nutriments", "nutriscore_score", "nutriscore_grade",
                "nova_group", "nova_groups", "ecoscore_score", "ecoscore_grade",
                "ecoscore_data", "labels", "certifications", "awards",
                "brands", "brands_tags",
                # Allergen fields
                "allergens", "allergens_tags", "allergens_hierarchy",
                "traces", "traces_tags", "traces_hierarchy", "ingredients_text"
            ]
        )

        if not raw_data:
            return None

        product_data = raw_data.get('product', raw_data)
        if not isinstance(product_data, dict):
            return None

        resolved_code = product_data.get('code') or raw_data.get('code')
        if not resolved_code:
            return None

        nutriments = product_data.get('nutriments', {}) or {}
        ecoscore_data = product_data.get('ecoscore_data', {}) or {}

        return {
            'source': 'openfoodfacts',
            'barcode': str(resolved_code),
            'name': product_data.get('product_name', 'N/A'),
            'type': product_data.get('categories', 'N/A'),
            'categories_tags': product_data.get('categories_tags', []),
            'manufacturing_places': product_data.get('manufacturing_places', 'N/A'),
            'quantity': product_data.get('quantity', 'N/A'),
            'serving_quantity': product_data.get('serving_quantity', 'N/A'),
            'image_url': product_data.get('image_url', None),
            'image_front_url': product_data.get('image_front_url', None),
            'image_front_small_url': product_data.get('image_front_small_url', None),
            'image_ingredients_url': product_data.get('image_ingredients_url', None),
            'image_nutrition_url': product_data.get('image_nutrition_url', None),
            'energy_kcal_100g': nutriments.get('energy-kcal_100g', 'N/A'),
            'energy_kcal_serving': nutriments.get('energy-kcal_serving', 'N/A'),
            'carbohydrates_100g': nutriments.get('carbohydrates_100g', 'N/A'),
            'carbohydrates_serving': nutriments.get('carbohydrates_serving', 'N/A'),
            'sugars_100g': nutriments.get('sugars_100g', 'N/A'),
            'sugars_serving': nutriments.get('sugars_serving', 'N/A'),
            'fat_100g': nutriments.get('fat_100g', 'N/A'),
            'fat_serving': nutriments.get('fat_serving', 'N/A'),
            'saturated_fat_100g': nutriments.get('saturated-fat_100g', 'N/A'),
            'saturated_fat_serving': nutriments.get('saturated-fat_serving', 'N/A'),
            'fiber_100g': nutriments.get('fiber_100g', 'N/A'),
            'fiber_serving': nutriments.get('fiber_serving', 'N/A'),
            'proteins_100g': nutriments.get('proteins_100g', 'N/A'),
            'proteins_serving': nutriments.get('proteins_serving', 'N/A'),
            'salt_100g': nutriments.get('salt_100g', 'N/A'),
            'salt_serving': nutriments.get('salt_serving', 'N/A'),
            'sodium_100g': nutriments.get('sodium_100g', 'N/A'),
            'sodium_serving': nutriments.get('sodium_serving', 'N/A'),
            'calcium_100g': nutriments.get('calcium_100g', 'N/A'),
            'calcium_serving': nutriments.get('calcium_serving', 'N/A'),
            'nutriments': nutriments,
            'nutri_score': product_data.get('nutriscore_score', 'N/A'),
            'nutri_grade': product_data.get('nutriscore_grade', 'N/A'),
            'nova_group': product_data.get('nova_group', 'N/A'),
            'ecoscore_score': product_data.get('ecoscore_score', 'N/A'),
            'ecoscore_grade': product_data.get('ecoscore_grade', 'N/A'),
            'ef_total': ecoscore_data.get('score', 'N/A'),
            'labels': product_data.get('labels', 'N/A'),
            'certifications': product_data.get('certifications', 'N/A'),
            'awards': product_data.get('awards', 'N/A'),
            'allergens': product_data.get('allergens', ''),
            'allergens_tags': product_data.get('allergens_tags', []),
            'allergens_hierarchy': product_data.get('allergens_hierarchy', []),
            'traces': product_data.get('traces', ''),
            'traces_tags': product_data.get('traces_tags', []),
            'traces_hierarchy': product_data.get('traces_hierarchy', []),
            'ingredients_text': product_data.get('ingredients_text', 'N/A'),
            'groups': None
        }
    except Exception as e:
        log_barcode(f"OpenFoodFacts SDK request failed: {e}")
        return None


def get_product_data(barcode):
    normalized_barcode = normalize_barcode_input(barcode)
    if not normalized_barcode:
        return None

    # Try Appwrite first
    custom_data = get_product_data_appwrite(normalized_barcode)
    
    # Check if Appwrite returned valid product data
    if custom_data and custom_data.get('success') is not False:
        return custom_data
    
    # Fall back to OpenFoodFacts if not found in Appwrite
    for candidate in build_openfoodfacts_barcode_candidates(normalized_barcode):
        openfoodfacts_data = get_product_data_openfoodfacts(candidate)
        if openfoodfacts_data:
            openfoodfacts_data['requested_barcode'] = normalized_barcode
            return openfoodfacts_data
    
    return None

def barcode_scanner_thread():
    global latest_barcode
    try:
        ser = serial.Serial('/dev/ttyACM0', 115200, timeout=1.0)
        time.sleep(3)
        ser.reset_input_buffer()
        print("Serial OK - Barcode scanner ready")
        
        while True:
            time.sleep(0.01)
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='replace').rstrip()
                if line and len(line) > 0 and not line.isspace():
                    print(f"Barcode scanned: {line}")
                    latest_barcode = line
                
    except KeyboardInterrupt:
        print("Closing serial communication.")
        ser.close()
    except Exception as e:
        print(f"Serial error: {e}")

def start_barcode_scanner():
    scanner_thread = threading.Thread(target=barcode_scanner_thread, daemon=True)
    scanner_thread.start()
    print("Barcode scanner thread started")

def get_latest_barcode():
    global latest_barcode
    if latest_barcode:
        barcode = latest_barcode
        latest_barcode = None  # Reset after reading
        return barcode
    return None
