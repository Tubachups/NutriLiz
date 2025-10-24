import serial
import time
import threading
import openfoodfacts
import requests
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
latest_barcode = None

# Initialize OpenFoodFacts API
api = openfoodfacts.API(user_agent="NutriLiz/1.0")

def build_vector(product_data):
    nutriments = product_data.get('nutriments', {})
    
    # Extract key nutrients and normalize them
    carbs = float(nutriments.get('carbohydrates_100g', 0)) / 100.0
    proteins = float(nutriments.get('proteins_100g', 0)) / 100.0
    fats = float(nutriments.get('fat_100g', 0)) / 100.0
    
    return np.array([carbs, proteins, fats], dtype=float)


def fetch_product(barcode):
    try:
        product_data = api.product.get(barcode)
        if product_data and product_data.get('code'):
            return product_data
        return None
    except Exception as e:
        print(f"Failed to fetch product {barcode}: {e}")
        return None


def get_recommendations(barcode, limit=5):
    print(f"Getting recommendations for barcode: {barcode}")
    
    base = fetch_product(barcode)
    if not base:
        print("Base product not found")
        return []
    
    print(f"Base product: {base.get('product_name', 'Unknown')}")
    
    base_vec = build_vector(base)
    
    # Get categories from the base product
    categories = base.get('categories_tags', [])
    print(f"Categories found: {categories}")
    
    if not categories:
        print("No categories avail")
        return []
    
    primary_category = categories[0].replace('en:', '')
    print(f"Searching with category: {primary_category}")
    
    try:
        # Search for products in the same category
        search_params = {
            'categories_tags': primary_category,
            'countries_tags': 'en:philippines',
            'page_size': 50,
            'fields': 'code,product_name,brands,brands_tags,countries,countries_tags,manufacturing_places,nutriments,image_url,image_front_url,image_front_small_url'
        }
        
        search = requests.get(
            "https://world.openfoodfacts.org/api/v2/search",
            params=search_params,
            timeout=10
        )
        search.raise_for_status()
        search_data = search.json()
        candidates = search_data.get('products', [])
        print(f"Found {len(candidates)} PH candidates")
        
    except requests.exceptions.RequestException as e:
        print(f"PH Search API failed: {e}")
        return []
    
    scored = []
    for item in candidates:
        item_code = item.get('code')
        if not item_code or str(item_code) == str(barcode):
            continue
        
        cand_nutrients = item.get('nutriments', {})
        if not cand_nutrients:
            continue
        
        try:
            cand_vector = build_vector({'nutriments': cand_nutrients})
        except (ValueError, TypeError):
            continue
        
        # Check for zero vectors
        if np.linalg.norm(base_vec) == 0 or np.linalg.norm(cand_vector) == 0:
            continue
        
        # Calculate cosine similarity
        score = cosine_similarity([base_vec], [cand_vector])[0][0]
        
        # Get best available image
        image = (item.get('image_url') or 
                item.get('image_front_url') or 
                item.get('image_front_small_url'))
        
        scored.append((score, {
            'code': item_code,
            'barcode': item_code,
            'name': item.get('product_name', 'Unknown'),
            'brand': item.get('brands', 'Unknown'),
            'brands_tags': item.get('brands_tags', []),
            'image_url': image,
            'countries': item.get('countries', 'N/A'),
            'manufacturing_places': item.get('manufacturing_places') or 'Not specified',
            'similarity_score': float(score)
            # 'nutriments': cand_nutrients
        }))
    
    # Sort by similarity score (highest first)
    scored.sort(reverse=True, key=lambda s: s[0])
    result = [c for _, c in scored[:limit]]
    
    print(f"Returning {len(result)} recommendations")
    return result

def get_product_data(barcode):
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
                "brands", "brands_tags"
            ]
        )
        
        if product_data and product_data.get('code'):
            nutriments = product_data.get('nutriments', {})
            ecoscore_data = product_data.get('ecoscore_data', {})
            
            return {
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
            }
        return None
    except Exception as e:
        print(f"SDK request failed: {e}")
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
                line = ser.readline().decode('utf-8').rstrip()
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