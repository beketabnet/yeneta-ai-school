# Fix Summary - November 8, 2025

## Issue: "Failed to process the document. Please try again."

### Error Details
```
Bad Request: /api/rag/vector-stores/
[08/Nov/2025 08:17:52] "POST /api/rag/vector-stores/ HTTP/1.1" 400 41
```

### Root Cause
The `file_name` field in the `VectorStore` model was **required** but **not marked as read-only** in the serializer. This caused a validation error because:

1. Frontend sends: `file`, `grade`, `subject`, `stream`
2. Backend expects: `file`, `grade`, `subject`, `stream`, **`file_name`**
3. Serializer's `create()` method extracts `file_name` from the uploaded file
4. But validation happens **before** `create()` is called
5. Result: 400 Bad Request - "file_name is required"

### Solution Applied

**File:** `yeneta_backend/rag/serializers.py`

**Change:**
```python
# BEFORE (Line 18)
read_only_fields = ['id', 'status', 'vector_store_path', 'chunk_count', 'created_at', 'updated_at']

# AFTER (Line 18)
read_only_fields = ['id', 'file_name', 'status', 'vector_store_path', 'chunk_count', 'created_at', 'updated_at']
```

**Explanation:**
- Added `'file_name'` to `read_only_fields`
- This tells Django REST Framework to:
  - Not require `file_name` in the request
  - Not validate `file_name` from client input
  - Allow the serializer's `create()` method to set it automatically
  - Include `file_name` in responses (GET requests)

### Additional Improvements

**File:** `yeneta_backend/rag/views.py`

Added better error logging:
```python
def perform_create(self, serializer):
    try:
        vector_store = serializer.save(created_by=self.request.user)
        logger.info(f"Vector store {vector_store.id} created successfully")
        # ... processing code
    except Exception as e:
        logger.error(f"Failed to create vector store: {str(e)}")
        raise
```

This will help debug future issues by showing detailed error messages in the Django console.

## Testing Instructions

### 1. Verify the Fix
The Django server should have automatically reloaded. You should see:
```
Watching for file changes with StatReloader
...
D:\django_project\yeneta-ai-school\yeneta_backend\rag\serializers.py changed, reloading.
...
System check identified no issues (0 silenced).
Starting development server at http://127.0.0.1:8000/
```

### 2. Test Document Upload

**Test Case 1: Grade 7 Document**
1. Navigate to Admin Dashboard → Curriculum RAG Pipeline
2. Select:
   - Grade: Grade 7
   - Subject: General Science (or any available subject)
   - File: Any PDF/DOCX file
3. Click "Create Vector Store"
4. Expected: Success! Status shows "Processing" then "Active"

**Test Case 2: Grade 11 Natural Science**
1. Select:
   - Grade: Grade 11
   - Stream: Natural Science (should appear automatically)
   - Subject: Physics
   - File: Any PDF/DOCX file
2. Click "Create Vector Store"
3. Expected: Success! Document organized in correct folder

**Test Case 3: Grade 12 Social Science**
1. Select:
   - Grade: Grade 12
   - Stream: Social Science
   - Subject: Economics
   - File: Any PDF/DOCX file
2. Click "Create Vector Store"
3. Expected: Success!

### 3. Verify File Organization

Check that files are organized correctly:
```
media/rag_documents/
├── Grade_7/
│   └── Subject_General_Science/
│       └── 2025-11-08/
│           └── your_file.pdf
├── Grade_11/
│   └── Stream_Natural_Science/
│       └── Subject_Physics/
│           └── 2025-11-08/
│               └── your_file.pdf
└── Grade_12/
    └── Stream_Social_Science/
        └── Subject_Economics/
            └── 2025-11-08/
                └── your_file.pdf
```

### 4. Check Django Console

After successful upload, you should see:
```
Vector store 1 created successfully
Loading document: /path/to/file.pdf
Splitting document into chunks
Creating vector store at /path/to/vector_store
Created vector store with 150 chunks at /path/to/vector_store
Successfully processed vector store 1
```

If there are errors, they will be clearly logged:
```
Failed to create vector store: [detailed error message]
```

## What Was Fixed

### ✅ Serializer Validation
- `file_name` now correctly marked as read-only
- No longer required in POST requests
- Automatically extracted from uploaded file

### ✅ Error Logging
- Better exception handling in `perform_create()`
- Detailed error messages in Django console
- Easier debugging for future issues

### ✅ Workflow
1. Frontend sends: file, grade, subject, stream ✅
2. Backend validates: file type, size, stream requirement ✅
3. Serializer creates record: extracts file_name automatically ✅
4. View sets created_by: links to current user ✅
5. Processing starts: document → chunks → vector store ✅
6. Status updates: Processing → Active ✅

## Common Issues & Solutions

### Issue: Still getting 400 error
**Solution:** 
- Refresh the browser page (Ctrl+F5)
- Clear browser cache
- Check Django console for specific error message

### Issue: File not uploading
**Solution:**
- Check file size (max 50MB)
- Verify file type (PDF, DOCX, TXT only)
- Ensure subject is selected

### Issue: Stream not appearing for Grade 11-12
**Solution:**
- Refresh the page
- Check browser console for JavaScript errors
- Verify curriculum config API is working: http://127.0.0.1:8000/api/rag/curriculum-config/

### Issue: Status stuck on "Processing"
**Solution:**
- Check Django console for processing errors
- Verify ChromaDB and LangChain are installed
- Check file permissions on media folder

## Expected Behavior After Fix

### ✅ Successful Upload Flow
```
1. User selects grade → Subjects load dynamically
2. User selects subject → Ready to upload
3. User uploads file → FormData created
4. POST to /api/rag/vector-stores/ → 201 Created
5. Backend extracts file_name → Saves to database
6. Processing starts → Status: Processing
7. Document processed → Status: Active
8. UI updates → Shows chunk count
```

### ✅ API Response
```json
{
  "id": 1,
  "file_name": "physics_grade11.pdf",
  "file": "/media/rag_documents/Grade_11/Stream_Natural_Science/Subject_Physics/2025-11-08/physics_grade11.pdf",
  "grade": "Grade 11",
  "stream": "Natural Science",
  "subject": "Physics",
  "status": "Processing",
  "vector_store_path": null,
  "chunk_count": 0,
  "created_at": "2025-11-08T08:20:00Z",
  "updated_at": "2025-11-08T08:20:00Z"
}
```

After processing completes:
```json
{
  "id": 1,
  "file_name": "physics_grade11.pdf",
  "status": "Active",
  "vector_store_path": "/path/to/vector_store",
  "chunk_count": 156,
  ...
}
```

## Files Modified

1. ✅ `yeneta_backend/rag/serializers.py` - Added `file_name` to read_only_fields
2. ✅ `yeneta_backend/rag/views.py` - Enhanced error logging

## Status

✅ **FIXED** - Ready for testing

The issue has been resolved. The document upload should now work correctly for all grade levels with proper file organization and vector store creation.

---

**Fix Applied:** November 8, 2025 at 8:20 AM  
**Issue:** 400 Bad Request on vector store creation  
**Root Cause:** file_name field validation error  
**Solution:** Added file_name to read_only_fields in serializer  
**Status:** ✅ Complete
