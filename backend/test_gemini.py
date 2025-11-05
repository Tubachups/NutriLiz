from google import genai
from dotenv import load_dotenv  
import time
import os

# Load environment variables from .env
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

# Start timing
start_time = time.time()

response = client.models.generate_content(
    model="gemini-2.5-flash", 
    contents="Do you know about OpenFoodFacts website?"
)

# End timing
end_time = time.time()
response_time = end_time - start_time

# Calculate tokens (rough estimate: ~4 chars per token)
response_text = response.text
estimated_tokens = len(response_text) // 4
tokens_per_second = estimated_tokens / response_time if response_time > 0 else 0

print(response_text)
print("\n" + "="*60)
print(f"⏱️  Response Time: {response_time:.3f} seconds")
print(f"📝 Response Length: {len(response_text)} characters")
print(f"🔢 Estimated Tokens: ~{estimated_tokens}")
print(f"⚡ Speed: ~{tokens_per_second:.1f} tokens/second")
print("="*60)