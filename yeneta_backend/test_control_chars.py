import json
import re
import logging

# Mock logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_lesson_content_response(content: str) -> str:
    """
    Clean JSON response specifically for lesson content generation.
    Preserves newlines in string values to maintain Markdown formatting.
    """
    # Remove any markdown code block markers
    content = re.sub(r'```(?:json)?', '', content)
    content = re.sub(r'```', '', content)
    
    # Remove "json {" pattern that sometimes appears
    content = re.sub(r'json\s*\{', '{', content, flags=re.IGNORECASE)
    
    # Try to find JSON object directly
    json_match = re.search(r'\{.*\}', content, re.DOTALL)
    if json_match:
        json_str = json_match.group(0).strip()
        
        try:
            parsed = json.loads(json_str)
            return json.dumps(parsed)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed in lesson content, attempting to fix: {e}")
            
            # Fix unescaped backslashes
            json_str = re.sub(r'(?<!\\)\\(?![\\"nrtbf/])', r'\\\\', json_str)
            
            # Fix unescaped newlines in strings (replace with \n to preserve formatting)
            json_str = re.sub(r'(?<!\\)\n', '\\n', json_str)
            
            # Fix unescaped carriage returns and tabs
            json_str = re.sub(r'(?<!\\)\r', '\\r', json_str)
            json_str = re.sub(r'(?<!\\)\t', '\\t', json_str)
            
            # Remove any remaining control characters (0x00-0x1f) that are invalid in JSON strings
            json_str = re.sub(r'[\x00-\x1f]', ' ', json_str)
            
            # Fix trailing commas
            json_str = re.sub(r',\s*}', '}', json_str)
            json_str = re.sub(r',\s*]', ']', json_str)
            
            # Fix missing commas between array/object elements
            json_str = re.sub(r'}\s*{', '},{', json_str)
            json_str = re.sub(r']\s*\[', '],[', json_str)
            
            # Fix string concatenation
            json_str = re.sub(r'"\s*\+\s*"', '', json_str)
            
            # Fix missing commas between key-value pairs (common Ollama issue)
            json_str = re.sub(r'"\s+(?="[\w]+"\s*:)', '", ', json_str)
            
            # Try parsing again
            try:
                parsed = json.loads(json_str)
                return json.dumps(parsed)
            except json.JSONDecodeError:
                return json_str
    
    return content.strip()

# Test Cases
test_cases = [
    # Case 1: Unescaped control characters (tab and newline)
    """
    {
        "title": "Control Chars",
        "content": "Line 1\nLine 2\tTabbed"
    }
    """,
    
    # Case 2: Invalid control character (0x03)
    """
    {
        "title": "Invalid Char",
        "content": "Text\x03End"
    }
    """
]

for i, case in enumerate(test_cases):
    print(f"\n--- Test Case {i+1} ---")
    cleaned = clean_lesson_content_response(case)
    try:
        parsed = json.loads(cleaned)
        print("SUCCESS: Parsed successfully")
        print(f"Content: {repr(parsed.get('content'))}")
    except json.JSONDecodeError as e:
        print(f"FAILURE: Could not parse. Error: {e}")
        print(f"Cleaned output: {repr(cleaned)}")
