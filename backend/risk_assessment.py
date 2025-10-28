from google import genai
from dotenv import load_dotenv
import time
import os

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Initialize Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_NAME = "gemini-2.5-flash"

def call_llm(prompt):
    try:
        print("\n🤖 Generating analysis with Gemini AI...\n")
        
        start_time = time.time()
        
        response = client.models.generate_content(
            model=MODEL_NAME,
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


def create_health_prompt(product_data):
    """Build a focused prompt from product data."""
    name = product_data.get('name', 'Unknown')
    barcode = product_data.get('barcode', 'N/A')
    n = product_data.get('nutriments', {})

    allergen_info = get_allergen_info(product_data)
    allergen_str = ', '.join(allergen_info['allergens']) if allergen_info['allergens'] else 'None listed'
    traces_str = ', '.join(allergen_info['traces']) if allergen_info['traces'] else 'None'

    return f"""Analyze this food product's nutritional content:

Product: {name} (Barcode: {barcode})
Category: {product_data.get('type', 'N/A')}

⚠️ ALLERGENS: {allergen_str}
⚠️ MAY CONTAIN TRACES: {traces_str}

Nutrition per 100g:
- Calories: {n.get('energy-kcal_100g', 'N/A')} kcal
- Sugar: {n.get('sugars_100g', 'N/A')}g
- Fat: {n.get('fat_100g', 'N/A')}g (Saturated: {n.get('saturated-fat_100g', 'N/A')}g)
- Salt: {n.get('salt_100g', 'N/A')}g (Sodium: {n.get('sodium_100g', 'N/A')}g)
- Protein: {n.get('proteins_100g', 'N/A')}g
- Fiber: {n.get('fiber_100g', 'N/A')}g

Nutri-Score: {product_data.get('nutri_grade', 'N/A')}
NOVA Group: {product_data.get('nova_group', 'N/A')}

Format your response as:
1. Allergen Alert: List allergens if any
2. Sugar Content: - brief explanation
3. Salt Content: - brief explanation  
4. Saturated Fat: - brief explanation
5. Overall Summary: 4 sentences on general nutritional quality

Keep it factual and educational. Do not provide medical advice or personalized recommendations."""


def analyze_product(product_data):
    """Main analysis function."""
    print("\n" + "="*70)
    print(f"📦 {product_data.get('name', 'Unknown Product')}")
    print(f"🔢 Barcode: {product_data.get('barcode', 'N/A')}")
    print("="*70)

    prompt = create_health_prompt(product_data)
    llm_response = call_llm(prompt)

    allergen_info = get_allergen_info(product_data)

    return {
        'product': product_data.get('name'),
        'barcode': product_data.get('barcode'),
        'allergens': allergen_info,
        'ai_analysis': llm_response
    }
