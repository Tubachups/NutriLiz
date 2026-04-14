import base64
import hashlib
import json
import logging
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
    normalize_food_text,
    requires_user_confirmation,
    extract_quantity_value,
    resolve_local_dish_mapping,
)
from food_recognition_usda import (
    extract_nutrition_per_100g,
    get_usda_nutrition,
    search_fooddata_central,
)
from food_recognition_fnri import get_fnri_nutrition
from food_recognition_prompts import (
    build_food_image_analysis_prompt,
    build_food_validation_prompt,
)


logger = logging.getLogger(__name__)

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
        prompt = build_food_image_analysis_prompt()

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
            logger.debug('Food analysis cache hit; skipping FNRI/USDA lookup')
            return {
                'success': True,
                'data': cached_food_data
            }

        if user_profile:
            health_context = build_health_context(user_profile)
            prompt = build_food_image_analysis_prompt(
                user_profile=user_profile,
                health_context=health_context,
            )

        mime_type = "image/jpeg"
        if image_data.startswith("iVBORw0K"):
            mime_type = "image/png"
        elif image_data.startswith("/9j/"):
            mime_type = "image/jpeg"
        elif image_data.startswith("UklGR"):
            mime_type = "image/webp"

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
            ],
            config={"response_mime_type": "application/json"}
        )

        response_text = response.text.strip()

        if response_text.startswith("```"):
            response_text = re.sub(r'^```json?\n?', '', response_text)
            response_text = re.sub(r'\n?```$', '', response_text)

        food_data = json.loads(response_text)

        annotate_food_safety(food_data)

        if food_data.get('identified') and not to_bool(food_data.get('is_expired_or_spoiled')):
            confirmation_required = requires_user_confirmation(food_data)
            if confirmation_required:
                food_data['disambiguation_needed'] = True
                food_data['alternatives'] = ensure_disambiguation_alternatives(food_data)
                food_data['nutrition_pending_confirmation'] = True

            if not food_data.get('nutrition_source') and not confirmation_required:
                fnri_nutrition = get_fnri_nutrition(
                    food_name=food_data.get('food_name', ''),
                    ingredients=food_data.get('ingredients_if_dish', []),
                    fast_mode=FOOD_ANALYSIS_FAST_MODE
                )
                if fnri_nutrition:
                    food_data['nutrition_per_100g'] = fnri_nutrition['nutrition_per_100g']
                    food_data['nutrition_source'] = 'fnri_table'
                    food_data['fnri_match'] = fnri_nutrition.get('fnri_match', {})
                    logger.info(
                        "Nutrition source selected: FNRI for food='%s'",
                        food_data.get('food_name', ''),
                    )
                    print(f"[FOOD_RECOGNITION] nutrition source=FNRI food='{food_data.get('food_name', '')}'")
                else:
                    logger.info(
                        "FNRI returned no nutrition for food='%s'; falling back to USDA",
                        food_data.get('food_name', ''),
                    )
                    print(f"[FOOD_RECOGNITION] FNRI miss, fallback to USDA food='{food_data.get('food_name', '')}'")

            # COMMENT THIS TO CHECK FNRI
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


    fnri_nutrition = get_fnri_nutrition(
        food_name=canonical_name,
        ingredients=updated.get('ingredients_if_dish', []),
        fast_mode=FOOD_ANALYSIS_FAST_MODE
    )
    if fnri_nutrition:
        updated['nutrition_per_100g'] = fnri_nutrition['nutrition_per_100g']
        updated['nutrition_source'] = 'fnri_table'
        updated['fnri_match'] = fnri_nutrition.get('fnri_match', {})
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
        prompt = build_food_validation_prompt(food_name=food_name, context=context)

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )

        response_text = response.text.strip()
        if response_text.startswith("```"):
            response_text = re.sub(r'^```json?\n?', '', response_text)
            response_text = re.sub(r'\n?```$', '', response_text)

        return json.loads(response_text)
    except Exception as e:
        print(f"Error validating food input: {e}")
        return {"valid": False, "reason": "Validation service unavailable.", "sanitized_name": ""}


__all__ = [
    'analyze_food_image',
    'apply_user_confirmed_food_name',
    'validate_food_input',
    'get_fnri_nutrition',
    'build_health_context',
    'ensure_disambiguation_alternatives',
    'extract_nutrition_per_100g',
    'extract_quantity_value',
    'get_usda_nutrition',
    'normalize_food_text',
    'requires_user_confirmation',
    'resolve_local_dish_mapping',
    'search_fooddata_central',
]
