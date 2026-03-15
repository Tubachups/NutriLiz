from google import genai
from dotenv import load_dotenv
import base64
import json
import os
import re
import requests

load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
USDA_API_KEY = os.getenv('USDA_API_KEY')
USDA_BASE_URL = os.getenv('USDA_BASE_URL', 'https://api.nal.usda.gov/fdc/v1')
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
    "preparation_notes": "How the food appears to be prepared"
}

If you cannot identify the food or it's not a food item, set "identified" to false and explain in the description.
Do not estimate nutrition values. Keep nutrition fields null, they will be populated from an external nutrition database.
Return ONLY valid JSON, no additional text."""

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
            model="gemini-3.1-flash-image-preview",
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

        # Enrich nutrition using USDA FoodData Central for identified foods.
        if food_data.get('identified'):
            usda_nutrition = get_usda_nutrition(
                food_name=food_data.get('food_name', ''),
                ingredients=food_data.get('ingredients_if_dish', [])
            )
            if usda_nutrition:
                food_data['nutrition_per_100g'] = usda_nutrition['nutrition_per_100g']
                food_data['nutrition_source'] = 'usda_fooddata_central'
                food_data['usda_match'] = {
                    'fdc_id': usda_nutrition['fdc_id'],
                    'description': usda_nutrition['description'],
                    'data_type': usda_nutrition.get('data_type')
                }
                if not food_data.get('serving_size') and usda_nutrition.get('serving_size'):
                    food_data['serving_size'] = usda_nutrition['serving_size']
        
        # Add source information
        food_data['source'] = 'gemini_vision'
        food_data['analysis_type'] = 'image_recognition'
        
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


def get_usda_nutrition(food_name: str, ingredients=None) -> dict:
    """Look up nutrition from USDA FoodData Central and normalize to app schema."""
    if not USDA_API_KEY or not food_name:
        return {}

    queries = [food_name]
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

    for query in deduped_queries:
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
        return foods_sorted[0]
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