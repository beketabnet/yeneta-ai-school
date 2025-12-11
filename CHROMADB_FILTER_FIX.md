# ChromaDB Filter Syntax Fix

## Issue Report
**Date**: November 9, 2025 at 3:27am UTC+03:00  
**Error**: `Expected where to have exactly one operator, got {'grade': 'Grade 7', 'subject': 'English'} in query.`  
**Status**: ✅ FIXED

## Root Cause Analysis

### Error Details
```
Search failed: Expected where to have exactly one operator, got {'grade': 'Grade 7', 'subject': 'English'} in query.
[09/Nov/2025 03:23:59] "POST /api/ai-tools/extract-chapter-content/ HTTP/1.1" 200 122
```

### Root Cause
**ChromaDB Query Syntax Issue**

ChromaDB requires a specific operator-based syntax for the `where` clause, but we were passing a plain Python dictionary.

**What We Did (WRONG):**
```python
filter_metadata = {'grade': 'Grade 7', 'subject': 'English'}
results = collection.query(
    query_embeddings=[embedding],
    where=filter_metadata  # ❌ Plain dict not supported
)
```

**What ChromaDB Expects:**
```python
# Single filter
where = {"grade": {"$eq": "Grade 7"}}

# Multiple filters
where = {
    "$and": [
        {"grade": {"$eq": "Grade 7"}},
        {"subject": {"$eq": "English"}}
    ]
}
```

## ChromaDB Where Clause Syntax

### Supported Operators
- `$eq` - Equals
- `$ne` - Not equals
- `$gt` - Greater than
- `$gte` - Greater than or equal
- `$lt` - Less than
- `$lte` - Less than or equal
- `$in` - In array
- `$nin` - Not in array
- `$and` - Logical AND
- `$or` - Logical OR

### Examples

**Single Condition:**
```python
where = {"grade": {"$eq": "Grade 7"}}
```

**Multiple Conditions (AND):**
```python
where = {
    "$and": [
        {"grade": {"$eq": "Grade 7"}},
        {"subject": {"$eq": "English"}}
    ]
}
```

**Multiple Conditions (OR):**
```python
where = {
    "$or": [
        {"grade": {"$eq": "Grade 7"}},
        {"grade": {"$eq": "Grade 8"}}
    ]
}
```

**Complex Conditions:**
```python
where = {
    "$and": [
        {"grade": {"$eq": "Grade 7"}},
        {
            "$or": [
                {"subject": {"$eq": "English"}},
                {"subject": {"$eq": "Math"}}
            ]
        }
    ]
}
```

## Fix Implementation

### Modified File: `vector_store.py`

**Function**: `search()`

**Before (BROKEN):**
```python
def search(
    self,
    query: str,
    n_results: int = 5,
    filter_metadata: Optional[Dict] = None
) -> List[Dict]:
    # ...
    results = self.collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where=filter_metadata  # ❌ Direct pass - doesn't work
    )
```

**After (FIXED):**
```python
def search(
    self,
    query: str,
    n_results: int = 5,
    filter_metadata: Optional[Dict] = None
) -> List[Dict]:
    # ...
    
    # Convert filter_metadata to ChromaDB where clause format
    where_clause = None
    if filter_metadata and len(filter_metadata) > 0:
        if len(filter_metadata) == 1:
            # Single filter: {"field": {"$eq": "value"}}
            key, value = list(filter_metadata.items())[0]
            where_clause = {key: {"$eq": value}}
        else:
            # Multiple filters: {"$and": [{"field1": {"$eq": "value1"}}, ...]}
            conditions = [{key: {"$eq": value}} for key, value in filter_metadata.items()]
            where_clause = {"$and": conditions}
    
    results = self.collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where=where_clause  # ✅ Properly formatted
    )
```

### Conversion Logic

**Input:** `{'grade': 'Grade 7', 'subject': 'English'}`

**Output:**
```python
{
    "$and": [
        {"grade": {"$eq": "Grade 7"}},
        {"subject": {"$eq": "English"}}
    ]
}
```

**Input:** `{'grade': 'Grade 7'}`

**Output:**
```python
{"grade": {"$eq": "Grade 7"}}
```

**Input:** `None` or `{}`

**Output:** `None` (no filtering)

## Additional Improvements

### 1. Enhanced Error Messages

**Modified File**: `views.py` - `extract_chapter_content_view()`

**Before:**
```python
return Response({
    'success': False,
    'message': f'No curriculum content found for {grade} {subject}, Chapter: {chapter}',
    'extracted_content': None
})
```

**After:**
```python
return Response({
    'success': False,
    'message': f'No curriculum content found for {grade} {subject}, Chapter: {chapter}.\n\n'
              f'Possible reasons:\n'
              f'1. No curriculum documents have been uploaded for {grade} {subject}\n'
              f'2. The chapter/unit name doesn\'t match any content in the curriculum\n'
              f'3. Try a different chapter number or name\n\n'
              f'Please contact your administrator to upload curriculum documents to the system.',
    'extracted_content': None,
    'suggestions': [
        'Verify the chapter/unit number is correct',
        'Try using just the number (e.g., "3" instead of "Chapter 3")',
        'Check if curriculum documents are uploaded for this grade and subject',
        'Contact administrator to upload curriculum files'
    ]
})
```

