import re

import requests

from food_recognition_config import (
    NUTRIENT_NUMBER_MAP,
    OFF_SEARCH_CACHE,
    OPENFOODFACTS_BASE_URL,
    USDA_ALLOWED_DATA_TYPES,
    USDA_API_KEY,
    USDA_BASE_URL,
    USDA_PROCESSED_KEYWORDS,
    USDA_SEARCH_CACHE,
    cache_get,
    cache_set,
)
from food_recognition_helpers import (
    extract_quantity_value,
    normalize_food_text,
    resolve_local_dish_mapping,
)


def get_openfoodfacts_nutrition(food_data: dict, fast_mode: bool = False) -> dict:
    """Try Open Food Facts first for labeled products and normalize output to app schema."""
    queries = build_openfoodfacts_queries(food_data, fast_mode=fast_mode)
    target_quantity = extract_quantity_value(' '.join([
        str(food_data.get('food_name', '')),
        str(food_data.get('serving_size', '')),
        str(food_data.get('description', ''))
    ]))

    for query in queries:
        product = search_openfoodfacts_product(query, target_quantity=target_quantity)
        if not product:
            continue

        nutrition_per_100g = extract_openfoodfacts_nutrition(product)
        if not nutrition_per_100g:
            continue

        nutri_score = str(product.get('nutriscore_grade', '')).strip().upper()
        if nutri_score not in {'A', 'B', 'C', 'D', 'E'}:
            nutri_score = None

        return {
            'code': product.get('code'),
            'product_name': product.get('product_name') or product.get('product_name_en') or query,
            'brands': product.get('brands'),
            'quantity': product.get('quantity'),
            'nutri_score': nutri_score,
            'nutrition_per_100g': nutrition_per_100g
        }

    return {}


def build_openfoodfacts_queries(food_data: dict, fast_mode: bool = False) -> list:
    """Generate deduplicated OFF search queries from recognized food fields."""
    raw_queries = [
        str(food_data.get('food_name', '')).strip(),
        str(food_data.get('food_name_local', '')).strip(),
    ]

    if fast_mode:
        primary = raw_queries[0] or raw_queries[1]
        return [primary.strip()] if primary and primary.strip() else []

    serving_size = str(food_data.get('serving_size', '')).strip()
    if raw_queries[0] and serving_size and re.search(r'\d', serving_size):
        raw_queries.append(f"{raw_queries[0]} {serving_size}")

    if isinstance(food_data.get('ingredients_if_dish'), list):
        for ingredient in food_data.get('ingredients_if_dish', [])[:2]:
            if ingredient:
                raw_queries.append(str(ingredient).strip())

    deduped = []
    seen = set()
    for query in raw_queries:
        cleaned = re.sub(r'\s+', ' ', query).strip()
        if not cleaned:
            continue
        lowered = cleaned.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        deduped.append(cleaned)

    return deduped


def search_openfoodfacts_product(query: str, target_quantity: float = None) -> dict:
    """Search Open Food Facts and return the best ranked product for the query."""
    if not query:
        return {}

    cache_key = f"{normalize_food_text(query)}:{round(target_quantity, 2) if target_quantity is not None else 'none'}"
    cache_hit, cached = cache_get(OFF_SEARCH_CACHE, cache_key)
    if cache_hit:
        return cached

    try:
        response = requests.get(
            f"{OPENFOODFACTS_BASE_URL}/cgi/search.pl",
            params={
                'search_terms': query,
                'search_simple': 1,
                'action': 'process',
                'json': 1,
                'page_size': 20,
                'fields': 'code,product_name,product_name_en,brands,quantity,nutriments,nutriscore_grade'
            },
            timeout=10
        )
        response.raise_for_status()
        payload = response.json()
        products = payload.get('products', [])
        if not products:
            return {}

        query_lower = query.lower().strip()
        query_tokens = re.findall(r'[a-z0-9]+', query_lower)

        def rank(product):
            name = (product.get('product_name') or product.get('product_name_en') or '').lower()
            name_tokens = re.findall(r'[a-z0-9]+', name)
            starts_with = name.startswith(query_lower)

            overlap = 0
            for token in query_tokens:
                if token in name_tokens or any(nt.startswith(token) for nt in name_tokens):
                    overlap += 1

            quantity_penalty = 0
            if target_quantity is not None:
                product_quantity = extract_quantity_value(str(product.get('quantity', '')))
                quantity_penalty = abs(product_quantity - target_quantity) if product_quantity is not None else 999

            return (
                not starts_with,
                quantity_penalty,
                -overlap,
                len(name)
            )

        products_sorted = sorted(products, key=rank)
        best = products_sorted[0]
        cache_set(OFF_SEARCH_CACHE, cache_key, best)
        return best
    except Exception as e:
        print(f"Error searching Open Food Facts for '{query}': {e}")
        return {}


