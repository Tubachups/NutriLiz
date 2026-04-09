import base64
import hashlib
import json
import re

from food_recognition_config import (
    ANALYSIS_CACHE,
    FOOD_ANALYSIS_FAST_MODE,
    cache_get,
    cache_set,
    client,
    to_bool,
)
from food_recognition_helpers import (
    build_health_context,
    ensure_disambiguation_alternatives,
    is_labeled_product,
    normalize_food_text,
    requires_user_confirmation,
    resolve_local_dish_mapping,
)
from food_recognition_sources import (
    build_openfoodfacts_queries,
    extract_nutrition_per_100g,
    extract_openfoodfacts_nutrition,
    extract_quantity_value,
    get_openfoodfacts_nutrition,
    get_usda_nutrition,
    search_fooddata_central,
    search_openfoodfacts_product,
)


SPOILAGE_TERMS_PATTERN = re.compile(
    r'\b(expired|spoil(?:ed|age)?|rotten|mold(?:y)?|mould(?:y)?|rancid|stale|contaminated|unsafe\s+to\s+eat|not\s+safe\s+to\s+eat|food\s+poisoning)\b',
    re.IGNORECASE,
)
UNSAFE_STATUS_VALUES = {'unsafe', 'expired', 'spoiled', 'rotten'}


def annotate_food_safety(food_data: dict) -> dict:
    """Add a normalized expired/spoiled safety signal for frontend handling."""
    if not isinstance(food_data, dict):
        return food_data

    status_value = str(
        food_data.get('food_safety_status') or food_data.get('food_condition') or ''
    ).strip().lower()
    explicit_unsafe = any(
        to_bool(food_data.get(key))
        for key in (
            'is_expired_or_spoiled',
            'expired_or_spoiled',
            'spoilage_detected',
            'is_spoiled',
            'is_expired',
        )
    ) or status_value in UNSAFE_STATUS_VALUES

    potential_concerns = food_data.get('potential_concerns')
    concerns_text = ''
    if isinstance(potential_concerns, list):
        concerns_text = ' '.join(str(item) for item in potential_concerns if item)

    text_blob = ' '.join(
        str(part)
        for part in (
            food_data.get('food_safety_note', ''),
            food_data.get('description', ''),
            food_data.get('preparation_notes', ''),
            concerns_text,
        )
        if part
    )
    text_indicates_unsafe = bool(SPOILAGE_TERMS_PATTERN.search(text_blob))
    is_expired_or_spoiled = explicit_unsafe or text_indicates_unsafe

    if is_expired_or_spoiled:
        default_reason = 'This food appears expired or spoiled and may be unsafe to consume.'
        reason = str(food_data.get('food_safety_note') or '').strip() or default_reason
        food_data['is_expired_or_spoiled'] = True
        food_data['food_safety_status'] = 'unsafe'
        food_data['food_safety_note'] = reason
    else:
        food_data.setdefault('is_expired_or_spoiled', False)
        if not str(food_data.get('food_safety_status') or '').strip():
            food_data['food_safety_status'] = 'safe'

    return food_data


