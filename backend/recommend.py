import requests
import numpy as np
import openfoodfacts
import json
import os
import time
from recommend_scoring import build_vector, score_candidates

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
    # Restrict search to local market products only.
    country_scopes = ['en:philippines']

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
    
    scored = score_candidates(
        base_product=base,
        base_barcode=base_barcode,
        base_vec=base_vec,
        base_norm=base_norm,
        candidates=candidates,
        logger=log_recommendation
    )
    
    # Sort by similarity score (highest first)
    scored.sort(reverse=True, key=lambda s: s[0])
    result = [c for _, c in scored[:limit]]
    _cache_set(RECOMMENDATION_CACHE, cache_key, result)

    log_recommendation(f"Returning {len(result)} recommendations (excluding base product)")
    return result
