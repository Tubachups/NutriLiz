from google import genai
from dotenv import load_dotenv
import base64
import json
import os
import re

load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
client = genai.Client(api_key=GEMINI_API_KEY)

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
    "nutrition_per_serving": {
        "calories": number,
        "protein_g": number,
        "carbohydrates_g": number,
        "fat_g": number,
        "fiber_g": number,
        "sugar_g": number,
        "sodium_mg": number,
        "saturated_fat_g": number
    },
    "nutrition_per_100g": {
        "calories": number,
        "protein_g": number,
        "carbohydrates_g": number,
        "fat_g": number,
        "fiber_g": number,
        "sugar_g": number,
        "sodium_mg": number,
        "saturated_fat_g": number
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
Provide your best estimates for nutritional values based on standard food databases.
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
            model="gemini-2.5-flash",
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
            model="gemini-2.5-flash",
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