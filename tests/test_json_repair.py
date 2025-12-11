import sys
import os
import json
import types
from unittest.mock import MagicMock

# Immediate debug write
try:
    with open('test_debug_crash.txt', 'w') as f:
        f.write("Script started.\n")
except:
    pass

try:
    # Mock external dependencies BEFORE importing llm_service
    # Use ModuleType to avoid "openai.__spec__ is not set" errors
    sys.modules['ollama'] = types.ModuleType('ollama')
    sys.modules['google'] = types.ModuleType('google')
    sys.modules['google.generativeai'] = types.ModuleType('google.generativeai')
    sys.modules['openai'] = types.ModuleType('openai')
    sys.modules['tiktoken'] = types.ModuleType('tiktoken')

    # Add backend path to sys.path so imports work
    sys.path.append('D:/django_project/yeneta-ai-school/yeneta_backend')

    from ai_tools.llm.llm_service import LLMService

    class MockLLMService(LLMService):
        def __init__(self):
            # Skip initialization of clients
            self.openai_available = False
            self.genai_available = False
            self.ollama_available = False

    def test_json_repair():
        service = MockLLMService()
        
        with open('test_repair_result.txt', 'w', encoding='utf-8') as f:
            f.write("Starting JSON Repair Test...\n")
            
            # 1. Test Truncated JSON (Missing closing brackets)
            # ... (same setup)
            
            # Let's test the specific error case from the user log first.
            log_error_json = """
            {
                "title": "Unit 3 English Quiz",
                "questions": [
                    {
                        "text": "Q1"
                    },
                    {
                        "text": "What is the difference between a fact and an opinion?",       
                        "type": "short_answer",
                        "explanation": "Facts are objective.",
                    }
            """
            # Note the trailing comma after "objective.", and missing ] }
            
            f.write("Testing Repair Logic on Log Error Case...\n")
            
            try:
                repaired = service._repair_json(log_error_json)
                f.write(f"Repaired JSON:\n{repaired}\n")
                parsed = json.loads(repaired)
                f.write("✅ Successfully parsed repaired JSON\n")
            except Exception as e:
                f.write(f"❌ Failed to parse: {e}\n")

            # 2. Test Trailing Comma
            trailing_comma_json = """
            {
                "items": [1, 2, 3,],
                "key": "value",
            }
            """
            f.write("\nTesting Trailing Comma...\n")
            try:
                repaired = service._repair_json(trailing_comma_json)
                parsed = json.loads(repaired)
                f.write("✅ Successfully parsed trailing comma JSON\n")
            except Exception as e:
                f.write(f"❌ Failed to parse trailing comma: {e}\n")
                
            # 3. Test Truncated List
            truncated_list = """
            {
                "items": [
                    {"id": 1},
                    {"id": 2
            """
            f.write("\nTesting Truncated List...\n")
            try:
                repaired = service._repair_json(truncated_list)
                f.write(f"Repaired List JSON:\n{repaired}\n")
                parsed = json.loads(repaired)
                f.write("✅ Successfully parsed truncated list JSON\n")
            except Exception as e:
                f.write(f"❌ Failed to parse truncated list: {e}\n")

    if __name__ == "__main__":
        test_json_repair()

except Exception as e:
    with open('test_debug_crash.txt', 'a') as f:
        f.write(f"Crash: {e}\n")
        import traceback
        traceback.print_exc(file=f)
