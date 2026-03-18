from google import genai
from dotenv import load_dotenv
from collections import OrderedDict
import hashlib
import time
import os
import threading

load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
client = genai.Client(api_key=GEMINI_API_KEY)

CACHE_TTL_SECONDS = int(os.getenv('RISK_ASSESSMENT_CACHE_TTL_SECONDS', '21600'))
CACHE_MAX_ENTRIES = int(os.getenv('RISK_ASSESSMENT_CACHE_MAX_ENTRIES', '200'))
assessment_cache = OrderedDict()
assessment_cache_lock = threading.Lock()


def log_assessment(message):
    print(f"[Assessment] {message}")


def _build_cache_key(prompt):
    return hashlib.sha256(prompt.encode('utf-8')).hexdigest()


def _get_cached_response(cache_key):
    now = time.time()
    with assessment_cache_lock:
        cached_entry = assessment_cache.get(cache_key)
        if not cached_entry:
            return None

        if now - cached_entry['created_at'] > CACHE_TTL_SECONDS:
            assessment_cache.pop(cache_key, None)
            return None

        assessment_cache.move_to_end(cache_key)
        return cached_entry['response']


def _store_cached_response(cache_key, response_text):
    with assessment_cache_lock:
        assessment_cache[cache_key] = {
            'response': response_text,
            'created_at': time.time(),
        }
        assessment_cache.move_to_end(cache_key)

        while len(assessment_cache) > CACHE_MAX_ENTRIES:
            assessment_cache.popitem(last=False)


def _summarize_analysis(response_text, max_len=140):
    if not response_text:
        return "No analysis returned"

    single_line = " ".join(str(response_text).split())
    if len(single_line) <= max_len:
        return single_line
    return single_line[: max_len - 3].rstrip() + "..."


def _is_meaningful(value):
    if value is None:
        return False
    if isinstance(value, str) and value.strip().lower() in ('', 'n/a', 'na', 'none', 'null'):
        return False
    return True


def _pick_first_value(product_data, *keys):
    nutriments = product_data.get('nutriments', {}) or {}
    for key in keys:
        if key in nutriments and _is_meaningful(nutriments.get(key)):
            return nutriments.get(key)
        if key in product_data and _is_meaningful(product_data.get(key)):
            return product_data.get(key)
    return 'N/A'


def _pick_energy_kcal(product_data):
    kcal_value = _pick_first_value(
        product_data,
        'energy-kcal_100g', 'energy-kcal_100ml', 'energy-kcal_serving',
        'energy-kcal_prepared_100g', 'energy-kcal_prepared_100ml', 'energy-kcal_prepared_serving',
        'energy-kcal', 'energy-kcal_value',
        'energy_kcal_100g', 'energy_kcal_serving'
    )
    if _is_meaningful(kcal_value):
        return kcal_value

    kj_value = _pick_first_value(
        product_data,
        'energy-kj_100g', 'energy-kj_100ml', 'energy-kj_serving',
        'energy-kj_prepared_100g', 'energy-kj_prepared_100ml', 'energy-kj_prepared_serving',
        'energy-kj', 'energy_100g', 'energy_100ml', 'energy_serving', 'energy'
    )
    if not _is_meaningful(kj_value):
        return 'N/A'

    try:
        return round(float(kj_value) / 4.184, 2)
    except (TypeError, ValueError):
        return 'N/A'


def _resolve_openfoodfacts_nutrition(product_data):
    return {
        'calories_kcal': _pick_energy_kcal(product_data),
        'sugars_g': _pick_first_value(
            product_data,
            'sugars_100g', 'sugars_100ml', 'sugars_serving',
            'sugars_prepared_100g', 'sugars_prepared_100ml', 'sugars_prepared_serving',
            'sugars'
        ),
        'fat_g': _pick_first_value(
            product_data,
            'fat_100g', 'fat_100ml', 'fat_serving',
            'fat_prepared_100g', 'fat_prepared_100ml', 'fat_prepared_serving',
            'fat'
        ),
        'saturated_fat_g': _pick_first_value(
            product_data,
            'saturated-fat_100g', 'saturated-fat_100ml', 'saturated-fat_serving',
            'saturated-fat_prepared_100g', 'saturated-fat_prepared_100ml', 'saturated-fat_prepared_serving',
            'saturated-fat',
            'saturated_fat_100g', 'saturated_fat_serving'
        ),
        'salt_g': _pick_first_value(
            product_data,
            'salt_100g', 'salt_100ml', 'salt_serving',
            'salt_prepared_100g', 'salt_prepared_100ml', 'salt_prepared_serving',
            'salt'
        ),
        'sodium_g': _pick_first_value(
            product_data,
            'sodium_100g', 'sodium_100ml', 'sodium_serving',
            'sodium_prepared_100g', 'sodium_prepared_100ml', 'sodium_prepared_serving',
            'sodium'
        ),
        'proteins_g': _pick_first_value(
            product_data,
            'proteins_100g', 'proteins_100ml', 'proteins_serving',
            'proteins_prepared_100g', 'proteins_prepared_100ml', 'proteins_prepared_serving',
            'proteins'
        ),
        'fiber_g': _pick_first_value(
            product_data,
            'fiber_100g', 'fiber_100ml', 'fiber_serving',
            'fiber_prepared_100g', 'fiber_prepared_100ml', 'fiber_prepared_serving',
            'fiber'
        ),
        'carbohydrates_g': _pick_first_value(
            product_data,
            'carbohydrates_100g', 'carbohydrates_100ml', 'carbohydrates_serving',
            'carbohydrates_prepared_100g', 'carbohydrates_prepared_100ml', 'carbohydrates_prepared_serving',
            'carbohydrates'
        ),
    }


