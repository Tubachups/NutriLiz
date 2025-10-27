import requests
import time
import json

# Configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "gemma3:1b"

def call_llm(prompt, stream=True):
    """Simple LLM caller with streaming support"""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": MODEL_NAME, "prompt": prompt, "stream": stream},
            timeout=300,
            stream=stream
        )
        response.raise_for_status()
        
        full_response = ""
        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                chunk = data.get("response", "")
                full_response += chunk
                print(chunk, end="", flush=True)
                if data.get("done", False):
                    break
        
        print()  # New line after streaming
        return full_response
        
    except Exception as e:
        print(f"\n❌ Error calling LLM: {e}")
        return None


def get_allergen_info(product_data):
    allergens_tags = product_data.get('allergens_tags', [])
    traces_tags = product_data.get('traces_tags', [])
    
    # Clean up allergen tags (remove 'en:' prefix and format)
    clean_allergens = []
    if allergens_tags:
        clean_allergens = [tag.replace('en:', '').replace('-', ' ').title() 
                          for tag in allergens_tags]
    
    # Clean up trace allergen tags
    clean_traces = []
    if traces_tags:
        clean_traces = [tag.replace('en:', '').replace('-', ' ').title() 
                       for tag in traces_tags]
    
    return {
        'allergens': clean_allergens,
        'traces': clean_traces,
        'allergens_raw': product_data.get('allergens', ''),
        'traces_raw': product_data.get('traces', '')
    }


def create_health_prompt(product_data):
    """Build a focused prompt from product data"""
    name = product_data.get('name', 'Unknown')
    barcode = product_data.get('barcode', 'N/A')
    n = product_data.get('nutriments', {})
    
    # Get allergen information
    allergen_info = get_allergen_info(product_data)
    allergen_str = ', '.join(allergen_info['allergens']) if allergen_info['allergens'] else 'None listed'
    traces_str = ', '.join(allergen_info['traces']) if allergen_info['traces'] else 'None'
    
    return f"""Analyze this food product for health risks:

Product: {name} (Barcode: {barcode})
Category: {product_data.get('type', 'N/A')}

⚠️ ALLERGENS: {allergen_str}
⚠️ MAY CONTAIN TRACES: {traces_str}

Nutrition per 100g:
• Calories: {n.get('energy-kcal_100g', 'N/A')} kcal
• Sugar: {n.get('sugars_100g', 'N/A')}g
• Fat: {n.get('fat_100g', 'N/A')}g (Saturated: {n.get('saturated-fat_100g', 'N/A')}g)
• Salt: {n.get('salt_100g', 'N/A')}g (Sodium: {n.get('sodium_100g', 'N/A')}g)
• Protein: {n.get('proteins_100g', 'N/A')}g
• Fiber: {n.get('fiber_100g', 'N/A')}g

Nutri-Score: {product_data.get('nutri_grade', 'N/A')}
NOVA Group: {product_data.get('nova_group', 'N/A')}

Provide a brief health assessment covering:
1. Allergen warnings 
2. High salt risk 
3. High sugar risk 
4. High saturated fat risk
5. Overall assessment

Be concise, no disclaimer and important note"""


def analyze_product(product_data):
    """Main analysis function"""
    print("\n" + "="*70)    
    print(f"📦 {product_data.get('name', 'Unknown Product')}")
    print(f"🔢 Barcode: {product_data.get('barcode', 'N/A')}")
    print("="*70)
    
    # LLM analysis
    print("\n🤖 AI Analysis:\n" + "-"*70)
    prompt = create_health_prompt(product_data)
    llm_response = call_llm(prompt)
    print("-"*70)
    
    allergen_info = get_allergen_info(product_data)
    
    return {
        'product': product_data.get('name'),
        'barcode': product_data.get('barcode'),
        'allergens': allergen_info,
        'ai_analysis': llm_response
    }

# Main scanner loop
if __name__ == "__main__":
    from barcode import get_product_data, get_latest_barcode, start_barcode_scanner
    
    print("🚀 Starting Health Scanner...")
    start_barcode_scanner()
    
    print("\n📱 Ready to scan! (Ctrl+C to exit)\n")
    
    try:
        while True:
            barcode = get_latest_barcode()
            
            if barcode:
                print(f"\n🔍 Scanning: {barcode}")
                product_data = get_product_data(barcode)
                
                if product_data:
                    analyze_product(product_data)
                    print("\n✅ Ready for next scan...\n")
                else:
                    print(f"❌ Product not found\n")
            
            time.sleep(0.5)
            
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")