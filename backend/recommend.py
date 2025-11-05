import requests
import numpy as np
import openfoodfacts
from sklearn.metrics.pairwise import cosine_similarity
from difflib import SequenceMatcher

# Initialize OpenFoodFacts API
api = openfoodfacts.API(user_agent="NutriLiz/1.0")

def build_vector(product_data):
    nutriments = product_data.get('nutriments', {})
    
    # Extract key nutrients and normalize them (per 100g for standardization)
    carbs = float(nutriments.get('carbohydrates_100g', 0)) / 100.0
    proteins = float(nutriments.get('proteins_100g', 0)) / 100.0
    fats = float(nutriments.get('fat_100g', 0)) / 100.0
    
    sugars = float(nutriments.get('sugars_100g', 0)) / 100.0
    fiber = float(nutriments.get('fiber_100g', 0)) / 100.0
    saturated_fat = float(nutriments.get('saturated-fat_100g', 0)) / 100.0
    salt = float(nutriments.get('salt_100g', 0)) / 10.0  # Normalize to ~0-1 range
    sodium = float(nutriments.get('sodium_100g', 0)) / 10.0  # Normalize to ~0-1 range
    
    # Energy (normalize kcal to 0-1 range, assuming max ~900 kcal per 100g)
    energy = float(nutriments.get('energy-kcal_100g', 0)) / 900.0
    
    # Micronutrients (if available)
    calcium = float(nutriments.get('calcium_100g', 0)) / 1000.0  # Normalize mg
    
    # Quality indicators
    nova_group = float(nutriments.get('nova_group', 0)) / 4.0
    
    return np.array([
        carbs, proteins, fats, sugars, fiber, 
        saturated_fat, salt, sodium, energy, 
        calcium, nova_group
    ], dtype=float)


def fetch_product(barcode):
    try:
        product_data = api.product.get(barcode)
        if product_data and product_data.get('code'):
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