def _format_nutrient(value):
    if not _is_meaningful(value):
        return 'N/A'
    try:
        numeric = float(value)
        formatted = f"{numeric:.2f}".rstrip('0').rstrip('.')
        return formatted
    except (TypeError, ValueError):
        return str(value)

def call_llm(prompt):
    try:
        cache_key = _build_cache_key(prompt)
        cached_response = _get_cached_response(cache_key)

        if cached_response:
            log_assessment("Gemini cache hit")
            log_assessment("Summary: " + _summarize_analysis(cached_response))
            log_assessment("Response time: 0.000s (cache)")
            return cached_response

        log_assessment("Generating Gemini analysis")
        
        start_time = time.time()
        
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=prompt
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        full_response = response.text
        
        # Calculate performance metrics
        estimated_tokens = len(full_response) // 4
        tokens_per_second = estimated_tokens / response_time if response_time > 0 else 0

        log_assessment("Summary: " + _summarize_analysis(full_response))
        log_assessment(f"Response time: {response_time:.3f}s")
        log_assessment(f"Speed: ~{tokens_per_second:.1f} tokens/s")

        if full_response:
            _store_cached_response(cache_key, full_response)
        
        return full_response

    except Exception as e:
        log_assessment(f"Gemini error: {e}")
        return None


def get_allergen_info(product_data):
    allergens_tags = product_data.get('allergens_tags', [])
    traces_tags = product_data.get('traces_tags', [])

    clean_allergens = [tag.replace('en:', '').replace('-', ' ').title() for tag in allergens_tags]
    clean_traces = [tag.replace('en:', '').replace('-', ' ').title() for tag in traces_tags]

    return {
        'allergens': clean_allergens,
        'traces': clean_traces,
        'allergens_raw': product_data.get('allergens', ''),
        'traces_raw': product_data.get('traces', '')
    }


def analyze_product(product_data, user_profile=None):
    source = product_data.get('source', 'openfoodfacts').lower()
    display_name = product_data.get('name') or product_data.get('product', {}).get('name', 'Unknown Product')
    log_assessment(
        f"Start product='{display_name}' barcode={product_data.get('barcode', 'N/A')} source={source}"
    )
    if user_profile:
        log_assessment(f"Personalized profile enabled bmi={user_profile.get('bmi', 'N/A')}")

    # Generate AI prompt with optional user profile
    prompt = create_health_prompt(product_data, user_profile)
    llm_response = call_llm(prompt)
    log_assessment("Analysis complete")

    allergen_info = get_allergen_info(product_data)

    return {
        'product': display_name,
        'barcode': product_data.get('barcode'),
        'source': source,
        'allergens': allergen_info,
        'ai_analysis': llm_response,
        'personalized': user_profile is not None
    }
    
