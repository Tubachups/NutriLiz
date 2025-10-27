import requests
import time
import json

def LLM(prompt):
    start_time = time.time()
    try:
        response = requests.post(
            "http://localhost:11434/api/generate", 
            json={
                "model": "deepseek-r1:1.5b", 
                "prompt": prompt, 
                "stream": True  # Enable streaming
            },
            timeout=300,
            stream=True  # Enable streaming in requests
        )
        response.raise_for_status()
        
        message = ""
        for line in response.iter_lines():
            if line:
                result = json.loads(line)
                chunk = result.get("response", "")
                message += chunk
                print(chunk, end="", flush=True)  # Show tokens as they arrive
                
                if result.get("done", False):
                    break
        
        end_time = time.time()
        elapsed_time = end_time - start_time
        
        return message, elapsed_time
        
    except requests.exceptions.Timeout:
        end_time = time.time()
        elapsed_time = end_time - start_time
        return f"Request timed out after {elapsed_time:.2f} seconds", elapsed_time
        
    except requests.exceptions.RequestException as e:
        end_time = time.time()
        elapsed_time = end_time - start_time
        return f"Error: {str(e)}", elapsed_time

# Test the function
if __name__ == "__main__":
    test_prompt = "What is life?"
    
    print("Sending prompt to Ollama...")
    print("-" * 50)
    
    response, response_time = LLM(test_prompt)
    
    print(f"Response: {response}")
    print("-" * 50)
    print(f"Response time: {response_time:.2f} seconds")