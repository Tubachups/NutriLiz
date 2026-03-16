from google import genai
from dotenv import load_dotenv
import base64
import hashlib
import json
import os
import re
import requests
import time

load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
USDA_API_KEY = os.getenv('USDA_API_KEY')
USDA_BASE_URL = os.getenv('USDA_BASE_URL', 'https://api.nal.usda.gov/fdc/v1')
OPENFOODFACTS_BASE_URL = os.getenv('OPENFOODFACTS_BASE_URL', 'https://world.openfoodfacts.org')
client = genai.Client(api_key=GEMINI_API_KEY)


NUTRIENT_NUMBER_MAP = {
    'calories': '208',
    'protein_g': '203',
    'carbohydrates_g': '205',
    'fat_g': '204',
    'fiber_g': '291',
    'sugar_g': '269',
    'sodium_mg': '307',
    'saturated_fat_g': '606'
}

USDA_ALLOWED_DATA_TYPES = ('SR Legacy', 'Foundation')
USDA_PROCESSED_KEYWORDS = (
    'flour', 'powder', 'starch', 'chip', 'chips', 'fried', 'baked',
    'dehydrated', 'dried', 'instant', 'mix', 'snack', 'canned',
    'frozen', 'puree', 'mashed'
)

OPENFOODFACTS_PACKAGED_HINTS = (
    'biscuit', 'cookies', 'cookie', 'cracker', 'chips', 'choco', 'chocolate',
    'instant', 'noodles', 'cereal', 'drink', 'beverage', 'soda', 'juice',
    'pack', 'packet', 'pouch', 'bottle', 'can', 'bar', 'snack', 'flavor',
    'flavour', 'label', 'labeled', 'labelled', 'brand', 'processed'
)

FRESH_FOOD_CATEGORY_HINTS = (
    'vegetable', 'fruit', 'meat', 'fish', 'seafood', 'egg',
    'legume', 'bean', 'grain', 'rice', 'root'
)

FRESH_FOOD_TEXT_HINTS = (
    'fresh', 'raw', 'whole', 'unprocessed', 'leafy', 'home-cooked',
    'steamed', 'boiled', 'grilled'
)

NOODLE_DISH_HINTS = (
    'noodle', 'noodles', 'pancit', 'pansit', 'canton', 'lomi', 'mami',
    'batchoy', 'ramen', 'udon', 'soba', 'sotanghon', 'misua'
)

BROTH_SAUCE_HINTS = (
    'broth', 'soup', 'sabaw', 'sauce', 'dressing', 'gravy', 'thick',
    'creamy', 'coated', 'covered'
)


def env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on'}


def to_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    return normalize_food_text(value) in {'1', 'true', 'yes', 'on'}


FOOD_ANALYSIS_FAST_MODE = env_flag('FOOD_ANALYSIS_FAST_MODE', True)
CACHE_TTL_SECONDS = int(os.getenv('FOOD_ANALYSIS_CACHE_TTL_SECONDS', '300'))
CACHE_MAX_ITEMS = int(os.getenv('FOOD_ANALYSIS_CACHE_MAX_ITEMS', '500'))

ANALYSIS_CACHE = {}
OFF_SEARCH_CACHE = {}
USDA_SEARCH_CACHE = {}


def clone_data(value):
    """JSON-safe deep copy for cached payloads."""
    return json.loads(json.dumps(value))


def cache_get(cache: dict, key: str):
    if key not in cache:
        return False, None

    expires_at, value = cache.get(key, (0, None))
    if expires_at < time.time():
        cache.pop(key, None)
        return False, None

    return True, clone_data(value)


def cache_set(cache: dict, key: str, value):
    now = time.time()

    if len(cache) >= CACHE_MAX_ITEMS:
        # Prune expired entries first.
        expired_keys = [k for k, (exp, _) in cache.items() if exp < now]
        for old_key in expired_keys:
            cache.pop(old_key, None)

    if len(cache) >= CACHE_MAX_ITEMS:
        # Drop the oldest remaining entry to keep memory bounded.
        oldest_key = min(cache.items(), key=lambda item: item[1][0])[0]
        cache.pop(oldest_key, None)

    cache[key] = (now + CACHE_TTL_SECONDS, clone_data(value))

