import requests
import numpy as np
import openfoodfacts
from sklearn.metrics.pairwise import cosine_similarity
from difflib import SequenceMatcher
import json
import os
import time

# Initialize OpenFoodFacts API
api = openfoodfacts.API(user_agent="NutriLiz/1.0")

RECOMMENDATION_CACHE_TTL_SECONDS = int(os.getenv('RECOMMENDATION_CACHE_TTL_SECONDS', '300'))
RECOMMENDATION_CACHE_MAX_ITEMS = int(os.getenv('RECOMMENDATION_CACHE_MAX_ITEMS', '500'))
OPENFOODFACTS_TIMEOUT_SECONDS = int(os.getenv('OPENFOODFACTS_TIMEOUT_SECONDS', '20'))

RECOMMENDATION_CACHE = {}
PRODUCT_CACHE = {}
CATEGORY_SEARCH_CACHE = {}


def log_recommendation(message):
    print(f"[Recommendations] {message}")


def _clone_data(value):
    return json.loads(json.dumps(value))


def _cache_get(cache, key):
    entry = cache.get(key)
    if not entry:
        return False, None

    expires_at, value = entry
    if expires_at < time.time():
        cache.pop(key, None)
        return False, None

    return True, _clone_data(value)


def _cache_set(cache, key, value):
    now = time.time()

    if len(cache) >= RECOMMENDATION_CACHE_MAX_ITEMS:
        expired_keys = [k for k, (exp, _) in cache.items() if exp < now]
        for old_key in expired_keys:
            cache.pop(old_key, None)

    if len(cache) >= RECOMMENDATION_CACHE_MAX_ITEMS and cache:
        oldest_key = min(cache.items(), key=lambda item: item[1][0])[0]
        cache.pop(oldest_key, None)

    cache[key] = (now + RECOMMENDATION_CACHE_TTL_SECONDS, _clone_data(value))


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


def _normalize_category_tag(tag):
    value = str(tag or '').strip().lower()
    if not value:
        return ''
    if value.startswith('en:'):
        return value
    return f"en:{value}"


def _category_search_key(category_tag, countries_tag, page_size):
    country_part = countries_tag or 'global'
    return f"{category_tag}:{country_part}:{int(page_size)}"


