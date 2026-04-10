import re
import requests
from food_recognition_config import (
    NUTRIENT_MATCHERS,
    USDA_ALLOWED_DATA_TYPES,
    USDA_API_KEY,
    USDA_BASE_URL,
    USDA_DISH_KEYWORDS,
    USDA_PROCESSED_KEYWORDS,
    USDA_SEARCH_CACHE,
    NUTRITION_FIELDS,
    CARB_DENSE_HINTS,
    PROTEIN_DENSE_HINTS,
    LOW_DENSITY_HINTS,
    cache_get,
    cache_set,
)
from food_recognition_helpers import (
    normalize_food_text,
    resolve_local_dish_mapping,
)

def ingredient_weight(ingredient_name: str) -> float:
    """Roughly weight ingredient impact when estimating mixed-dish nutrition."""
    text = normalize_food_text(ingredient_name)
    if not text:
        return 1.0

    if any(hint in text for hint in CARB_DENSE_HINTS):
        return 1.6

    if any(hint in text for hint in PROTEIN_DENSE_HINTS):
        return 1.3

    if any(hint in text for hint in LOW_DENSITY_HINTS):
        return 0.6

    return 1.0


def build_usda_ingredient_blend(ingredients, fast_mode: bool = False) -> dict:
    """Create an ingredient-based per-100g estimate from USDA entries."""
    if not isinstance(ingredients, list):
        return {}

    cleaned_ingredients = []
    seen = set()
    for ingredient in ingredients:
        normalized = normalize_food_text(ingredient)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        cleaned_ingredients.append(str(ingredient).strip())

    if not cleaned_ingredients:
        return {}

    search_limit = 3 if fast_mode else 6
    weighted_components = []

    for ingredient in cleaned_ingredients[:search_limit]:
        food = search_fooddata_central(ingredient)
        if not food:
            continue

        nutrition = extract_nutrition_per_100g(food)
        if not nutrition or all(nutrition.get(key) is None for key in NUTRITION_FIELDS):
            continue

        weighted_components.append({
            'ingredient': ingredient,
            'weight': ingredient_weight(ingredient),
            'fdc_id': food.get('fdcId'),
            'description': food.get('description'),
            'nutrition': nutrition,
        })

    if not weighted_components:
        return {}

    blend = {}
    for field in NUTRITION_FIELDS:
        weighted_values = []
        for component in weighted_components:
            value = component['nutrition'].get(field)
            if value is None:
                continue
            weighted_values.append((value, component['weight']))

        if not weighted_values:
            blend[field] = None
            continue

        total_weight = sum(weight for _, weight in weighted_values)
        if total_weight <= 0:
            blend[field] = None
            continue

        blend[field] = round(
            sum(value * weight for value, weight in weighted_values) / total_weight,
            2
        )

    return {
        'nutrition_per_100g': blend,
        'components': [
            {
                'ingredient': component['ingredient'],
                'fdc_id': component['fdc_id'],
                'description': component['description'],
            }
            for component in weighted_components
        ]
    }


