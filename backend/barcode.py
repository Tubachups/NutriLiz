import serial
import time
import threading
import requests

latest_barcode = None
BASE_URL = "https://world.openfoodfacts.org/api/v0/product/"

def get_latest_barcode():
    """Get the latest scanned barcode and reset it."""
    global latest_barcode
    if latest_barcode:
        barcode = latest_barcode
        latest_barcode = None  # Reset after reading
        return barcode
    return None

def get_product_data(barcode):
    """Fetch product data from OpenFoodFacts API."""
    try:
        url = f"{BASE_URL}{barcode}.json"
        response = requests.get(url)
        data = response.json()
        
        if data.get('status') == 1:
            product = data.get('product', {})
            nutriments = product.get('nutriments', {})
            ecoscore_data = product.get('ecoscore_data', {})
            
            return {
                'name': product.get('product_name', 'N/A'),
                'type': product.get('categories', 'N/A'),
                'manufacturing_places': product.get('manufacturing_places', 'N/A'),
                'quantity': product.get('quantity', 'N/A'),
                'serving_quantity': product.get('serving_quantity', 'N/A'),
                'image_url': product.get('image_url', None),  # Main product image
                'image_front_url': product.get('image_front_url', None),  # Front image
                'image_front_small_url': product.get('image_front_small_url', None),  # Smaller front image
                'image_ingredients_url': product.get('image_ingredients_url', None),  # Ingredients image
                'image_nutrition_url': product.get('image_nutrition_url', None),
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
                'nutri_score': product.get('nutriscore_score', 'N/A'),
                'nutri_grade': product.get('nutriscore_grade', 'N/A'),
                # NOVA Group (1-4: unprocessed to ultra-processed)
                'nova_group': product.get('nova_group', 'N/A'),
                'nova_groups': product.get('nova_groups', 'N/A'),  # More detailed version
                # Eco-Score
                'ecoscore_score': product.get('ecoscore_score', 'N/A'),  # Numeric score (0-100)
                'ecoscore_grade': product.get('ecoscore_grade', 'N/A'),  # Letter grade (a-e)
                'ef_total': ecoscore_data.get('score', 'N/A'),
                # Labels, certifications, and awards
                'labels': product.get('labels', 'N/A'),  # Comma-separated string
                'labels_tags': product.get('labels_tags', []),  # List of label tags
                'labels_hierarchy': product.get('labels_hierarchy', []),  # Hierarchical labels
                'certifications': product.get('certifications', 'N/A'),  # Alternative field
                'awards': product.get('awards', 'N/A'),  # Awards if any
            }
        return None
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")
        return None

def barcode_scanner_thread():
    """Thread function to continuously scan for barcodes."""
    global latest_barcode
    try:
        ser = serial.Serial('/dev/ttyACM0', 115200, timeout=1.0)
        time.sleep(3)
        ser.reset_input_buffer()
        print("Serial OK - Barcode scanner ready")
        
        while True:
            time.sleep(0.01)
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').rstrip()
                print(f"Barcode scanned: {line}")
                latest_barcode = line
                
    except KeyboardInterrupt:
        print("Closing serial communication.")
        ser.close()
    except Exception as e:
        print(f"Serial error: {e}")

def start_barcode_scanner():
    """Start the barcode scanner in a separate daemon thread."""
    scanner_thread = threading.Thread(target=barcode_scanner_thread, daemon=True)
    scanner_thread.start()
    print("Barcode scanner thread started")