def _search_products_by_category(category_tag, countries_tag=None, page_size=50):
    cache_key = _category_search_key(category_tag, countries_tag, page_size)
    cache_hit, cached_candidates = _cache_get(CATEGORY_SEARCH_CACHE, cache_key)
    if cache_hit:
        log_recommendation(
            f"Using cached category candidates: category={category_tag} country={countries_tag or 'global'} count={len(cached_candidates)}"
        )
        return cached_candidates

    search_params = {
        'categories_tags': category_tag,
        'page_size': int(page_size),
        'fields': 'code,product_name,brands,brands_tags,countries,countries_tags,manufacturing_places,nutriments,image_url,image_front_url,image_front_small_url'
    }
    if countries_tag:
        search_params['countries_tags'] = countries_tag

    search = requests.get(
        "https://world.openfoodfacts.org/api/v2/search",
        params=search_params,
        timeout=20
    )
    search.raise_for_status()
    search_data = search.json()
    candidates = search_data.get('products', [])
    _cache_set(CATEGORY_SEARCH_CACHE, cache_key, candidates)
    return candidates

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
    barcode_key = str(barcode).strip()
    cache_hit, cached_product = _cache_get(PRODUCT_CACHE, barcode_key)
    if cache_hit:
        return cached_product

    # Prefer direct API call with explicit timeout for predictable behavior.
    try:
        response = requests.get(
            f"https://world.openfoodfacts.org/api/v2/product/{barcode_key}.json",
            timeout=OPENFOODFACTS_TIMEOUT_SECONDS
        )
        response.raise_for_status()
        payload = response.json() or {}
        product_data = payload.get('product', payload)
        if isinstance(product_data, dict) and (product_data.get('code') or barcode_key):
            _cache_set(PRODUCT_CACHE, barcode_key, product_data)
            return product_data
    except Exception as e:
        log_recommendation(f"Direct API fetch failed for product {barcode_key}: {e}")

    # Keep SDK call as secondary fallback.
    try:
        raw_data = api.product.get(barcode)
        if not raw_data:
            return None

        # SDK can return flat payload or nested under `product`.
        product_data = raw_data.get('product', raw_data)
        if isinstance(product_data, dict) and (product_data.get('code') or raw_data.get('code')):
            _cache_set(PRODUCT_CACHE, barcode_key, product_data)
            return product_data
        return None
    except Exception as e:
        log_recommendation(f"Failed to fetch product {barcode}: {e}")
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
    log_recommendation(f"Start barcode={barcode} limit={limit}")
    limit = max(1, int(limit))
    candidate_budget = limit
    
    # Normalize barcode to string for consistent comparison
    base_barcode = str(barcode).strip()
    cache_key = f"{base_barcode}:{int(limit)}"
    cache_hit, cached_recommendations = _cache_get(RECOMMENDATION_CACHE, cache_key)
    if cache_hit:
        log_recommendation(f"Cache hit for barcode={base_barcode} count={len(cached_recommendations)}")
        return cached_recommendations
    
    # Fetch the base product
    base = fetch_product(base_barcode)
    if not base:
        log_recommendation("Base product not found")
        return []

    log_recommendation(
        f"Base product: {base.get('product_name', 'Unknown')} - {base.get('brands', 'Unknown')}"
    )
    
    # Build feature vector for base product
    base_vec = build_vector(base)
    base_norm = np.linalg.norm(base_vec)
    
    # Get categories from the base product
    categories = base.get('categories_tags', [])
    log_recommendation(f"Categories found: {categories}")
    
    if not categories:
        log_recommendation("No categories available")
        return []
    
    # Prefer specific categories first (usually at the end of OFF category list).
    normalized_categories = [_normalize_category_tag(tag) for tag in categories]
    normalized_categories = [tag for tag in normalized_categories if tag]
    category_candidates = list(reversed(normalized_categories))
    if len(category_candidates) > 5:
        category_candidates = category_candidates[:5]

    candidates = []
    seen_codes = set()
    country_scopes = ['en:philippines', None]

    for category_tag in category_candidates:
        if len(candidates) >= candidate_budget:
            break

        log_recommendation(f"Searching category={category_tag}")

        for country_tag in country_scopes:
            try:
                found = _search_products_by_category(
                    category_tag=category_tag,
                    countries_tag=country_tag,
                    page_size=candidate_budget
                )
                log_recommendation(
                    f"Found {len(found)} candidates category={category_tag} country={country_tag or 'global'}"
                )
            except requests.exceptions.RequestException as e:
                log_recommendation(
                    f"Category search failed category={category_tag} country={country_tag or 'global'}: {e}"
                )
                continue

            for product in found:
                code = str(product.get('code', '')).strip()
                if not code or code in seen_codes:
                    continue
                seen_codes.add(code)
                candidates.append(product)

            if len(candidates) >= candidate_budget:
                break

    if not candidates:
        log_recommendation("No candidates found across category/country fallbacks")
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
            log_recommendation(f"Skipping same product: {item.get('product_name')} ({item_code})")
            continue
        
        cand_nutrients = item.get('nutriments', {}) or {}
        cand_vector = None
        cand_norm = 0.0

        if cand_nutrients:
            try:
                cand_vector = build_vector({'nutriments': cand_nutrients})
                cand_norm = np.linalg.norm(cand_vector)
            except (ValueError, TypeError):
                cand_vector = None
                cand_norm = 0.0

        base_name = base.get('product_name', '').lower().strip()
        cand_name = item.get('product_name', '').lower().strip()
        name_similarity = SequenceMatcher(None, base_name, cand_name).ratio() if base_name and cand_name else 0.0

        if base_norm > 0.0 and cand_norm > 0.0:
            score = cosine_similarity([base_vec], [cand_vector])[0][0]
            # Small text-similarity blending improves tie-breaks for category-near items.
            score = (0.9 * float(score)) + (0.1 * name_similarity)
        elif name_similarity > 0.0:
            # Fallback path when nutritional vectors are sparse/missing.
            score = 0.15 + (0.7 * name_similarity)
        else:
            continue
        
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
    _cache_set(RECOMMENDATION_CACHE, cache_key, result)

    log_recommendation(f"Returning {len(result)} recommendations (excluding base product)")
    return result