def fill_missing_nutrients(base_nutrition: dict, fallback_nutrition: dict):
    """Fill only None/empty nutrient values from fallback nutrition."""
    if not isinstance(base_nutrition, dict):
        base_nutrition = {}
    if not isinstance(fallback_nutrition, dict):
        fallback_nutrition = {}

    merged = dict(base_nutrition)
    estimated_fields = []

    for field in NUTRITION_FIELDS:
        current = merged.get(field)
        fallback = fallback_nutrition.get(field)

        if current is None and fallback is not None:
            merged[field] = fallback
            estimated_fields.append(field)

    return merged, estimated_fields


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

    best_match = {}

    for query_batch in query_batches:
        for query in query_batch:
            food = search_fooddata_central(query)
            if not food:
                continue

            nutrition_per_100g = extract_nutrition_per_100g(food)
            if not nutrition_per_100g:
                continue

            best_match = {
                'fdc_id': food.get('fdcId'),
                'description': food.get('description', query),
                'data_type': food.get('dataType'),
                'nutrition_per_100g': nutrition_per_100g
            }
            break

        if best_match:
            break

    ingredient_blend = build_usda_ingredient_blend(ingredients, fast_mode=fast_mode)

    if best_match:
        merged_nutrition = best_match['nutrition_per_100g']
        estimated_fields = []

        if ingredient_blend:
            merged_nutrition, estimated_fields = fill_missing_nutrients(
                merged_nutrition,
                ingredient_blend.get('nutrition_per_100g', {})
            )

        best_match['nutrition_per_100g'] = merged_nutrition
        if estimated_fields:
            best_match['estimated_fields'] = estimated_fields
            best_match['estimation_basis'] = 'ingredient_blend_fill'
            best_match['ingredient_matches'] = ingredient_blend.get('components', [])

        return best_match

    if ingredient_blend:
        return {
            'fdc_id': None,
            'description': 'Ingredient blend estimate',
            'data_type': 'Estimated',
            'nutrition_per_100g': ingredient_blend.get('nutrition_per_100g', {}),
            'estimated_fields': [
                field for field in NUTRITION_FIELDS
                if ingredient_blend.get('nutrition_per_100g', {}).get(field) is not None
            ],
            'estimation_basis': 'ingredients_only',
            'ingredient_matches': ingredient_blend.get('components', [])
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
        is_dish_query = any(keyword in query_lower for keyword in USDA_DISH_KEYWORDS)

        def nutrient_coverage_score(item):
            nutrients = item.get('foodNutrients', []) or []
            key_numbers = {'208', '1008', '203', '1003', '205', '1005', '204', '1004'}
            matched = 0
            for nutrient in nutrients:
                nutrient_meta = nutrient.get('nutrient', {}) if isinstance(nutrient, dict) else {}
                nutrient_number = str(
                    nutrient.get('nutrientNumber')
                    or nutrient_meta.get('number')
                    or ''
                ).strip()
                if nutrient_number in key_numbers:
                    matched += 1
            return matched

        def rank(item):
            desc = str(item.get('description', '')).lower()
            desc_tokens = [t for t in re.findall(r'[a-z]+', desc) if t]
            starts_with = desc.startswith(query_lower)

            token_overlap = 0
            for token in query_tokens:
                if any(dt.startswith(token) or token.startswith(dt) for dt in desc_tokens):
                    token_overlap += 1

            processed_penalty = 0
            if not is_dish_query:
                processed_penalty = sum(
                    1 for keyword in USDA_PROCESSED_KEYWORDS
                    if keyword in desc and keyword not in query_lower
                )

            has_raw = 'raw' in desc
            coverage = nutrient_coverage_score(item)

            return (
                processed_penalty,
                not starts_with,
                (not has_raw) if not is_dish_query else False,
                -token_overlap,
                -coverage,
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

    def parse_nutrient_fields(nutrient: dict):
        nutrient_meta = nutrient.get('nutrient', {}) if isinstance(nutrient, dict) else {}

        nutrient_number = str(
            nutrient.get('nutrientNumber')
            or nutrient_meta.get('number')
            or ''
        ).strip()

        nutrient_id = nutrient.get('nutrientId')
        if nutrient_id is None:
            nutrient_id = nutrient_meta.get('id')
        try:
            nutrient_id = int(nutrient_id) if nutrient_id is not None else None
        except (TypeError, ValueError):
            nutrient_id = None

        nutrient_name = str(
            nutrient.get('nutrientName')
            or nutrient_meta.get('name')
            or ''
        ).strip().lower()

        nutrient_value = nutrient.get('value')
        if nutrient_value is None:
            nutrient_value = nutrient.get('amount')
        try:
            nutrient_value = float(nutrient_value) if nutrient_value is not None else None
        except (TypeError, ValueError):
            nutrient_value = None

        return nutrient_number, nutrient_id, nutrient_name, nutrient_value

    parsed_nutrients = [parse_nutrient_fields(nutrient) for nutrient in food_nutrients]

    result = {}
    for app_key, matcher in NUTRIENT_MATCHERS.items():
        matcher_numbers = {str(number).strip() for number in matcher.get('numbers', ())}
        matcher_ids = {int(nid) for nid in matcher.get('ids', ())}
        matcher_names = [name.strip().lower() for name in matcher.get('name_contains', ()) if str(name).strip()]

        value = None
        for current_number, current_id, current_name, current_value in parsed_nutrients:
            number_match = current_number in matcher_numbers if current_number else False
            id_match = current_id in matcher_ids if current_id is not None else False
            name_match = any(name in current_name for name in matcher_names) if current_name else False

            if number_match or id_match or name_match:
                value = current_value
                break

        result[app_key] = round(value, 2) if value is not None else None

    return result
