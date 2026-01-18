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


def get_product_data_appwrite(barcode_value):
    try:
        # ───────────── PREPARE BARCODE VARIANTS ─────────────
        barcode_str = str(barcode_value).strip()
        original_length = len(barcode_str)
        
        # Extract the relevant digits for each store format
        # SM uses first 8 digits, RS uses first 7 digits
        sm_bar_value = int(barcode_str[:8]) if len(barcode_str) >= 8 else int(barcode_str)
        rs_bar_value = int(barcode_str[:7]) if len(barcode_str) >= 7 else int(barcode_str)
        
        print(f"[Appwrite] Original barcode: {barcode_str} (length: {original_length})")
        print(f"[Appwrite] SM lookup (8 digits): {sm_bar_value}")
        print(f"[Appwrite] RS lookup (7 digits): {rs_bar_value}")
        
        result = {'documents': []}
        matched_column = None
        
        # ───────────── TRY sm_bar FIRST (8 digits) ─────────────
        print(f"[Appwrite] Trying sm_bar: {sm_bar_value}")
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            result = databases.list_documents(
                DATABASE_ID,
                COLLECTION_ID,
                queries=[Query.equal("sm_bar", [sm_bar_value])]
            )
        if result['documents']:
            matched_column = 'sm_bar'
        
        # ───────────── TRY rs_bar (7 digits) ─────────────
        if not result['documents']:
            print(f"[Appwrite] Trying rs_bar: {rs_bar_value}")
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", DeprecationWarning)
                result = databases.list_documents(
                    DATABASE_ID,
                    COLLECTION_ID,
                    queries=[Query.equal("rs_bar", [rs_bar_value])]
                )
            if result['documents']:
                matched_column = 'rs_bar'
        
        # ───────────── TRY SM GROUP COLUMNS (8 digits) ─────────────
        if not result['documents']:
            print(f"[Appwrite] Searching SM group columns for: {sm_bar_value}")
            for col in SM_GROUP_COLUMNS:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", DeprecationWarning)
                    result = databases.list_documents(
                        DATABASE_ID,
                        COLLECTION_ID,
                        queries=[Query.equal(col, [sm_bar_value])]
                    )
                if result['documents']:
                    matched_column = col
                    print(f"[Appwrite] Found in column: {col}")
                    break
        
        # ───────────── TRY RS GROUP COLUMNS (7 digits) ─────────────
        if not result['documents']:
            print(f"[Appwrite] Searching RS group columns for: {rs_bar_value}")
            for col in RS_GROUP_COLUMNS:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", DeprecationWarning)
                    result = databases.list_documents(
                        DATABASE_ID,
                        COLLECTION_ID,
                        queries=[Query.equal(col, [rs_bar_value])]
                    )
                if result['documents']:
                    matched_column = col
                    print(f"[Appwrite] Found in column: {col}")
                    break

        # ───────────── HANDLE RESULTS ─────────────
        if not result['documents']:
            print(f"[Appwrite] Product not found in database")
            return {
                'success': False,
                'barcode': barcode_value,
                'message': 'No product found for this barcode',
                'searched': {
                    'sm_bar': sm_bar_value,
                    'rs_bar': rs_bar_value,
                    'sm_groups': SM_GROUP_COLUMNS,
                    'rs_groups': RS_GROUP_COLUMNS,
                    'original_barcode': barcode_str
                }
            }
        
        print(f"[Appwrite] Product found in column: {matched_column}")

        # Format the document data based on your actual schema
        doc = result['documents'][0]
        
        # Build image URL
        file_id = doc.get('image_id') or doc.get('imageId') or doc.get('$id')
        image_url = None
        if file_id:
            image_url = (
                f"{os.getenv('APPWRITE_ENDPOINT')}/storage/buckets/"
                f"{BUCKET_ID}/files/{file_id}/preview?project={os.getenv('APPWRITE_PROJECT_ID')}"
            )
        
        # Extract group data dynamically
        group_data = extract_group_data(doc)
        
        # Extract and format product data matching your schema
        product_data = {
            'source': 'appwrite',
            'barcode': barcode_value,
            'matched_column': matched_column,  # Which column the barcode was found in
            'document_id': doc.get('$id'),
            'sm_bar': doc.get('sm_bar'),
            'rs_bar': doc.get('rs_bar'),
            'product': {
                'name': doc.get('name', 'N/A'),
                'category': doc.get('category', 'N/A'),
            },
            'image_url': image_url,
            'nutrition': {
                # Macronutrients
                'carbohydrates': doc.get('carbohydrates', 'N/A'),
                'protein': doc.get('protein', 'N/A'),
                'fat': doc.get('fat', 'N/A'),
                'fiber': doc.get('fiber', 'N/A'),
                'sugar': doc.get('sugar', 'N/A'),
                
                # Minerals
                'calcium': doc.get('calcium', 'N/A'),
                'iron': doc.get('iron', 'N/A'),
                'water': doc.get('water', 'N/A'),
                'potassium': doc.get('potassium', 'N/A'),
                'magnesium': doc.get('magnesium', 'N/A'),
                'sodium': doc.get('sodium', 'N/A'),
                'phosphorus': doc.get('phosphorus', 'N/A'),
                
                # Vitamins
                'vitamin_c': doc.get('vitamin_c', 'N/A'),
                'vitamin_a': doc.get('vitamin_a', 'N/A'),
                'vitamin_e': doc.get('vitamin_e', 'N/A'),
            },
            # ───────────── NEW: GROUP DATA ─────────────
            'groups': group_data,
        }
        
        return product_data

    except AppwriteException as e:
        return {
            'success': False,
            'error': str(e),
            'error_type': 'AppwriteException',
            'barcode': barcode_value
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__,
            'barcode': barcode_value
        }


# ...existing code for get_product_data_openfoodfacts...


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