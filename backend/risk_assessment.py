from google import genai
from dotenv import load_dotenv
import time
import os

load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
client = genai.Client(api_key=GEMINI_API_KEY)

def call_llm(prompt):
    try:
        print("\n🤖 Generating analysis with Gemini AI...\n")
        
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
        
        print(full_response)
        print("\n" + "="*60)
        print(f"⏱️  Response Time: {response_time:.3f} seconds")
        print(f"⚡ Speed: ~{tokens_per_second:.1f} tokens/second")
        print("="*60 + "\n")
        
        return full_response

    except Exception as e:
        print(f"\n❌ Error calling Gemini AI: {e}")
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
    print("\n" + "="*70)
    source = product_data.get('source', 'openfoodfacts').lower()
    display_name = product_data.get('name') or product_data.get('product', {}).get('name', 'Unknown Product')
    print(f"📦 {display_name}")
    print(f"🔢 Barcode: {product_data.get('barcode', 'N/A')}")
    print(f"📍 Source: {source}")
    if user_profile:
        print(f"👤 Personalized for user with BMI: {user_profile.get('bmi', 'N/A')}")
    print("="*70)

    # Generate AI prompt with optional user profile
    prompt = create_health_prompt(product_data, user_profile)
    llm_response = call_llm(prompt)

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
        n = product_data.get('nutriments', {})

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
- Calories: {n.get('energy-kcal_100g', 'N/A')} kcal
- Sugar: {n.get('sugars_100g', 'N/A')}g
- Fat: {n.get('fat_100g', 'N/A')}g (Saturated: {n.get('saturated-fat_100g', 'N/A')}g)
- Salt: {n.get('salt_100g', 'N/A')}g (Sodium: {n.get('sodium_100g', 'N/A')}g)
- Protein: {n.get('proteins_100g', 'N/A')}g
- Fiber: {n.get('fiber_100g', 'N/A')}g
- Carbohydrates: {n.get('carbohydrates_100g', 'N/A')}g

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