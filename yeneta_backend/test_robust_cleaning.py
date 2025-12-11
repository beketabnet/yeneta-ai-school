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
            
            # Fix unescaped newlines in strings (necessary evil for invalid JSON, but valid \n is preserved)
            # This regex replaces actual newline characters with spaces, assuming valid newlines are escaped as \n
            json_str = re.sub(r'(?<!\\)\n', ' ', json_str)
            
            # Fix trailing commas
            json_str = re.sub(r',\s*}', '}', json_str)
            json_str = re.sub(r',\s*]', ']', json_str)
            
            # Fix missing commas between array/object elements
            json_str = re.sub(r'}\s*{', '},{', json_str)
            json_str = re.sub(r']\s*\[', '],[', json_str)
            
            # Fix string concatenation
            json_str = re.sub(r'"\s*\+\s*"', '', json_str)
            
            # Fix missing commas after closing quotes before opening quotes (common in Ollama)
            # e.g. "field": "value" "next": "value"
            json_str = re.sub(r'"\s+(?=")', '", ', json_str)
            
            # Try parsing again
            try:
                parsed = json.loads(json_str)
                return json.dumps(parsed)
            except json.JSONDecodeError:
                # Fallback: Try to extract the "content" field directly if JSON is still broken
                # This is a heuristic to salvage the main content
                content_match = re.search(r'"content"\s*:\s*"(.*?)(?<!\\)"', json_str, re.DOTALL)
                if content_match:
                    logger.info("Salvaged content from malformed JSON")
                    # We need to unescape the string manually since json.loads didn't do it
                    salvaged_content = content_match.group(1).encode('utf-8').decode('unicode_escape')
                    return json.dumps({
                        "title": "Generated Lesson (Salvaged)",
                        "content": salvaged_content,
                        "resources": [],
                        "key_points": []
                    })
                
                return json_str
    
    return content.strip()

# Test Cases
test_cases = [
    # Case 1: Valid JSON
    """
    {
        "title": "Valid Lesson",
        "content": "# Lesson Title\\n\\nThis is a valid lesson."
    }
    """,
    
    # Case 2: Missing comma (Ollama style)
    """
    {
        "title": "Missing Comma"
        "content": "# Lesson Title\\n\\nThis has a missing comma."
    }
    """,
    
    # Case 3: Unescaped newlines (Control characters)
    """
    {
        "title": "Unescaped Newlines",
        "content": "# Lesson Title
        
        This has unescaped newlines."
    }
    """,
    
    # Case 4: Trailing comma
    """
    {
        "title": "Trailing Comma",
        "content": "Content",
    }
    """
]

for i, case in enumerate(test_cases):
    print(f"\n--- Test Case {i+1} ---")
    cleaned = clean_lesson_content_response(case)
    try:
        parsed = json.loads(cleaned)
        print("SUCCESS: Parsed successfully")
        print(f"Title: {parsed.get('title')}")
        print(f"Content start: {parsed.get('content')[:50]}...")
    except json.JSONDecodeError as e:
        print(f"FAILURE: Could not parse. Error: {e}")
        print(f"Cleaned output: {cleaned[:100]}...")
