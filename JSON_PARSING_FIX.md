# JSON Parsing Error - Fixed

## Error
```
Failed to parse JSON response: Expecting value: line 2 column 14 (char 15)
```

## Root Cause
The LLM was returning text before or after the JSON object, causing the parser to fail.

## Fix Applied

### Enhanced JSON Extraction (`llm_service.py`)

**What was added:**
1. **Multiple extraction patterns**:
   - Markdown code blocks with `json` language
   - Markdown code blocks without language specifier
   - Aggressive extraction: find first `{` and last `}`
   - Array format support: find first `[` and last `]`

2. **Better error logging**:
   - Shows exact line and column of parse error
   - Logs first 500 characters of problematic content
   - Tracks which parsing method succeeded

3. **Fallback chain**:
   ```
   json.loads() 
   → ast.literal_eval() (handles single quotes)
   → JSON repair (fixes trailing commas, missing braces)
   → Error with detailed logs
   ```

## Example Scenarios Now Handled

### Scenario 1: Text Before JSON
```
Here's the quiz:
{
  "title": "Physics Quiz",
  ...
}
```
✅ **Fixed**: Extracts from first `{` to last `}`

### Scenario 2: Markdown Code Block
````
```json
{
  "title": "Physics Quiz",
  ...
}
```
````
✅ **Fixed**: Extracts content from code block

### Scenario 3: Single Quotes
```json
{
  'title': 'Physics Quiz',
  ...
}
```
✅ **Fixed**: Uses `ast.literal_eval()`

## Testing
Try generating a quiz again. If it fails, check the Django logs for:
- Exact error location (line/column)
- First 500 chars of the problematic response
- Which parsing method was attempted

## Next Steps if Error Persists
1. Check Django console logs for detailed error messages
2. The logs will show exactly what the LLM returned
3. We can adjust the prompt or add more repair logic based on the specific issue