def extract_openfoodfacts_nutrition(product: dict) -> dict:
    """Extract macro nutrition from Open Food Facts product data as per-100g values."""
    nutriments = product.get('nutriments', {}) if isinstance(product, dict) else {}
    if not nutriments:
        return {}

    def to_float(value):
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    calories = to_float(nutriments.get('energy-kcal_100g'))
    if calories is None:
        calories = to_float(nutriments.get('energy-kcal'))

    sodium_mg = to_float(nutriments.get('sodium_100g'))
    if sodium_mg is not None:
        sodium_mg = sodium_mg * 1000
    else:
        salt_g = to_float(nutriments.get('salt_100g'))
        if salt_g is not None:
            sodium_mg = salt_g * 393.4

    result = {
        'calories': calories,
        'protein_g': to_float(nutriments.get('proteins_100g')),
        'carbohydrates_g': to_float(nutriments.get('carbohydrates_100g')),
        'fat_g': to_float(nutriments.get('fat_100g')),
        'fiber_g': to_float(nutriments.get('fiber_100g')),
        'sugar_g': to_float(nutriments.get('sugars_100g')),
        'sodium_mg': sodium_mg,
        'saturated_fat_g': to_float(nutriments.get('saturated-fat_100g')),
    }

    if all(value is None for value in result.values()):
        return {}

    return {
        key: (round(value, 2) if value is not None else None)
        for key, value in result.items()
    }


def get_usda_nutrition(food_name: str, ingredients=None, fast_mode: bool = False) -> dict:
    """Look up nutrition from USDA FoodData Central and normalize to app schema."""
    if not USDA_API_KEY or not food_name:
        return {}

    queries = [food_name]
    mapping = resolve_local_dish_mapping(food_name)
    if mapping:
        queries = [mapping.get('canonical_name', food_name)] + list(mapping.get('usda_queries', [])) + queries

    if isinstance(ingredients, list):
        queries.extend([str(item).strip() for item in ingredients if item])

    seen = set()
    deduped_queries = []
    for query in queries:
        lowered = query.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        deduped_queries.append(query)

    query_batches = [deduped_queries]
    if fast_mode and deduped_queries:
        query_batches = [[deduped_queries[0]], deduped_queries[1:]]

    for query_batch in query_batches:
        for query in query_batch:
            food = search_fooddata_central(query)
            if not food:
                continue

            nutrition_per_100g = extract_nutrition_per_100g(food)
            if not nutrition_per_100g:
                continue

            return {
                'fdc_id': food.get('fdcId'),
                'description': food.get('description', query),
                'data_type': food.get('dataType'),
                'nutrition_per_100g': nutrition_per_100g
            }

    return {}


def search_fooddata_central(query: str) -> dict:
    """Search USDA FoodData Central and return the best match."""
    if not USDA_API_KEY or not query:
        return {}

    cache_key = normalize_food_text(query)
    cache_hit, cached = cache_get(USDA_SEARCH_CACHE, cache_key)
    if cache_hit:
        return cached

    try:
        response = requests.get(
            f"{USDA_BASE_URL}/foods/search",
            params={
                'api_key': USDA_API_KEY,
                'query': query,
                'pageSize': 10,
                'dataType': list(USDA_ALLOWED_DATA_TYPES)
            },
            timeout=10
        )
        response.raise_for_status()
        payload = response.json()
        foods = payload.get('foods', [])
        if not foods:
            return {}

        filtered = [
            item for item in foods
            if str(item.get('dataType', '')).strip() in USDA_ALLOWED_DATA_TYPES
        ]
        if not filtered:
            return {}

        query_lower = query.lower().strip()
        query_tokens = [t for t in re.findall(r'[a-z]+', query_lower) if t]

        def rank(item):
            desc = str(item.get('description', '')).lower()
            desc_tokens = [t for t in re.findall(r'[a-z]+', desc) if t]
            starts_with = desc.startswith(query_lower)

            token_overlap = 0
            for token in query_tokens:
                if any(dt.startswith(token) or token.startswith(dt) for dt in desc_tokens):
                    token_overlap += 1

            processed_penalty = sum(
                1 for keyword in USDA_PROCESSED_KEYWORDS
                if keyword in desc and keyword not in query_lower
            )
            has_raw = 'raw' in desc

            return (
                processed_penalty,
                not starts_with,
                not has_raw,
                -token_overlap,
                len(desc)
            )

        foods_sorted = sorted(filtered, key=rank)
        best = foods_sorted[0]
        cache_set(USDA_SEARCH_CACHE, cache_key, best)
        return best
    except Exception as e:
        print(f"Error searching USDA for '{query}': {e}")
        return {}


def extract_nutrition_per_100g(food: dict) -> dict:
    """Extract normalized macro nutrition fields from USDA search result."""
    food_nutrients = food.get('foodNutrients', [])
    if not food_nutrients:
        return {}

    result = {}
    for app_key, nutrient_number in NUTRIENT_NUMBER_MAP.items():
        value = None
        for nutrient in food_nutrients:
            nutrient_meta = nutrient.get('nutrient', {}) if isinstance(nutrient, dict) else {}
            current_number = str(
                nutrient.get('nutrientNumber')
                or nutrient_meta.get('number')
                or ''
            ).strip()
            if current_number == nutrient_number:
                nutrient_value = nutrient.get('value')
                if nutrient_value is None:
                    nutrient_value = nutrient.get('amount')
                try:
                    value = float(nutrient_value) if nutrient_value is not None else None
                except (TypeError, ValueError):
                    value = None
                break

        result[app_key] = round(value, 2) if value is not None else None

    return result