def analyze_food_image(image_data: str, user_profile: dict = None) -> dict:
    """
    Analyze a food image using Gemini Vision API.

    Args:
        image_data: Base64 encoded image string
        user_profile: Optional user health profile for personalized assessment

    Returns:
        Dictionary with food identification and nutritional info
    """
    try:
        prompt = """Analyze this food image and provide detailed information in the following JSON format:

{
    "identified": true/false,
    "confidence": "high/medium/low",
    "has_visible_label_or_packaging": true/false,
    "food_name": "Name of the food",
    "food_name_local": "Local/regional name if applicable",
    "category": "Category (e.g., Fruit, Vegetable, Meat, Dairy, Grain, etc.)",
    "description": "Brief description of the food",
    "food_safety_status": "safe/unsafe/uncertain",
    "is_expired_or_spoiled": true/false,
    "food_safety_note": "Brief note if unsafe or uncertain",
    "serving_size": "Estimated serving size shown",
    "nutrition_per_100g": {
        "calories": null,
        "protein_g": null,
        "carbohydrates_g": null,
        "fat_g": null,
        "fiber_g": null,
        "sugar_g": null,
        "sodium_mg": null,
        "saturated_fat_g": null
    },
    "health_benefits": ["benefit1", "benefit2"],
    "potential_concerns": ["concern1", "concern2"],
    "allergens": ["allergen1", "allergen2"],
    "dietary_info": {
        "is_vegetarian": true/false,
        "is_vegan": true/false,
        "is_gluten_free": true/false,
        "is_dairy_free": true/false
    },
    "nutri_score_estimate": "A/B/C/D/E",
    "ingredients_if_dish": ["ingredient1", "ingredient2"],
    "preparation_notes": "How the food appears to be prepared",
    "disambiguation_needed": false,
    "alternatives": []
}

If you cannot identify the food or it's not a food item, set "identified" to false and explain in the description.
Do not estimate nutrition values. Keep nutrition fields null, they will be populated from an external nutrition database.

Set "disambiguation_needed" to true only when the exact food identity is genuinely ambiguous due to:
1. The food appears to be an unlabeled liquid (e.g., tea, juice, smoothie, soup, broth, coffee, unknown drink) where the specific variety cannot be reliably determined from the image alone.
2. The dish has heavy sauces, dressings, gravies, or toppings that significantly obscure the identity of the underlying main food item (e.g., pasta completely submerged in sauce, a salad fully drenched in thick dressing).
3. The dish appears to be a regional noodle dish with broth/sauce where lookalike noodle dishes are common (e.g., Lomi vs Pancit Canton vs Mami).
When "disambiguation_needed" is true, populate "alternatives" with 2-3 of the most plausible food names as candidates for what is shown.
In all other cases, keep "disambiguation_needed" as false and "alternatives" as an empty array.

Set "has_visible_label_or_packaging" to true only when there are explicit visible cues of commercial packaging or labels
(for example: branded wrappers, product labels, bottle/can labels, nutrition panel, barcodes, clear package text).
For plated, home-cooked, unpacked, or unlabeled foods, set it to false.

Set "is_expired_or_spoiled" to true only if there are clear visual signs that the food is likely spoiled or expired,
such as mold growth, obvious rot, severe discoloration consistent with spoilage, or visibly decomposed texture.
When true, set "food_safety_status" to "unsafe" and provide a short explanation in "food_safety_note".
Otherwise set "is_expired_or_spoiled" to false and use "food_safety_status" as "safe" or "uncertain".

Return ONLY valid JSON, no additional text."""

        profile_payload = ''
        if user_profile:
            try:
                profile_payload = json.dumps(user_profile, sort_keys=True, default=str)
            except Exception:
                profile_payload = str(user_profile)

        image_hash = hashlib.sha256(image_data.encode('utf-8')).hexdigest()
        profile_hash = hashlib.sha256(profile_payload.encode('utf-8')).hexdigest() if profile_payload else 'none'
        analysis_cache_key = f"{image_hash}:{profile_hash}:{int(FOOD_ANALYSIS_FAST_MODE)}"

        cache_hit, cached_food_data = cache_get(ANALYSIS_CACHE, analysis_cache_key)
        if cache_hit:
            return {
                'success': True,
                'data': cached_food_data
            }

        if user_profile:
            health_context = build_health_context(user_profile)
            prompt += f"\n\nUser Health Context:\n{health_context}\n\nAlso include a 'personalized_advice' field with specific recommendations for this user."

        mime_type = "image/jpeg"
        try:
            image_bytes = base64.b64decode(image_data)
            if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
                mime_type = "image/png"
            elif image_bytes[:2] == b'\xff\xd8':
                mime_type = "image/jpeg"
            elif image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
                mime_type = "image/webp"
        except Exception:
            pass

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": image_data
                            }
                        }
                    ]
                }
            ]
        )

        response_text = response.text.strip()

        if response_text.startswith("```"):
            response_text = re.sub(r'^```json?\n?', '', response_text)
            response_text = re.sub(r'\n?```$', '', response_text)

        food_data = json.loads(response_text)

        annotate_food_safety(food_data)

        if food_data.get('identified') and not to_bool(food_data.get('is_expired_or_spoiled')):
            confirmation_required = requires_user_confirmation(food_data)
            has_visible_packaging = to_bool(food_data.get('has_visible_label_or_packaging'))
            heuristic_labeled_product = is_labeled_product(food_data)
            off_lookup_allowed = has_visible_packaging or heuristic_labeled_product
            if confirmation_required:
                food_data['disambiguation_needed'] = True
                food_data['alternatives'] = ensure_disambiguation_alternatives(food_data)
                food_data['nutrition_pending_confirmation'] = True

            if off_lookup_allowed:
                off_nutrition = get_openfoodfacts_nutrition(food_data, fast_mode=FOOD_ANALYSIS_FAST_MODE)
                if off_nutrition:
                    food_data['nutrition_per_100g'] = off_nutrition['nutrition_per_100g']
                    food_data['nutrition_source'] = 'open_food_facts'
                    food_data['openfoodfacts_match'] = {
                        'code': off_nutrition.get('code'),
                        'product_name': off_nutrition.get('product_name'),
                        'brands': off_nutrition.get('brands'),
                        'quantity': off_nutrition.get('quantity')
                    }
                    if off_nutrition.get('nutri_score'):
                        food_data['nutri_score_estimate'] = off_nutrition['nutri_score']
                    if not food_data.get('serving_size') and off_nutrition.get('quantity'):
                        food_data['serving_size'] = off_nutrition['quantity']
                    food_data['label_detection'] = {
                        'has_visible_label_or_packaging': has_visible_packaging,
                        'heuristic_labeled_product': heuristic_labeled_product,
                        'off_lookup_allowed': off_lookup_allowed
                    }

            if not food_data.get('nutrition_source') and not confirmation_required:
                usda_nutrition = get_usda_nutrition(
                    food_name=food_data.get('food_name', ''),
                    ingredients=food_data.get('ingredients_if_dish', []),
                    fast_mode=FOOD_ANALYSIS_FAST_MODE
                )
                if usda_nutrition:
                    food_data['nutrition_per_100g'] = usda_nutrition['nutrition_per_100g']
                    food_data['nutrition_source'] = 'usda_fooddata_central'
                    food_data['usda_match'] = {
                        'fdc_id': usda_nutrition['fdc_id'],
                        'description': usda_nutrition['description'],
                        'data_type': usda_nutrition.get('data_type')
                    }
                    if usda_nutrition.get('estimated_fields'):
                        food_data['nutrition_estimation'] = {
                            'basis': usda_nutrition.get('estimation_basis'),
                            'estimated_fields': usda_nutrition.get('estimated_fields', []),
                            'ingredient_matches': usda_nutrition.get('ingredient_matches', [])
                        }

        food_data['source'] = 'gemini_vision'
        food_data['analysis_type'] = 'image_recognition'

        cache_set(ANALYSIS_CACHE, analysis_cache_key, food_data)

        return {
            'success': True,
            'data': food_data
        }

    except json.JSONDecodeError:
        return {
            'success': False,
            'error': 'Failed to parse AI response',
            'raw_response': response_text if 'response_text' in locals() else None
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def apply_user_confirmed_food_name(food_data: dict, confirmed_name: str) -> dict:
    """Apply a user-confirmed name, run local mapping, then fetch USDA nutrition."""
    if not isinstance(food_data, dict):
        return {}

    updated = dict(food_data)
    cleaned_name = re.sub(r'\s+', ' ', str(confirmed_name or '')).strip()
    if not cleaned_name:
        return updated

    mapping = resolve_local_dish_mapping(cleaned_name)
    canonical_name = mapping.get('canonical_name', cleaned_name)

    updated['food_name'] = canonical_name
    updated['user_corrected_name'] = True
    updated['disambiguation_needed'] = False
    updated['alternatives'] = []
    updated['nutrition_pending_confirmation'] = False
    if mapping.get('matched_alias'):
        updated['local_dish_mapping'] = {
            'matched_alias': mapping['matched_alias'],
            'canonical_name': canonical_name
        }

    if updated.get('nutrition_source') == 'open_food_facts':
        return updated

    usda_nutrition = get_usda_nutrition(
        food_name=canonical_name,
        ingredients=updated.get('ingredients_if_dish', []),
        fast_mode=FOOD_ANALYSIS_FAST_MODE
    )
    if usda_nutrition:
        updated['nutrition_per_100g'] = usda_nutrition['nutrition_per_100g']
        updated['nutrition_source'] = 'usda_fooddata_central'
        updated['usda_match'] = {
            'fdc_id': usda_nutrition['fdc_id'],
            'description': usda_nutrition['description'],
            'data_type': usda_nutrition.get('data_type')
        }
        if usda_nutrition.get('estimated_fields'):
            updated['nutrition_estimation'] = {
                'basis': usda_nutrition.get('estimation_basis'),
                'estimated_fields': usda_nutrition.get('estimated_fields', []),
                'ingredient_matches': usda_nutrition.get('ingredient_matches', [])
            }

    return updated


def validate_food_input(food_name: str, context: dict = None) -> dict:
    """
    Validate that a user-typed string is a real food or beverage name and is
    contextually plausible given what was detected in the image.
    """
    try:
        context_str = ""
        if context:
            ctx_name = context.get('food_name', '')
            ctx_category = context.get('category', '')
            ctx_desc = context.get('description', '')
            if ctx_name or ctx_category:
                context_str = (
                    f"\nThe image was previously analysed and appears to show: "
                    f"{ctx_name} ({ctx_category})."
                )
                if ctx_desc:
                    context_str += f" Description: {ctx_desc}"

        prompt = f"""You are a food validation assistant.
A user manually typed "{food_name}" as the name of a food item they just photographed.{context_str}

Respond ONLY with valid JSON in this exact format:
{{
  "valid": true,
  "reason": "brief explanation",
  "sanitized_name": "Properly capitalised, clean version of the food name"
}}

Rules:
1. "valid" is true ONLY if the input is a real, recognisable food or beverage name (including regional, brand, or colloquial names).
2. "valid" is false if the input is not food/beverage (e.g. household objects, people, random text, offensive language, nonsense) OR if it is obviously impossible given the image context (e.g. typing "raw carrot" when tea/liquid was detected).
3. Do NOT be overly strict - regional dishes, brand names, and informal names are all acceptable as long as they refer to something edible.
4. "sanitized_name" must be filled when valid is true; leave it as an empty string when valid is false.
Return ONLY valid JSON, no additional text."""

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=prompt
        )

        response_text = response.text.strip()
        if response_text.startswith("```"):
            response_text = re.sub(r'^```json?\n?', '', response_text)
            response_text = re.sub(r'\n?```$', '', response_text)

        return json.loads(response_text)
    except Exception as e:
        print(f"Error validating food input: {e}")
        return {"valid": False, "reason": "Validation service unavailable.", "sanitized_name": ""}


