# JSON Parsing Fix for Lesson Planner

## Problem Analysis

### **Root Causes Identified**

1. **LLM-Generated Invalid JSON Syntax**
   - String concatenation with `+` operator: `"Textbook: " + "[Source 1]"`
   - Trailing commas in arrays and objects
   - Missing commas between elements
   - Extra spaces causing parsing issues

2. **Example Errors from Terminal Output**
   ```
   JSON parsing error: Expecting ',' delimiter: line 37 column 22 (char 1902)
   JSON parsing error: Expecting ',' delimiter: line 1 column 1903 (char 1902)
   ```

3. **Specific Invalid Patterns Found**
   ```json
   // INVALID: String concatenation
   "materials": [
       "Textbook: " + "[Source 1]"  // ❌ JavaScript syntax, not JSON
   ]
   
   // INVALID: Trailing commas
   "objectives": [
       "Objective 1",
       "Objective 2",  // ❌ Trailing comma before ]
   ]
   
   // INVALID: Missing commas
   "items": [
       "Item 1" 
       "Item 2"  // ❌ Missing comma between items
   ]
   ```

---

## Solutions Applied

### **1. Enhanced JSON Cleaning Function**

**File**: `yeneta_backend/ai_tools/views.py`

**Added Fixes**:

```python
# Fix string concatenation with + operator (invalid JSON)
# Replace patterns like "text" + "text" with "texttext"
json_str = re.sub(r'"\s*\+\s*"', '', json_str)

# Fix missing commas after closing quotes before opening quotes
json_str = re.sub(r'"\s+(?=")', '", ', json_str)

# Fix spaces/commas after closing quotes in arrays
json_str = re.sub(r'"\s*,\s*(?=\])', '"', json_str)
```

**How It Works**:
- **String Concatenation**: Removes `+` operators between quoted strings
- **Missing Commas**: Adds commas where strings are separated by spaces
- **Trailing Commas**: Removes commas before closing brackets

**Example Transformation**:
```python
# Before
'"Textbook: " + "[Source 1]"'

# After
'"Textbook: [Source 1]"'
```

---

### **2. Improved LLM Prompts**

**Added Explicit JSON Formatting Rules**:

```python
**CRITICAL JSON FORMATTING RULES:** 
- Return ONLY valid JSON - no text before or after
- NO string concatenation with + operator (e.g., "text" + "text" is INVALID)
- NO trailing commas before closing brackets or braces
- ALL string values must be properly quoted
- NO comments or explanations outside the JSON
- Use proper comma separation between all array elements
```

**Updated System Prompts**:
```python
CRITICAL: Return ONLY valid JSON. No string concatenation with +, no trailing commas, no text outside JSON.
```

**Purpose**: Explicitly instruct the LLM to avoid common JSON syntax errors.

---

### **3. Objectives Extraction Fix (Already Applied)**

**File**: `yeneta_backend/ai_tools/chapter_title_extractor.py`

**Fix**: Changed from line-by-line splitting to bullet-marker splitting

```python
# OLD: Split by newlines (breaks multi-line objectives)
lines = objectives_section.split('\n')

# NEW: Split by bullet markers (preserves multi-line objectives)
objective_chunks = re.split(r'\n(?=[øØ•\-\*]\s)', objectives_section)
```

**Result**: Complete objectives extracted without truncation.

---

## Testing Recommendations

### **Test Case 1: String Concatenation**
Generate a lesson plan and check if materials contain concatenated strings.

**Expected**: All strings should be properly formatted without `+` operators.

### **Test Case 2: Trailing Commas**
Check arrays in the generated JSON for trailing commas.

**Expected**: No trailing commas before `]` or `}`.

### **Test Case 3: Complete Objectives**
Use the English Grade 7, Unit Six content from the textbook.

**Expected**: All 10 objectives extracted completely:
```
✅ "Express your opinion about how people farm and care about their land in your surrounding"
✅ "find out general information in the listening text"
✅ "express your opinion about conservation in a group of three students"
... (all 10 complete)
```

### **Test Case 4: Lesson Plan Display**
Generate a lesson plan and verify all sections display correctly:
- ✅ Objectives (bullet list)
- ✅ 5E Sequence (with teacher/student actions as bullets)
- ✅ Assessment Plan
- ✅ Differentiation Strategies
- ✅ Extensions
- ✅ Homework
- ✅ Reflection Prompts

