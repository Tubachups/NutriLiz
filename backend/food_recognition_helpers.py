import json
import re

from food_recognition_config import (
    BROTH_SAUCE_HINTS,
    FILIPINO_LOCAL_DISHES,
    NOODLE_DISH_HINTS,
)


def normalize_food_text(text: str) -> str:
    return re.sub(r'\s+', ' ', str(text or '').strip().lower())


def resolve_local_dish_mapping(food_name: str) -> dict:
    """Map regional dish aliases (e.g., Lomi variants) to canonical local names."""
    normalized = normalize_food_text(food_name)
    if not normalized:
        return {}

    for _, mapping in FILIPINO_LOCAL_DISHES.items():
        for alias in mapping['aliases']:
            alias_norm = normalize_food_text(alias)
            if alias_norm and re.search(rf'\b{re.escape(alias_norm)}\b', normalized):
                return {
                    'canonical_name': mapping['canonical_name'],
                    'matched_alias': alias,
                    'usda_queries': list(mapping.get('usda_queries', []))
                }

    return {}


def requires_user_confirmation(food_data: dict) -> bool:
    """
    Require explicit user confirmation for uncertain predictions.
    Rules:
    - Always require for medium/low confidence.
    - Always require when AI already marked disambiguation_needed.
    - Require for lookalike regional noodle dishes with broth/sauce context.
    """
    confidence = normalize_food_text(food_data.get('confidence', ''))
    if confidence in {'medium', 'low'}:
        return True

    if bool(food_data.get('disambiguation_needed')):
        return True

    text = ' '.join([
        normalize_food_text(food_data.get('food_name', '')),
        normalize_food_text(food_data.get('food_name_local', '')),
        normalize_food_text(food_data.get('category', '')),
        normalize_food_text(food_data.get('description', '')),
        normalize_food_text(food_data.get('preparation_notes', '')),
    ])

    has_noodle_hint = any(hint in text for hint in NOODLE_DISH_HINTS)
    has_broth_or_sauce_hint = any(hint in text for hint in BROTH_SAUCE_HINTS)

    if has_noodle_hint and has_broth_or_sauce_hint:
        return True

    return False


def ensure_disambiguation_alternatives(food_data: dict) -> list:
    """Ensure there is at least 1-3 plausible options when confirmation is required."""
    alternatives = []
    if isinstance(food_data.get('alternatives'), list):
        alternatives = [str(item).strip() for item in food_data.get('alternatives', []) if str(item).strip()]

    candidate_pool = [
        str(food_data.get('food_name', '')).strip(),
        str(food_data.get('food_name_local', '')).strip(),
    ]

    local_mapping = resolve_local_dish_mapping(food_data.get('food_name', ''))
    if local_mapping.get('canonical_name'):
        candidate_pool.append(local_mapping['canonical_name'])

    if not alternatives:
        alternatives = candidate_pool
    else:
        alternatives.extend(candidate_pool)

    deduped = []
    seen = set()
    for item in alternatives:
        cleaned = re.sub(r'\s+', ' ', item).strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(cleaned)

    return deduped[:3]


def build_health_context(user_profile: dict) -> str:
    """Build health context string from user profile."""
    context_parts = []

    try:
        if user_profile.get('age'):
            context_parts.append(f"Age: {user_profile['age']}")
        if user_profile.get('gender'):
            context_parts.append(f"Gender: {user_profile['gender']}")
        if user_profile.get('weight') and user_profile.get('height'):
            try:
                weight = float(user_profile['weight'])
                height = float(user_profile['height'])
                bmi = weight / ((height / 100) ** 2)
                context_parts.append(f"BMI: {bmi:.1f}")
            except (ValueError, TypeError, ZeroDivisionError):
                pass

        allergies = user_profile.get('allergies')
        if allergies:
            if isinstance(allergies, list):
                allergies_str = ', '.join(str(a) for a in allergies if a)
            elif isinstance(allergies, str):
                try:
                    parsed = json.loads(allergies)
                    allergies_str = ', '.join(str(a) for a in parsed if a) if isinstance(parsed, list) else allergies
                except json.JSONDecodeError:
                    allergies_str = allergies
            else:
                allergies_str = str(allergies)
            if allergies_str:
                context_parts.append(f"Allergies: {allergies_str}")

        health_conditions = user_profile.get('health_conditions') or user_profile.get('healthConditions')
        if health_conditions:
            if isinstance(health_conditions, list):
                conditions_str = ', '.join(str(c) for c in health_conditions if c)
            elif isinstance(health_conditions, str):
                try:
                    parsed = json.loads(health_conditions)
                    conditions_str = ', '.join(str(c) for c in parsed if c) if isinstance(parsed, list) else health_conditions
                except json.JSONDecodeError:
                    conditions_str = health_conditions
            else:
                conditions_str = str(health_conditions)
            if conditions_str:
                context_parts.append(f"Health conditions: {conditions_str}")

        dietary_restrictions = user_profile.get('dietary_restrictions') or user_profile.get('dietaryRestrictions')
        if dietary_restrictions:
            if isinstance(dietary_restrictions, list):
                restrictions_str = ', '.join(str(d) for d in dietary_restrictions if d)
            elif isinstance(dietary_restrictions, str):
                try:
                    parsed = json.loads(dietary_restrictions)
                    restrictions_str = ', '.join(str(d) for d in parsed if d) if isinstance(parsed, list) else dietary_restrictions
                except json.JSONDecodeError:
                    restrictions_str = dietary_restrictions
            else:
                restrictions_str = str(dietary_restrictions)
            if restrictions_str:
                context_parts.append(f"Dietary restrictions: {restrictions_str}")

    except Exception as e:
        print(f"Error building health context: {e}")
        return ""

    return '\n'.join(context_parts)


def extract_quantity_value(text: str):
    """Return normalized quantity in grams/ml when possible for matching variants."""
    if not text:
        return None

    match = re.search(r'(\d+(?:[\.,]\d+)?)\s*(kg|g|ml|l|oz)\b', str(text).lower())
    if not match:
        return None

    value = float(match.group(1).replace(',', '.'))
    unit = match.group(2)
    if unit == 'kg':
        return value * 1000
    if unit == 'l':
        return value * 1000
    if unit == 'oz':
        return value * 28.3495
    return value
