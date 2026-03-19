import numpy as np
from difflib import SequenceMatcher
from sklearn.metrics.pairwise import cosine_similarity


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

    if base_brand and cand_brand and base_name and cand_name:
        brand_similarity = SequenceMatcher(None, base_brand, cand_brand).ratio()
        name_similarity = SequenceMatcher(None, base_name, cand_name).ratio()

        if brand_similarity > 0.9 and name_similarity > 0.9:
            return True

    return False


def _compute_candidate_vector(item):
    cand_nutrients = item.get('nutriments', {}) or {}
    if not cand_nutrients:
        return None, 0.0

    try:
        cand_vector = build_vector({'nutriments': cand_nutrients})
        return cand_vector, np.linalg.norm(cand_vector)
    except (ValueError, TypeError):
        return None, 0.0


def _compute_similarity_score(base_vec, base_norm, base_name, candidate):
    cand_vector, cand_norm = _compute_candidate_vector(candidate)
    cand_name = candidate.get('product_name', '').lower().strip()
    name_similarity = SequenceMatcher(None, base_name, cand_name).ratio() if base_name and cand_name else 0.0

    if base_norm > 0.0 and cand_norm > 0.0:
        score = cosine_similarity([base_vec], [cand_vector])[0][0]
        # Small text-similarity blending improves tie-breaks for category-near items.
        return (0.9 * float(score)) + (0.1 * name_similarity)

    if name_similarity > 0.0:
        # Fallback path when nutritional vectors are sparse/missing.
        return 0.15 + (0.7 * name_similarity)

    return None


def _build_recommendation_payload(item, item_code, score):
    image = (
        item.get('image_url') or
        item.get('image_front_url') or
        item.get('image_front_small_url')
    )

    return {
        'code': item_code,
        'barcode': item_code,
        'name': item.get('product_name', 'Unknown'),
        'brand': item.get('brands', 'Unknown'),
        'brands_tags': item.get('brands_tags', []),
        'image_url': image,
        'countries': item.get('countries', 'N/A'),
        'manufacturing_places': item.get('manufacturing_places') or 'Not specified',
        'similarity_score': float(score)
    }


def score_candidates(base_product, base_barcode, base_vec, base_norm, candidates, logger=None):
    scored = []
    base_name = base_product.get('product_name', '').lower().strip()

    for item in candidates:
        item_code = item.get('code')
        if not item_code:
            continue

        if is_same_product(base_product, item, base_barcode, item_code):
            if logger:
                logger(f"Skipping same product: {item.get('product_name')} ({item_code})")
            continue

        score = _compute_similarity_score(base_vec, base_norm, base_name, item)
        if score is None:
            continue

        scored.append((score, _build_recommendation_payload(item, item_code, score)))

    return scored