FILIPINO_LOCAL_DISHES = {
    'lomi': {
        'canonical_name': 'Lomi',
        'aliases': (
            'lomi', 'batangas lomi', 'pancit lomi', 'pansit lomi',
            'lomihang', 'loming'
        ),
        'usda_queries': (
            'filipino noodle soup',
            'noodle soup with meat and vegetables',
            'egg noodle soup'
        )
    },
    'pancit_canton': {
        'canonical_name': 'Pancit Canton',
        'aliases': (
            'pancit canton', 'pansit canton', 'canton noodles', 'pancit kanton'
        ),
        'usda_queries': (
            'stir fried noodles with vegetables and meat',
            'noodles with vegetables and meat'
        )
    },
    'mami': {
        'canonical_name': 'Mami',
        'aliases': (
            'mami', 'beef mami', 'chicken mami', 'pork mami'
        ),
        'usda_queries': (
            'chicken noodle soup',
            'beef noodle soup',
            'noodle soup'
        )
    }
}


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

    # Force disambiguation for lookalike noodle dishes with broth/sauce.
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
        # Build the prompt for food recognition
        prompt = """Analyze this food image and provide detailed information in the following JSON format:

{
    "identified": true/false,
    "confidence": "high/medium/low",
    "has_visible_label_or_packaging": true/false,
    "food_name": "Name of the food",
    "food_name_local": "Local/regional name if applicable",
    "category": "Category (e.g., Fruit, Vegetable, Meat, Dairy, Grain, etc.)",
    "description": "Brief description of the food",
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

        # Add personalization if user profile provided
       # Add personalization if user profile provided
        if user_profile:
            health_context = build_health_context(user_profile)
            prompt += f"\n\nUser Health Context:\n{health_context}\n\nAlso include a 'personalized_advice' field with specific recommendations for this user."

        # Detect mime type from base64 header or default to jpeg
        mime_type = "image/jpeg"
        try:
            # Decode a small portion to detect image type
            image_bytes = base64.b64decode(image_data)
            if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
                mime_type = "image/png"
            elif image_bytes[:2] == b'\xff\xd8':
                mime_type = "image/jpeg"
            elif image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
                mime_type = "image/webp"
        except Exception:
            pass  # Use default jpeg if detection fails
        
        # Create content with image for Gemini
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
        
        # Parse the response
        response_text = response.text.strip()
        
        # Clean up response (remove markdown code blocks if present)
        if response_text.startswith("```"):
            response_text = re.sub(r'^```json?\n?', '', response_text)
            response_text = re.sub(r'\n?```$', '', response_text)
        
        food_data = json.loads(response_text)

        # Enrich nutrition for identified foods.
        if food_data.get('identified'):
            confirmation_required = requires_user_confirmation(food_data)
            has_visible_packaging = to_bool(food_data.get('has_visible_label_or_packaging'))
            heuristic_labeled_product = is_labeled_product(food_data)
            off_lookup_allowed = has_visible_packaging or heuristic_labeled_product
            if confirmation_required:
                food_data['disambiguation_needed'] = True
                food_data['alternatives'] = ensure_disambiguation_alternatives(food_data)
                # Defer USDA lookup until the user confirms the exact dish name.
                food_data['nutrition_pending_confirmation'] = True

            # OFF lookup is allowed when either the model explicitly sees a label/packaging
            # or our legacy heuristic strongly suggests it's a packaged product.
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

            # Fallback to USDA only when no confirmation is required.
            # This avoids locking in potentially wrong nutrition for low/medium confidence dishes.
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
        
        # Add source information
        food_data['source'] = 'gemini_vision'
        food_data['analysis_type'] = 'image_recognition'

        cache_set(ANALYSIS_CACHE, analysis_cache_key, food_data)
        
        return {
            'success': True,
            'data': food_data
        }
        
    except json.JSONDecodeError as e:
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
                bmi = weight / ((height/100) ** 2)
                context_parts.append(f"BMI: {bmi:.1f}")
            except (ValueError, TypeError, ZeroDivisionError):
                pass
        
        # Handle allergies - could be list, string, or JSON string
        allergies = user_profile.get('allergies')
        if allergies:
            if isinstance(allergies, list):
                allergies_str = ', '.join(str(a) for a in allergies if a)
            elif isinstance(allergies, str):
                # Try to parse as JSON, otherwise use as-is
                try:
                    parsed = json.loads(allergies)
                    allergies_str = ', '.join(str(a) for a in parsed if a) if isinstance(parsed, list) else allergies
                except json.JSONDecodeError:
                    allergies_str = allergies
            else:
                allergies_str = str(allergies)
            if allergies_str:
                context_parts.append(f"Allergies: {allergies_str}")
        
        # Handle health conditions - could be list, string, or JSON string
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
        
        # Handle dietary restrictions - could be list, string, or JSON string
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
        # Return empty context if there's an error
        return ""
    
    return '\n'.join(context_parts)


def is_labeled_product(food_data: dict) -> bool:
    """Heuristic check for packaged/labeled food where Open Food Facts is usually stronger."""
    category_text = str(food_data.get('category', '')).lower()
    name_text = str(food_data.get('food_name', '')).lower()
    description_text = str(food_data.get('description', '')).lower()
    serving_size_text = str(food_data.get('serving_size', '')).lower()

    text = ' '.join([
        name_text,
        str(food_data.get('food_name_local', '')).lower(),
        category_text,
        description_text,
        str(food_data.get('preparation_notes', '')).lower(),
        serving_size_text
    ]).lower()

    has_packaged_hint = any(hint in text for hint in OPENFOODFACTS_PACKAGED_HINTS)
    if has_packaged_hint:
        return True

    has_fresh_category = any(hint in category_text for hint in FRESH_FOOD_CATEGORY_HINTS)
    has_fresh_text_hint = any(hint in f"{name_text} {description_text}" for hint in FRESH_FOOD_TEXT_HINTS)

    has_quantity = bool(re.search(r'\b\d+(?:[\.,]\d+)?\s?(g|kg|ml|l|oz)\b', text))
    has_packaging_context = bool(
        re.search(r'\b(pack|packet|pouch|bottle|can|box|bar|label|labeled|labelled|brand|flavo[u]?r)\b', text)
    )

    # Quantity alone (e.g., "100g carrots") is not enough to classify as labeled/packaged.
    if has_fresh_category or has_fresh_text_hint:
        return has_packaging_context

    return has_quantity and has_packaging_context


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

    # Fast mode: only use the primary recognized name (or fallback local name).
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

    # Respect existing Open Food Facts nutrition when present.
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

    return updated


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

        # Keep only SR Legacy and Foundation entries for consistent USDA reference nutrients.
        filtered = [
            item for item in foods
            if str(item.get('dataType', '')).strip() in USDA_ALLOWED_DATA_TYPES
        ]
        if not filtered:
            return {}

        # Favor whole/raw ingredient matches over processed forms (e.g., potato vs potato flour).
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

            # Lower is better.
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
3. Do NOT be overly strict — regional dishes, brand names, and informal names are all acceptable as long as they refer to something edible.
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