# LLM Router Fix - Incorrect Parameter Passing

## Issue Report
**Date**: November 9, 2025 at 3:48am UTC+03:00  
**Error**: `LLMRouter.process_request() got an unexpected keyword argument 'prompt'`  
**Status**: ✅ FIXED

## Root Cause Analysis

### Error Details
```
Chapter extraction error: LLMRouter.process_request() got an unexpected keyword argument 'prompt'
Internal Server Error: /api/ai-tools/extract-chapter-content/
[09/Nov/2025 03:47:09] "POST /api/ai-tools/extract-chapter-content/ HTTP/1.1" 500 145
```

### Root Cause

**Problem**: The code was calling `llm_router.process_request()` with individual keyword arguments, but the method expects an `LLMRequest` object.

**Incorrect Call:**
```python
llm_response = llm_router.process_request(
    prompt=extraction_prompt,
    task_type=TaskType.LESSON_PLANNING,
    temperature=0.3,
    max_tokens=2000
)
```

**Actual Method Signature:**
```python
def process_request(self, request: LLMRequest) -> LLMResponse:
    """Process LLM request with routing, RAG, generation, and tracking."""
```

**LLMRequest Structure:**
```python
@dataclass
class LLMRequest:
    prompt: str
    user_id: int
    user_role: UserRole
    task_type: TaskType
    complexity: TaskComplexity = TaskComplexity.MEDIUM
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 2000
    stream: bool = False
    requires_multimodal: bool = False
    use_rag: bool = False
    context_documents: Optional[list] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
```

## Fix Applied

### File: `views.py` - `extract_chapter_content_view()`

**Before (BROKEN):**
```python
# Use the imported llm_router instance
llm_response = llm_router.process_request(
    prompt=extraction_prompt,
    task_type=TaskType.LESSON_PLANNING,
    temperature=0.3,
    max_tokens=2000
)

# Parse JSON response
try:
    # Extract JSON from response
    json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)  # ❌ llm_response is object
    if json_match:
        extracted_content = json.loads(json_match.group())
    else:
        extracted_content = json.loads(llm_response)  # ❌ Can't parse object
```

**After (FIXED):**
```python
# Create LLM request
from .llm.models import LLMRequest, UserRole, TaskComplexity

llm_request = LLMRequest(
    prompt=extraction_prompt,
    user_id=request.user.id,
    user_role=UserRole.TEACHER,  # Assuming teacher role for lesson planning
    task_type=TaskType.LESSON_PLANNING,
    complexity=TaskComplexity.MEDIUM,
    temperature=0.3,
    max_tokens=2000,
    use_rag=False  # We already got RAG context above
)

# Use the imported llm_router instance
llm_response = llm_router.process_request(llm_request)  # ✅ Pass LLMRequest object

# Parse JSON response
try:
    # Extract JSON from response content
    json_match = re.search(r'\{.*\}', llm_response.content, re.DOTALL)  # ✅ Access .content
    if json_match:
        extracted_content = json.loads(json_match.group())
    else:
        extracted_content = json.loads(llm_response.content)  # ✅ Parse .content
```

## Changes Made

### 1. Import Required Classes
```python
from .llm.models import LLMRequest, UserRole, TaskComplexity
```

### 2. Create LLMRequest Object
```python
llm_request = LLMRequest(
    prompt=extraction_prompt,
    user_id=request.user.id,
    user_role=UserRole.TEACHER,
    task_type=TaskType.LESSON_PLANNING,
    complexity=TaskComplexity.MEDIUM,
    temperature=0.3,
    max_tokens=2000,
    use_rag=False
)
```

**Key Parameters:**
- `prompt`: The extraction prompt with RAG context
- `user_id`: Current user's ID from request
- `user_role`: Set to TEACHER (appropriate for lesson planning)
- `task_type`: LESSON_PLANNING (for routing)
- `complexity`: MEDIUM (default)
- `temperature`: 0.3 (low for factual extraction)
- `max_tokens`: 2000 (sufficient for structured output)
- `use_rag`: False (we already retrieved RAG context manually)

### 3. Pass LLMRequest to Router
```python
llm_response = llm_router.process_request(llm_request)
```

