from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
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

databases = Databases(client)
storage = Storage(client)

DATABASE_ID = os.getenv('APPWRITE_DATABASE_ID')
COLLECTION_ID = os.getenv('APPWRITE_COLLECTION_ID')
FRESH_PROD_COLLECTION_ID = os.getenv('APPWRITE_FRESH_PROD_COLLECTION_ID')
BUCKET_ID = os.getenv('APPWRITE_BUCKET_ID')

latest_barcode = None

# Initialize OpenFoodFacts API
api = openfoodfacts.API(user_agent="NutriLiz/1.0", timeout=15)

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
        # Get the document directly using its ID from fresh_prod collection
        doc = databases.get_document(
            DATABASE_ID,
            FRESH_PROD_COLLECTION_ID,
            document_id
        )
        
        if doc:
            name = doc.get('name')
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
        
        # Keep barcode as string for sm_bar/rs_bar queries (they're string attributes)
        full_barcode_str = barcode_str
        # Use integers for group columns (they're integer attributes)
        sm_group_value = int(barcode_str[:8]) if len(barcode_str) >= 8 else int(barcode_str)
        rs_group_value = int(barcode_str[:7]) if len(barcode_str) >= 7 else int(barcode_str)
        
        print(f"[Appwrite] Searching barcode: {barcode_str}")

        # ───────────── PARALLEL QUERY FUNCTION ─────────────
        def query_column(col, value):
            """Query a single column, return (col, result) tuple"""
            try:
                result = databases.list_documents(
                    DATABASE_ID,
                    COLLECTION_ID,
                    queries=[Query.equal(col, [value])]
                )
                if result.get('documents'):
                    return (col, result)
            except Exception as e:
                print(f"[Appwrite] Error querying {col}: {e}")
            return (col, None)

        # ───────────── BUILD ALL QUERIES ─────────────
        # sm_bar and rs_bar are string attributes, group columns are integers
        queries_to_run = [
            ('sm_bar', full_barcode_str),
            ('rs_bar', full_barcode_str),
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
            print(f"[Appwrite] Product not found in database")
            return {
                'success': False,
                'barcode': barcode_value,
                'message': 'No product found for this barcode',
            }
        
        print(f"[Appwrite] Product found in column: {matched_column}")

        # Rest of your existing code to format the document...
        doc = result['documents'][0]
        document_id = doc.get('$id')
        
        product_name = doc.get('name')
        if not product_name or product_name == '' or product_name == 'N/A' or product_name.lower() == 'unknown product':
            fresh_prod_name = get_product_name_from_fresh_prod(document_id)
            if fresh_prod_name:
                product_name = fresh_prod_name
            else:
                product_name = 'N/A'
        
        file_id = doc.get('image_id') or doc.get('imageId') or doc.get('$id')
        image_url = None
        if file_id:
            image_url = (
                f"{os.getenv('APPWRITE_ENDPOINT')}/storage/buckets/"
                f"{BUCKET_ID}/files/{file_id}/preview?project={os.getenv('APPWRITE_PROJECT_ID')}"
            )
        
        group_data = extract_group_data(doc)
        
        product_data = {
            'source': 'appwrite',
            'barcode': barcode_value,
            'matched_column': matched_column,
            'document_id': document_id,
            'sm_bar': doc.get('sm_bar'),
            'rs_bar': doc.get('rs_bar'),
            'product': {
                'name': product_name,
                'category': doc.get('category', 'N/A'),
            },
            'image_url': image_url,
            'nutrition': {
                'carbohydrates': doc.get('carbohydrates', 'N/A'),
                'protein': doc.get('protein', 'N/A'),
                'fat': doc.get('fat', 'N/A'),
                'fiber': doc.get('fiber', 'N/A'),
                'sugar': doc.get('sugar', 'N/A'),
                'calcium': doc.get('calcium', 'N/A'),
                'iron': doc.get('iron', 'N/A'),
                'water': doc.get('water', 'N/A'),
                'potassium': doc.get('potassium', 'N/A'),
                'magnesium': doc.get('magnesium', 'N/A'),
                'sodium': doc.get('sodium', 'N/A'),
                'phosphorus': doc.get('phosphorus', 'N/A'),
                'vitamin_c': doc.get('vitamin_c', 'N/A'),
                'vitamin_a': doc.get('vitamin_a', 'N/A'),
                'vitamin_e': doc.get('vitamin_e', 'N/A'),
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
        product_data = api.product.get(
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
        
        if product_data and product_data.get('code'):
            nutriments = product_data.get('nutriments', {})
            ecoscore_data = product_data.get('ecoscore_data', {})
            
            return {
                'source': 'openfoodfacts',
                'barcode': barcode,
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
                # Allergen data
                'allergens': product_data.get('allergens', ''),
                'allergens_tags': product_data.get('allergens_tags', []),
                'allergens_hierarchy': product_data.get('allergens_hierarchy', []),
                'traces': product_data.get('traces', ''),
                'traces_tags': product_data.get('traces_tags', []),
                'traces_hierarchy': product_data.get('traces_hierarchy', []),
                'ingredients_text': product_data.get('ingredients_text', 'N/A'),
                # No groups for OpenFoodFacts products
                'groups': None
            }
        return None
    except Exception as e:
        print(f"SDK request failed: {e}")
        return None


def get_product_data(barcode):
    # Try Appwrite first
    custom_data = get_product_data_appwrite(barcode)
    
    # Check if Appwrite returned valid product data
    if custom_data and custom_data.get('success') is not False:
        return custom_data
    
    # Fall back to OpenFoodFacts if not found in Appwrite
    openfoodfacts_data = get_product_data_openfoodfacts(barcode)
    if openfoodfacts_data:
        return openfoodfacts_data
    
    return None


# ...existing code for barcode_scanner_thread, start_barcode_scanner, get_latest_barcode...


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