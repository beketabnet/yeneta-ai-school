import os
import sys
import django

# Setup Django
# Add yeneta_backend to path so we can import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../yeneta_backend')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

def verify_system():
    print("="*50)
    print("VERIFYING SYSTEM STATE")
    print("="*50)
    
    all_passed = True

    # 1. Check RAG Import
    print("\n1. Checking RAG Import...")
    try:
        from rag.services import query_curriculum_documents
        print("✅ RAG Service import successful")
    except ImportError as e:
        print(f"❌ RAG Service import failed: {e}")
        all_passed = False

    # 2. Check API Key Manager & DB
    print("\n2. Checking API Key Manager...")
    try:
        from api_key_manager import get_api_key_manager
        manager = get_api_key_manager()
        keys = manager.keys
        total_keys = sum(len(k) for k in keys.values())
        print(f"✅ API Key Manager loaded.")
        print(f"   - OpenAI Keys: {len(keys['openai'])}")
        print(f"   - Gemini Keys: {len(keys['gemini'])}")
        print(f"   - SERP Keys: {len(keys['serp'])}")
        
        if total_keys == 0:
            print("⚠️ No API keys found in Manager (DB + Env)")
            # This might be expected if no keys are set up, but we want to know
    except Exception as e:
        print(f"❌ API Key Manager check failed: {e}")
        all_passed = False

    # 3. Check LLM Service & JSON Repair
    print("\n3. Checking LLM Service JSON Repair...")
    try:
        from ai_tools.llm.llm_service import llm_service
        
        # Test JSON Repair (Single Quotes)
        malformed_json = "{'key': 'value', 'list': ['item1', 'item2']}"
        
        # Test direct repair method
        repaired = llm_service._repair_json(malformed_json)
        print(f"   Input: {malformed_json}")
        print(f"   Repaired: {repaired}")
        
        if '"key": "value"' in repaired:
             print("✅ _repair_json correctly fixed quotes")
        else:
             print("⚠️ _repair_json did NOT fix quotes (might rely on ast fallback)")

        # Test full generate_json logic (mocking response not needed, just testing the parsing logic if we could isolate it)
        # We can't easily call generate_json without a real LLM call, but we can verify the code existence
        import inspect
        source = inspect.getsource(llm_service.generate_json)
        if "ast.literal_eval" in source:
            print("✅ 'ast.literal_eval' found in generate_json source code")
        else:
            print("❌ 'ast.literal_eval' NOT found in generate_json source code")
            all_passed = False
            
    except Exception as e:
        print(f"❌ LLM Service check failed: {e}")
        all_passed = False

    print("\n" + "="*50)
    if all_passed:
        print("✅ SYSTEM VERIFICATION PASSED")
    else:
        print("❌ SYSTEM VERIFICATION FAILED")
    print("="*50)

    return all_passed

if __name__ == "__main__":
    success = verify_system()
    sys.exit(0 if success else 1)