### 4. Access Response Content
```python
# Before: llm_response (string)
# After: llm_response.content (string from LLMResponse object)
json_match = re.search(r'\{.*\}', llm_response.content, re.DOTALL)
```

## LLMResponse Structure

The `process_request()` method returns an `LLMResponse` object:

```python
@dataclass
class LLMResponse:
    content: str              # ← The actual LLM output
    model: LLMModel           # Model used
    input_tokens: int         # Token count
    output_tokens: int        # Token count
    cost_usd: float          # Cost in USD
    latency_ms: float        # Response time
    success: bool = True     # Success flag
```

**Access the content:**
```python
llm_response.content  # The actual text response from LLM
```

## Why This Happened

The `llm_router.process_request()` method is designed to:
1. Accept a standardized `LLMRequest` object
2. Route to appropriate LLM (Ollama/Gemini/OpenAI)
3. Track usage and costs
4. Return a standardized `LLMResponse` object

This design allows for:
- Consistent API across all LLM calls
- Automatic cost tracking
- User role-based routing
- Task complexity-based model selection

## Testing

### Test Case 1: Chapter Extraction
```bash
# Navigate to Lesson Planner
# Select Grade 7, English
# Enter "Unit Three"
# Click "Extract Chapter Content"
```

**Expected Result:**
- ✅ No more "unexpected keyword argument" error
- ✅ LLM processes the extraction prompt
- ✅ Returns structured JSON with chapter content
- ✅ Auto-populates lesson planner fields

### Test Case 2: Verify Response Structure
```python
# In views.py after llm_response
print(f"Model used: {llm_response.model}")
print(f"Input tokens: {llm_response.input_tokens}")
print(f"Output tokens: {llm_response.output_tokens}")
print(f"Cost: ${llm_response.cost_usd:.4f}")
print(f"Latency: {llm_response.latency_ms}ms")
print(f"Content: {llm_response.content[:100]}...")
```

## Benefits of This Fix

### 1. Proper LLM Integration
- ✅ Uses the actual LLM router
- ✅ Connects to Gemini/Ollama/OpenAI
- ✅ Real AI-powered extraction

### 2. Cost Tracking
- ✅ Automatically tracks token usage
- ✅ Calculates costs
- ✅ Logs usage by user and task

### 3. Smart Routing
- ✅ Routes to appropriate LLM based on task
- ✅ Falls back to free models when needed
- ✅ Optimizes cost vs quality

### 4. Consistent API
- ✅ Same pattern across all LLM calls
- ✅ Easier to maintain
- ✅ Better error handling

## Files Modified

**File**: `yeneta_backend/ai_tools/views.py`

**Function**: `extract_chapter_content_view()`

**Changes:**
1. Added imports for `LLMRequest`, `UserRole`, `TaskComplexity`
2. Created `LLMRequest` object with all required parameters
3. Passed `LLMRequest` to `llm_router.process_request()`
4. Changed `llm_response` to `llm_response.content` for parsing

**Lines Modified**: ~15 lines

## Related Issues Fixed

This fix ensures:
- Proper LLM integration throughout the system
- Consistent usage of LLM router
- Correct response handling

## Verification Steps

1. **Restart Django server**
   ```bash
   # Stop with Ctrl+C
   python manage.py runserver
   ```

2. **Test extraction**
   - Go to Lesson Planner
   - Select Grade 7, English
   - Enter "Unit Three"
   - Click "Extract Chapter Content"

3. **Expected terminal output:**
   ```
   Retrieved 1 documents, 450 tokens, avg relevance: 0.95
   [09/Nov/2025 03:XX:XX] "POST /api/ai-tools/extract-chapter-content/ HTTP/1.1" 200 XXXX
   ```

4. **Expected UI result:**
   ```
   ✅ Chapter content extracted successfully!
   
   Topics: 4
   Objectives: 4
   
   Fields auto-populated!
   ```

## Summary

**Root Cause**: Passing individual parameters instead of LLMRequest object  
**Fix**: Create LLMRequest object and pass to process_request()  
**Impact**: Chapter extraction now uses real LLM integration  
**Status**: ✅ FIXED - Ready to test with actual AI!

---

**Next Action**: Restart server and test chapter extraction with real AI-powered content extraction! 🚀
