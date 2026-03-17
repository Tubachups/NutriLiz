import requests
import numpy as np
import openfoodfacts
from sklearn.metrics.pairwise import cosine_similarity
from difflib import SequenceMatcher

# Initialize OpenFoodFacts API
api = openfoodfacts.API(user_agent="NutriLiz/1.0")


def _to_float(value, default=0.0):
    try:
        if value is None or value == '' or value == 'N/A':
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _pick_nutriment(nutriments, keys):
    for key in keys:
        if key in nutriments and nutriments[key] not in (None, '', 'N/A'):
            return nutriments[key]
    return None

def build_vector(product_data):
    nutriments = product_data.get('nutriments', {})

    carbs_value = _pick_nutriment(nutriments, ['carbohydrates_100g', 'carbohydrates_100ml', 'carbohydrates_serving', 'carbohydrates_prepared_100g', 'carbohydrates_prepared_100ml', 'carbohydrates_prepared_serving', 'carbohydrates'])
    proteins_value = _pick_nutriment(nutriments, ['proteins_100g', 'proteins_100ml', 'proteins_serving', 'proteins_prepared_100g', 'proteins_prepared_100ml', 'proteins_prepared_serving', 'proteins'])
    fats_value = _pick_nutriment(nutriments, ['fat_100g', 'fat_100ml', 'fat_serving', 'fat_prepared_100g', 'fat_prepared_100ml', 'fat_prepared_serving', 'fat'])
    sugars_value = _pick_nutriment(nutriments, ['sugars_100g', 'sugars_100ml', 'sugars_serving', 'sugars_prepared_100g', 'sugars_prepared_100ml', 'sugars_prepared_serving', 'sugars'])
    fiber_value = _pick_nutriment(nutriments, ['fiber_100g', 'fiber_100ml', 'fiber_serving', 'fiber_prepared_100g', 'fiber_prepared_100ml', 'fiber_prepared_serving', 'fiber'])
    saturated_fat_value = _pick_nutriment(nutriments, ['saturated-fat_100g', 'saturated-fat_100ml', 'saturated-fat_serving', 'saturated-fat_prepared_100g', 'saturated-fat_prepared_100ml', 'saturated-fat_prepared_serving', 'saturated-fat'])
    salt_value = _pick_nutriment(nutriments, ['salt_100g', 'salt_100ml', 'salt_serving', 'salt_prepared_100g', 'salt_prepared_100ml', 'salt_prepared_serving', 'salt'])
    sodium_value = _pick_nutriment(nutriments, ['sodium_100g', 'sodium_100ml', 'sodium_serving', 'sodium_prepared_100g', 'sodium_prepared_100ml', 'sodium_prepared_serving', 'sodium'])

    kcal_value = _pick_nutriment(nutriments, ['energy-kcal_100g', 'energy-kcal_100ml', 'energy-kcal_serving', 'energy-kcal_prepared_100g', 'energy-kcal_prepared_100ml', 'energy-kcal_prepared_serving', 'energy-kcal', 'energy-kcal_value'])
    kj_value = _pick_nutriment(nutriments, ['energy-kj_100g', 'energy-kj_100ml', 'energy-kj_serving', 'energy-kj_prepared_100g', 'energy-kj_prepared_100ml', 'energy-kj_prepared_serving', 'energy-kj', 'energy_100g', 'energy_100ml', 'energy_serving', 'energy'])

    energy_kcal = _to_float(kcal_value)
    if energy_kcal == 0.0:
        energy_kj = _to_float(kj_value)
        if energy_kj > 0.0:
            energy_kcal = energy_kj / 4.184
    
    # Extract key nutrients and normalize them (per 100g for standardization)
    carbs = _to_float(carbs_value) / 100.0
    proteins = _to_float(proteins_value) / 100.0
    fats = _to_float(fats_value) / 100.0
    
    sugars = _to_float(sugars_value) / 100.0
    fiber = _to_float(fiber_value) / 100.0
    saturated_fat = _to_float(saturated_fat_value) / 100.0
    salt = _to_float(salt_value) / 10.0  # Normalize to ~0-1 range
    sodium = _to_float(sodium_value) / 10.0  # Normalize to ~0-1 range
    
    # Energy (normalize kcal to 0-1 range, assuming max ~900 kcal per 100g)
    energy = energy_kcal / 900.0
    
    # Micronutrients (if available)
    calcium = _to_float(_pick_nutriment(nutriments, ['calcium_100g', 'calcium_100ml', 'calcium_serving', 'calcium'])) / 1000.0  # Normalize mg
    
    # Quality indicators
    nova_group = _to_float(product_data.get('nova_group', nutriments.get('nova_group', 0))) / 4.0
    
    return np.array([
        carbs, proteins, fats, sugars, fiber, 
        saturated_fat, salt, sodium, energy, 
        calcium, nova_group
    ], dtype=float)


