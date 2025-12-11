import json
import re
import logging

logger = logging.getLogger(__name__)

def clean_json_response(content: str) -> str:
    """
    Clean JSON response from LLM by extracting JSON object.
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
            
            def clean_strings(obj, key=None):
                if isinstance(obj, dict):
                    return {k: clean_strings(v, k) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [clean_strings(item, key) for item in obj]
                elif isinstance(obj, str):
                    # Preserve formatting for specific fields
                    if key in ['content', 'content_sections', 'description', 'text', 'script', 'feedback', 'explanation']:
                        return obj.strip()
                        
                    # Replace newlines with spaces, collapse multiple spaces
                    cleaned = obj.replace('\n', ' ').replace('\r', ' ')
                    cleaned = re.sub(r'\s+', ' ', cleaned)
                    return cleaned.strip()
                else:
                    return obj
            
            cleaned_parsed = clean_strings(parsed)
            return json.dumps(cleaned_parsed)
        except json.JSONDecodeError:
            return json_str
    
    return content.strip()

# Test cases
test_json = """
{
    "title": "Test Lesson",
    "content": "Line 1\\nLine 2\\nLine 3",
    "content_sections": ["Section 1", "Section 2\\nWith Newline"],
    "other_field": "Should be\\nflattened"
}
"""

print("Original JSON:", test_json)
cleaned = clean_json_response(test_json)
print("\nCleaned JSON:", cleaned)

parsed = json.loads(cleaned)
print(f"\nContent: {repr(parsed['content'])}")
print(f"Content Sections: {parsed['content_sections']}")
print(f"Other Field: {repr(parsed['other_field'])}")

if '\n' in parsed['content']:
    print("SUCCESS: Content newlines preserved")
else:
    print("FAILURE: Content newlines lost")

if '\n' not in parsed['other_field']:
    print("SUCCESS: Other field flattened")
else:
    print("FAILURE: Other field not flattened")