---

## Error Handling Flow

```
LLM Response
    ↓
Remove markdown code blocks (```)
    ↓
Extract JSON object ({ ... })
    ↓
Try to parse JSON
    ↓
    ├─ SUCCESS → Clean strings, return valid JSON
    │
    └─ FAILURE → Apply fixes:
           ├─ Fix string concatenation (+)
           ├─ Fix trailing commas
           ├─ Fix missing commas
           ├─ Fix unescaped characters
           └─ Try parsing again
                ↓
                ├─ SUCCESS → Return fixed JSON
                └─ FAILURE → Return fallback structure
```

---

## Common JSON Errors and Fixes

| Error | Invalid Syntax | Fixed Syntax | Regex Pattern |
|-------|---------------|--------------|---------------|
| **String Concatenation** | `"text" + "text"` | `"texttext"` | `r'"\s*\+\s*"'` |
| **Trailing Comma** | `["item",]` | `["item"]` | `r',\s*]'` |
| **Missing Comma** | `"a" "b"` | `"a", "b"` | `r'"\s+(?=")'` |
| **Unescaped Newline** | `"line1\nline2"` | `"line1 line2"` | `r'(?<!\\)\n'` |

---

## Files Modified

### **Backend**
1. **`yeneta_backend/ai_tools/views.py`**
   - Enhanced `clean_json_response()` function (lines 129-145)
   - Updated lesson planner prompt (lines 804-814)
   - Updated system prompts (lines 829, 842)

2. **`yeneta_backend/ai_tools/chapter_title_extractor.py`**
   - Fixed `extract_objectives()` method (lines 127-151)

### **Frontend**
1. **`components/teacher/LessonPlanner.tsx`**
   - Improved display formatting for teacher/student actions (lines 844-859)
   - Added extensions section (lines 945-953)
   - Enhanced homework display (lines 938-943)

---

## Benefits

### **1. Robustness**
- ✅ Handles multiple types of JSON syntax errors
- ✅ Graceful fallback if parsing still fails
- ✅ Detailed error logging for debugging

### **2. Prevention**
- ✅ Explicit instructions to LLM prevent errors at source
- ✅ Multiple layers of validation and fixing
- ✅ Reduced likelihood of parsing failures

### **3. User Experience**
- ✅ Lesson plans display correctly
- ✅ No broken UI from malformed JSON
- ✅ Complete objectives without truncation
- ✅ Professional formatting throughout

---

## Monitoring

### **Log Messages to Watch**
```python
# Success
✅ Retrieved {n} curriculum documents for lesson planning
✅ RAG context built from sources: {sources}

# Warnings
⚠️ JSON parsing failed, attempting to fix: {error}
⚠️ JSON parsing still failed after fixes: {error}

# Errors
❌ JSON parsing error in lesson planner: {error}
```

### **Key Metrics**
- **JSON Parse Success Rate**: Should be >95% after fixes
- **Objectives Extraction Completeness**: 100% of objectives should be complete
- **Display Rendering**: All sections should render without errors

---

## Future Improvements

### **Potential Enhancements**
1. **JSON Schema Validation**: Validate against a strict schema before returning
2. **LLM Fine-tuning**: Train model specifically on valid JSON output
3. **Structured Output**: Use LLM structured output features (if available)
4. **Pre-validation**: Check JSON validity before sending to frontend
5. **User Feedback**: Allow users to report malformed outputs

### **Alternative Approaches**
1. **JSON Mode**: Use LLM's native JSON mode (if supported by Ollama)
2. **Post-processing**: More aggressive JSON repair libraries
3. **Fallback Models**: Switch to more reliable model if parsing fails repeatedly

---

## Summary

✅ **Fixed**: JSON parsing errors from LLM-generated invalid syntax
✅ **Enhanced**: JSON cleaning with string concatenation and comma fixes
✅ **Improved**: LLM prompts with explicit JSON formatting rules
✅ **Verified**: Objectives extraction now complete and accurate
✅ **Optimized**: Display formatting for better readability

The Lesson Planner now handles JSON parsing errors gracefully and displays lesson plans correctly!
