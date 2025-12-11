# Exam Vector Store Collection Name Fix

**Issue**: Exam vector stores were being created with incorrect ChromaDB collection names, causing "Collection does not exist" errors when querying.

**Date**: November 9, 2025, 7:20 PM UTC+03:00

---

## 🐛 **Problem**

When creating exam vector stores (Matric/Model), the document processing was creating ChromaDB collections with the wrong naming convention:

- **Expected**: `exam_matric_mathematics`
- **Actual**: `curriculum_unknown_mathematics` (because `grade` was not in metadata)

This caused the query function to fail with:
```
Error querying exam store 4: Collection [exam_matric_mathematics] does not exist
⚠️ No Matric exam documents found, falling back to curriculum
```

---

## 🔧 **Root Cause**

In `rag/services.py`, the `create_vector_store()` method was hardcoded to create collection names with the `curriculum_` prefix:

```python
# OLD CODE (Line 200)
collection_name = f"curriculum_{metadata.get('grade', 'unknown')}_{metadata.get('subject', 'unknown')}"
```

This didn't check if the document was an exam document (which has `exam_type` instead of `grade` in metadata).

---

## ✅ **Solution**

Updated `create_vector_store()` to detect document type and use the correct naming convention:

```python
# NEW CODE (Lines 200-208)
# Check if this is an exam or curriculum document
if 'exam_type' in metadata:
    # Exam document: exam_{exam_type}_{subject}
    collection_name = f"exam_{metadata.get('exam_type', 'unknown')}_{metadata.get('subject', 'unknown')}"
else:
    # Curriculum document: curriculum_{grade}_{subject}
    collection_name = f"curriculum_{metadata.get('grade', 'unknown')}_{metadata.get('subject', 'unknown')}"

collection_name = collection_name.replace(' ', '_').lower()
```

**File Modified**: `yeneta_backend/rag/services.py` (Lines 199-208)

---

## 🔄 **How to Fix Existing Exam Stores**

### **Option 1: Reprocess Using Management Command** (Recommended)

I've created a management command to reprocess existing exam stores:

```bash
cd yeneta_backend
python manage.py reprocess_exam_store <exam_store_id>
```

**Example**:
```bash
# Reprocess the Mathematics Matric exam (ID 4)
python manage.py reprocess_exam_store 4
```

This will:
1. Set status to "Processing"
2. Reprocess the document with the correct collection name
3. Update status to "Active" with chunk count
4. Display success message with details

### **Option 2: Delete and Re-upload**

1. Go to Admin Dashboard → Exam RAG Pipeline
2. Delete the existing Mathematics exam store
3. Re-upload the document
4. It will now create the correct collection name

---

## 📊 **Collection Naming Convention**

### **Curriculum Documents**
- **Format**: `curriculum_{grade}_{subject}`
- **Example**: `curriculum_grade_12_physics`
- **Metadata Required**: `grade`, `subject`

### **Exam Documents**
- **Format**: `exam_{exam_type}_{subject}`
- **Examples**: 
  - `exam_matric_mathematics`
  - `exam_model_chemistry`
- **Metadata Required**: `exam_type`, `subject`

---

## 🧪 **Testing**

After applying the fix:

1. **Reprocess existing exam store**:
   ```bash
   python manage.py reprocess_exam_store 4
   ```

2. **Verify in Admin Dashboard**:
   - Status should be "Active"
   - Chunk count should be > 0

3. **Test in Practice Labs**:
   - Select "🎓 Grade 12 Matric"
   - Choose Mathematics
   - Turn ON "National Exam Questions RAG"
   - Generate question
   - Should see: "Using 3 Matric exam documents" (not "No Matric exam documents found")

---

## 📝 **Files Changed**

1. **`yeneta_backend/rag/services.py`** (Lines 199-208)
   - Fixed collection name generation logic

2. **`yeneta_backend/rag/management/commands/reprocess_exam_store.py`** (NEW)
   - Management command for reprocessing exam stores

---

## 🎯 **Expected Behavior After Fix**

### **Before Fix**
```
Error querying exam store 4: Collection [exam_matric_mathematics] does not exist
⚠️ No Matric exam documents found, falling back to curriculum
```

### **After Fix**
```
Found 1 exam store(s) for Matric - Mathematics
✅ Retrieved 3 Matric exam documents
Using 3 Matric exam documents
```

---

## 🚀 **Next Steps**

1. **Restart Django server** to load the code changes
2. **Reprocess the Mathematics exam store**:
   ```bash
   cd yeneta_backend
   python manage.py reprocess_exam_store 4
   ```
3. **Test question generation** in Practice Labs
4. **Upload new exam documents** - they will work correctly

---

## 💡 **Prevention**

This fix ensures that:
- ✅ All future exam uploads will create correct collection names
- ✅ Curriculum uploads continue to work as before
- ✅ Query functions can find the correct collections
- ✅ No more "Collection does not exist" errors

---

**Fix Applied By**: Cascade AI Assistant  
**Date**: November 9, 2025, 7:20 PM UTC+03:00  
**Status**: ✅ **Ready to Test**