def fetch_product(barcode):
    try:
        raw_data = api.product.get(barcode)
        if not raw_data:
            return None

        # SDK can return flat payload or nested under `product`.
        product_data = raw_data.get('product', raw_data)
        if isinstance(product_data, dict) and (product_data.get('code') or raw_data.get('code')):
            return product_data
        return None
    except Exception as e:
        print(f"Failed to fetch product {barcode}: {e}")
        return None


def is_same_product(base_product, candidate_product, base_barcode, candidate_barcode):
    """
    Check if candidate is the same product as base product.
    Compares barcode, brand, and product name.
    """
    # Normalize barcodes for comparison
    base_code = str(base_barcode).strip().lstrip('0')
    cand_code = str(candidate_barcode).strip().lstrip('0')
    
    # Check if barcodes match (ignoring leading zeros)
    if base_code == cand_code:
        return True
    
    # Check brand similarity
    base_brand = base_product.get('brands', '').lower().strip()
    cand_brand = candidate_product.get('brands', '').lower().strip()
    
    # Check product name similarity
    base_name = base_product.get('product_name', '').lower().strip()
    cand_name = candidate_product.get('product_name', '').lower().strip()
    
    # If both brand and name are very similar (>90% match), consider it the same product
    if base_brand and cand_brand and base_name and cand_name:
        brand_similarity = SequenceMatcher(None, base_brand, cand_brand).ratio()
        name_similarity = SequenceMatcher(None, base_name, cand_name).ratio()
        
        if brand_similarity > 0.9 and name_similarity > 0.9:
            return True
    
    return False

def get_recommendations(barcode, limit=9):
    print(f"Getting recommendations for barcode: {barcode}")
    
    # Normalize barcode to string for consistent comparison
    base_barcode = str(barcode).strip()
    
    # Fetch the base product
    base = fetch_product(base_barcode)
    if not base:
        print("Base product not found")
        return []
    
    print(f"Base product: {base.get('product_name', 'Unknown')} - {base.get('brands', 'Unknown')}")
    
    # Build feature vector for base product
    base_vec = build_vector(base)
    
    # Get categories from the base product
    categories = base.get('categories_tags', [])
    print(f"Categories found: {categories}")
    
    if not categories:
        print("No categories available")
        return []
    
    primary_category = categories[0].replace('en:', '')
    print(f"Searching with category: {primary_category}")
    
    try:
        # Search for products in the same category
        search_params = {
            'categories_tags': primary_category,
            'countries_tags': 'en:philippines',
            'page_size': 25,
            'fields': 'code,product_name,brands,brands_tags,countries,countries_tags,manufacturing_places,nutriments,image_url,image_front_url,image_front_small_url'
        }
        
        search = requests.get(
            "https://world.openfoodfacts.org/api/v2/search",
            params=search_params,
            # timeout=30
        )
        search.raise_for_status()
        search_data = search.json()
        candidates = search_data.get('products', [])
        print(f"Found {len(candidates)} PH candidates")
        
    except requests.exceptions.RequestException as e:
        print(f"PH Search API failed: {e}")
        return []
    
    # Score each candidate product
    scored = []
    for item in candidates:
        item_code = item.get('code')
        
        # Skip if no code
        if not item_code:
            continue
        
        # Skip if it's the same product (by barcode, brand, or name)
        if is_same_product(base, item, base_barcode, item_code):
            print(f"Skipping same product: {item.get('product_name')} ({item_code})")
            continue
        
        cand_nutrients = item.get('nutriments', {})
        if not cand_nutrients:
            continue
        
        try:
            cand_vector = build_vector({'nutriments': cand_nutrients})
        except (ValueError, TypeError):
            continue
        
        # Check for zero vectors (would cause division by zero)
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
        }))
    
    # Sort by similarity score (highest first)
    scored.sort(reverse=True, key=lambda s: s[0])
    result = [c for _, c in scored[:limit]]
    
    print(f"Returning {len(result)} recommendations (excluding base product)")
    return result 