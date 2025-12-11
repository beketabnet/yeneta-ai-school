import os
import sys
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import ollama
    print("✅ Ollama library imported successfully")
except ImportError:
    print("❌ Ollama library not installed")
    sys.exit(1)

MODEL_NAME = "gpt-oss:20b"

def test_ollama_generation():
    print(f"🚀 Testing Ollama generation with model: {MODEL_NAME}")
    
    start_time = time.time()
    try:
        # Simple prompt
        prompt = "Explain the importance of road safety in 3 sentences."
        
        print("⏳ Sending request to Ollama... (this may take time if model needs to load)")
        
        response = ollama.generate(
            model=MODEL_NAME,
            prompt=prompt,
            stream=False
        )
        
        duration = time.time() - start_time
        print(f"✅ Generation successful in {duration:.2f} seconds!")
        print(f"📝 Response: {response['response']}")
        
    except Exception as e:
        duration = time.time() - start_time
        print(f"❌ Generation FAILED after {duration:.2f} seconds")
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Check if model exists
    try:
        models = ollama.list()
        # Handle different response formats (list vs object)
        model_names = []
        if hasattr(models, 'models'):
            raw_models = models.models
        elif isinstance(models, dict) and 'models' in models:
            raw_models = models['models']
        else:
            raw_models = models
            
        for m in raw_models:
            if hasattr(m, 'model'):
                model_names.append(m.model)
            elif isinstance(m, dict):
                model_names.append(m.get('model', m.get('name', '')))
                
        if MODEL_NAME in model_names:
            print(f"✅ Model '{MODEL_NAME}' found in Ollama list")
            test_ollama_generation()
        else:
            print(f"❌ Model '{MODEL_NAME}' NOT found in Ollama list. Available: {model_names}")
            
    except Exception as e:
        print(f"❌ Failed to list models: {e}")