def create_health_prompt(product_data, user_profile=None):
    """Build a comprehensive prompt from product data for AI analysis with comorbidity considerations."""
    source = product_data.get('source', 'openfoodfacts').lower()
    
    # Build personalized health context if user profile is provided
    personal_context = ""
    if user_profile:
        personal_context = f"""
MY HEALTH PROFILE (Please personalize your assessment based on my health):
- My Weight: {user_profile.get('weight', 'N/A')} kg
- My Height: {user_profile.get('height', 'N/A')} cm
- My BMI: {user_profile.get('bmi', 'N/A')} {user_profile.get('bmiCategory', '')}
- My Blood Sugar Level: {user_profile.get('sugarLevel', 'N/A')} mg/dL
- My Cholesterol Level: {user_profile.get('cholesterolLevel', 'N/A')} mg/dL
- My Triglycerides: {user_profile.get('triglycerides', 'N/A')} mg/dL
- My Creatinine: {user_profile.get('creatinine', 'N/A')} mg/dL
- My Uric Acid: {user_profile.get('uricAcid', 'N/A')} mg/dL

⚠️ IMPORTANT: Please provide PERSONALIZED recommendations based on MY specific health metrics. 
If any of my blood markers are abnormal, please highlight specific concerns for ME.
"""

    if source == 'openfoodfacts':
        name = product_data.get('name', 'Unknown')
        barcode = product_data.get('barcode', 'N/A')
        nutrition = _resolve_openfoodfacts_nutrition(product_data)

        allergen_info = get_allergen_info(product_data)
        allergen_str = ', '.join(allergen_info['allergens']) if allergen_info['allergens'] else 'None listed'
        traces_str = ', '.join(allergen_info['traces']) if allergen_info['traces'] else 'None'

        ingredients = product_data.get('ingredients_text', 'Not available')
        additives = product_data.get('additives_tags', [])
        
        nova_group = product_data.get('nova_group', 'N/A')
        nova_context = {
            '1': 'Unprocessed or minimally processed foods',
            '2': 'Processed culinary ingredients',
            '3': 'Processed foods',
            '4': 'Ultra-processed foods'
        }
        nova_desc = nova_context.get(str(nova_group), 'Unknown processing level')

        personalized_section = ""
        if user_profile:
            personalized_section = """
7. **Personalized Assessment for Me**:
   Please synthesize specific risks, red flags, and tailored serving size recommendations for me based on my BMI and blood metrics.
"""

        return f"""I would like you to analyze this food product's nutritional content and assess its suitability for me given my health conditions:
{personal_context}
Product: {name} (Barcode: {barcode})
Category: {product_data.get('type', 'N/A')}
Processing Level: NOVA Group {nova_group} - {nova_desc}

⚠️ ALLERGENS: {allergen_str}
⚠️ MAY CONTAIN TRACES: {traces_str}

Nutrition per 100g:
- Calories: {_format_nutrient(nutrition['calories_kcal'])} kcal
- Sugar: {_format_nutrient(nutrition['sugars_g'])}g
- Fat: {_format_nutrient(nutrition['fat_g'])}g (Saturated: {_format_nutrient(nutrition['saturated_fat_g'])}g)
- Salt: {_format_nutrient(nutrition['salt_g'])}g (Sodium: {_format_nutrient(nutrition['sodium_g'])}g)
- Protein: {_format_nutrient(nutrition['proteins_g'])}g
- Fiber: {_format_nutrient(nutrition['fiber_g'])}g
- Carbohydrates: {_format_nutrient(nutrition['carbohydrates_g'])}g

Nutri-Score: {product_data.get('nutri_grade', 'N/A')}

Ingredients: {ingredients[:500]}{'...' if len(ingredients) > 500 else ''}

Format your response strictly with a maximum of 2 sentences per numbered section (Do not list servings inside the analysis sections):

1. **Sugar Analysis**: 

2. **Sodium/Salt Analysis**: 

3. **Saturated Fat Analysis**: 

4. **Fiber Content**:
  
5. **Overall Health Summary**: 
   Summarize the general nutritional quality and suggest one healthier alternative or serving tip.
{personalized_section}
Keep it factual, educational, and evidence-based. Do not provide medical advice or personalized treatment recommendations. Use clear warnings when products are particularly concerning for specific conditions."""

    else:
        # Appwrite source (similar changes for fresh foods)
        prod = product_data.get('product', {})
        name = prod.get('name', product_data.get('product_name', 'Unknown'))
        barcode = product_data.get('barcode', 'N/A')
        category = prod.get('category', 'N/A')

        n = product_data.get('nutrition', {})

        sugar = n.get('sugar', 'N/A')
        fat = n.get('fat', 'N/A')
        saturated = n.get('saturated_fat', n.get('saturatedFat', 'N/A'))
        salt = n.get('sodium', n.get('salt', 'N/A'))
        protein = n.get('protein', 'N/A')
        fiber = n.get('fiber', 'N/A')
        carbs = n.get('carbohydrates', 'N/A')

        personalized_section = ""
        if user_profile:
            personalized_section = """
6. **Personalized Assessment for Me**:
   Please synthesize specific risks, red flags, and tailored serving size recommendations for me based on my BMI and blood metrics.
"""

        return f"""I would like you to analyze this fresh food product's nutritional content and assess its suitability for me given my health conditions:
{personal_context}
Product: {name} (Barcode: {barcode})
Category: {category}
Type: Fresh Food (No additives or preservatives)

Nutrition per 100g:
- Sugar: {sugar}g
- Fat: {fat}g (Saturated: {saturated}g)
- Salt/Sodium: {salt}g
- Protein: {protein}g
- Fiber: {fiber}g
- Carbohydrates: {carbs}g

Format your response strictly with a maximum of 2 sentences per numbered section (Do not list servings inside the analysis sections):

1. **Sugar Analysis**: 

2. **Sodium/Salt Analysis**: 

3. **Saturated Fat Analysis**: 

4. **Fiber Content**:

5. **Overall Health Summary**: 
   Summarize the general nutritional quality and suggest one preparation method to maximize health benefits.
{personalized_section}
Keep it factual, educational, and evidence-based. Do not provide medical advice or personalized treatment recommendations. Emphasize the natural and wholesome nature of fresh foods."""
