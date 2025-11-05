import os
import serial
import time
import threading
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.query import Query
from appwrite.exception import AppwriteException

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

# Global variable to store latest scanned barcode
latest_barcode = None

# ─────────────── SEARCH FUNCTION ───────────────
def search_by_barcode(barcode_value):
    try:
        # ───────────── TRY sm_bar FIRST ─────────────
        barcode_str = str(barcode_value).strip()
        original_length = len(barcode_str)
        
        if len(barcode_str) > 13:
            barcode_str = barcode_str[:13]

        sm_bar_trimmed = int(barcode_str)
        
        result = databases.list_documents(
            DATABASE_ID,
            COLLECTION_ID,
            queries=[Query.equal("sm_bar", [sm_bar_trimmed])]
        )

        # ───────────── IF NOT FOUND, TRY rs_bar ─────────────
        if not result['documents']:
            rs_query_value = int(barcode_value) if barcode_value.isdigit() and len(barcode_value) <= 15 else barcode_value

            result = databases.list_documents(
                DATABASE_ID,
                COLLECTION_ID,
                queries=[Query.equal("rs_bar", [rs_query_value])]
            )

        # ───────────── HANDLE RESULTS ─────────────
        if not result['documents']:
            return {
                'success': False,
                'barcode': barcode_value,
                'message': 'No product found for this barcode',
                'searched': {
                    'sm_bar': sm_bar_trimmed,
                    'rs_bar': barcode_value,
                    'trimmed': original_length > 13
                }
            }

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
        
        # Extract and format product data matching your schema
        product_data = {
            'barcode': barcode_value,
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

# ─────────────── BARCODE SCANNER THREAD ───────────────
def barcode_scanner_thread():
    """Background thread for barcode scanning"""
    global latest_barcode
    try:
        ser = serial.Serial('/dev/ttyACM0', 115200, timeout=1.0)
        time.sleep(3)
        ser.reset_input_buffer()
        print("✅ Serial connection established. Barcode scanner ready.")

        while True:
            if ser.in_waiting > 0:
                barcode = ser.readline().decode('utf-8', errors='ignore').strip()
                if barcode:
                    print(f"📦 Scanned Barcode: {barcode}")
                    latest_barcode = barcode
                    
                    # Automatically search and print results
                    result = search_by_barcode(barcode)
                    print(f"🔍 Search Result: {result}")

            time.sleep(0.05)

    except serial.SerialException as e:
        print(f"❌ Serial Error: {e}")
    except Exception as e:
        print(f"❌ Scanner Error: {e}")


def start_barcode_scanner():
    """Start the barcode scanner in a background thread"""
    scanner_thread = threading.Thread(target=barcode_scanner_thread, daemon=True)
    scanner_thread.start()
    print("🔍 Barcode scanner thread started")


# ─────────────── FLASK API ROUTES ───────────────

@app.route('/api/search/<barcode>')
def search_product(barcode):
    """Search for a product by barcode"""
    if not barcode:
        return jsonify({
            'success': False,
            'error': 'Barcode parameter is required'
        }), 400
    
    result = search_by_barcode(barcode)
    status_code = 200 if result.get('success') != False else 404
    return jsonify(result), status_code


@app.route('/api/latest-scan')
def get_latest_scan():
    """Get the most recently scanned barcode and its product info"""
    global latest_barcode
    
    if not latest_barcode:
        return jsonify({
            'success': False,
            'message': 'No barcode scanned yet'
        }), 404
    
    result = search_by_barcode(latest_barcode)
    return jsonify(result), 200


@app.route('/api/latest-barcode')
def get_latest_barcode():
    """Get just the latest scanned barcode value"""
    global latest_barcode
    
    if not latest_barcode:
        return jsonify({
            'success': False,
            'message': 'No barcode scanned yet'
        }), 404
    
    return jsonify({
        'success': True,
        'barcode': latest_barcode
    }), 200


# ─────────────── MAIN ENTRY ───────────────
if __name__ == "__main__":
    # Start barcode scanner in background
    start_barcode_scanner()
    
    app.run(host='0.0.0.0', port=5000, debug=True)