### 2. Frontend Error Display

**Modified File**: `LessonPlanner.tsx`

**Enhanced Error Handling:**
```typescript
if (response.success && response.extracted_content) {
    // Success handling...
} else {
    // Display detailed error message with suggestions
    let errorMsg = response.message || 'No content found for this chapter';
    if (response.suggestions && response.suggestions.length > 0) {
        errorMsg += '\n\nSuggestions:\n' + 
            response.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n');
    }
    setExtractionError(errorMsg);
}
```

**Enhanced UI Display:**
```tsx
{extractionError && (
    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
        <div className="font-semibold mb-1">❌ Extraction Failed</div>
        <div className="whitespace-pre-line">{extractionError}</div>
    </div>
)}
```

## Testing

### Test Case 1: Single Filter
```python
filter_metadata = {'grade': 'Grade 7'}
# Result: {"grade": {"$eq": "Grade 7"}}
```

### Test Case 2: Multiple Filters
```python
filter_metadata = {'grade': 'Grade 7', 'subject': 'English'}
# Result: {"$and": [{"grade": {"$eq": "Grade 7"}}, {"subject": {"$eq": "English"}}]}
```

### Test Case 3: No Filter
```python
filter_metadata = None
# Result: None (no where clause)
```

### Test Case 4: Empty Filter
```python
filter_metadata = {}
# Result: None (no where clause)
```

## Current Limitation: Empty Vector Store

**Important Note**: After fixing the ChromaDB syntax, the system now correctly queries the vector store, but **no curriculum documents have been uploaded yet**.

### Expected Behavior Now:
1. ✅ ChromaDB query executes without errors
2. ✅ Returns empty results (no documents match)
3. ✅ Shows helpful error message with suggestions
4. ✅ Guides user to contact administrator

### Error Message Displayed:
```
❌ Extraction Failed

No curriculum content found for Grade 7 English, Chapter: UNIT THREE.

Possible reasons:
1. No curriculum documents have been uploaded for Grade 7 English
2. The chapter/unit name doesn't match any content in the curriculum
3. Try a different chapter number or name

Please contact your administrator to upload curriculum documents to the system.

Suggestions:
1. Verify the chapter/unit number is correct
2. Try using just the number (e.g., "3" instead of "Chapter 3")
3. Check if curriculum documents are uploaded for this grade and subject
4. Contact administrator to upload curriculum files
```

## Next Steps: Uploading Curriculum Documents

To make the extraction feature fully functional, curriculum documents need to be uploaded:

### Option 1: Admin Upload Interface
Use the existing RAG management interface:
1. Navigate to Admin Dashboard
2. Go to RAG Management
3. Upload curriculum PDFs for each grade/subject
4. System will process and add to vector store

### Option 2: Management Command
Create a Django management command:
```bash
python manage.py upload_curriculum --grade "Grade 7" --subject "English" --file "path/to/grade7_english.pdf"
```

### Option 3: Bulk Upload Script
Process multiple files at once:
```python
from ai_tools.llm import document_processor, vector_store

# Process PDF
chunks = document_processor.process_pdf(
    file_path="grade7_english.pdf",
    metadata={"grade": "Grade 7", "subject": "English"}
)

# Add to vector store
vector_store.add_documents(chunks)
```

## Files Modified

### Backend
1. **`yeneta_backend/ai_tools/llm/vector_store.py`**
   - Modified `search()` method
   - Added ChromaDB where clause conversion logic
   - Lines changed: ~15 lines

2. **`yeneta_backend/ai_tools/views.py`**
   - Enhanced error messages in `extract_chapter_content_view()`
   - Added helpful suggestions
   - Lines changed: ~10 lines

### Frontend
3. **`components/teacher/LessonPlanner.tsx`**
   - Enhanced error display with suggestions
   - Improved UI formatting for errors
   - Lines changed: ~5 lines

### Documentation
4. **`CHROMADB_FILTER_FIX.md`** (this file)

## Summary

### Issues Fixed
✅ ChromaDB filter syntax error  
✅ Query now executes without errors  
✅ Better error messages for empty results  
✅ Helpful suggestions for users  
✅ Improved UI error display  

### Remaining Task
⚠️ **Upload curriculum documents** to vector store for Grade 7 English (and other grades/subjects)

### User Experience
**Before Fix:**
- Error: "Expected where to have exactly one operator..."
- Confusing technical error
- No guidance

**After Fix:**
- Clear message: "No curriculum content found"
- Explains possible reasons
- Provides actionable suggestions
- Guides to contact administrator

---

**Status**: ✅ ChromaDB Query Fixed  
**Next Action**: Upload curriculum documents to vector store  
**Impact**: System now ready to extract content once documents are uploaded