def get_food_recommendations(food_data: dict) -> list:
    """Get healthier alternatives or similar foods."""
    try:
        food_name = food_data.get('food_name', '')
        category = food_data.get('category', '')

        prompt = f"""Based on the food "{food_name}" in category "{category}", suggest 3-5 healthier alternatives or complementary foods.

Return as JSON array:
[
    {{
        "name": "Food name",
        "reason": "Why it's a good alternative/complement",
        "nutrition_comparison": "Brief nutritional comparison"
    }}
]

Return ONLY valid JSON array."""

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=prompt
        )

        response_text = response.text.strip()
        if response_text.startswith("```"):
            response_text = re.sub(r'^```json?\n?', '', response_text)
            response_text = re.sub(r'\n?```$', '', response_text)

        return json.loads(response_text)

    except Exception as e:
        print(f"Error getting food recommendations: {e}")
        return []


__all__ = [
    'analyze_food_image',
    'apply_user_confirmed_food_name',
    'validate_food_input',
    'get_food_recommendations',
    'build_health_context',
    'build_openfoodfacts_queries',
    'ensure_disambiguation_alternatives',
    'extract_nutrition_per_100g',
    'extract_openfoodfacts_nutrition',
    'extract_quantity_value',
    'get_openfoodfacts_nutrition',
    'get_usda_nutrition',
    'is_labeled_product',
    'normalize_food_text',
    'requires_user_confirmation',
    'resolve_local_dish_mapping',
    'search_fooddata_central',
    'search_openfoodfacts_product',
]
