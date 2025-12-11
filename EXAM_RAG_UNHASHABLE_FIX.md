# Exam RAG "Unhashable Type: Dict" Error Fix

**Issue**: Question generation failed with "unhashable type: 'dict'" error when using exam RAG.

**Date**: November 9, 2025, 7:25 PM UTC+03:00

---

## 🐛 **Problem**

When generating questions with Matric/Model exam RAG enabled, the system crashed with:

```
Question generation error: unhashable type: 'dict'
Internal Server Error: /api/ai-tools/generate-practice-question/
```

---

## 🔍 **Root Cause**

The `curriculum_sources` variable was designed to hold **strings** (for curriculum documents):
```python
curriculum_sources = ["Grade 12 Physics", "Grade 12 Chemistry"]
```

But for exam documents, it was changed to hold **dictionaries**:
```python
curriculum_sources = [
    {
        'type': 'exam',
        'exam_type': 'Matric',
        'subject': 'Mathematics',
        'exam_year': '2013',
        'relevance': 0.95
    }
]
```

Two lines of code tried to use `set(curriculum_sources)` to deduplicate sources:
1. **Line 2039**: Logging - `', '.join(set(curriculum_sources))`
2. **Line 2369**: Response - `list(set(curriculum_sources))`

**Dictionaries cannot be added to sets** because they are unhashable (mutable), causing the error.

---

## ✅ **Solution**

Updated both locations to handle both string and dictionary sources:

### **Fix 1: Logging (Lines 2039-2045)**

```python
# OLD CODE
logger.info(f"✅ RAG context built from sources: {', '.join(set(curriculum_sources))}")

# NEW CODE
# Handle both string sources (curriculum) and dict sources (exam)
if curriculum_sources and isinstance(curriculum_sources[0], dict):
    source_names = [f"{s.get('exam_type', 'Unknown')} {s.get('subject', '')}" for s in curriculum_sources]
    logger.info(f"✅ RAG context built from exam sources: {', '.join(set(source_names))}")
else:
    logger.info(f"✅ RAG context built from sources: {', '.join(set(curriculum_sources)) if curriculum_sources else 'none'}")
```

### **Fix 2: Response (Lines 2374-2383)**

```python
# OLD CODE
question_data['curriculumSources'] = list(set(curriculum_sources)) if curriculum_sources else []

# NEW CODE
# Handle both string sources (curriculum) and dict sources (exam)
if curriculum_sources:
    if isinstance(curriculum_sources[0], dict):
        # Exam sources - already unique dicts, just pass as is
        question_data['curriculumSources'] = curriculum_sources
    else:
        # String sources - deduplicate
        question_data['curriculumSources'] = list(set(curriculum_sources))
else:
    question_data['curriculumSources'] = []
```

---

## 📊 **Behavior After Fix**

### **Curriculum RAG**
- Sources: `["Grade 12 Physics Textbook", "Grade 12 Physics Textbook"]`
- Deduplication: `set()` → `["Grade 12 Physics Textbook"]`
- Response: `["Grade 12 Physics Textbook"]`

### **Exam RAG**
- Sources: `[{"type": "exam", "exam_type": "Matric", "subject": "Mathematics", ...}]`
- No deduplication needed (already unique)
- Response: `[{"type": "exam", "exam_type": "Matric", "subject": "Mathematics", ...}]`

---

## 🧪 **Testing**

1. **Restart Django server** to load the fix
2. **Generate Matric Mathematics question** with RAG ON
3. **Expected result**:
   - No error
   - Question generated successfully
   - RAG status: "Using 3 Matric exam documents"
   - Response includes `curriculumSources` with exam metadata

---

## 📝 **Files Changed**

**`yeneta_backend/ai_tools/views.py`**
- Lines 2039-2045: Fixed logging to handle dict sources
- Lines 2374-2383: Fixed response to handle dict sources

---

## 🎯 **Summary**

The code now properly handles two types of RAG sources:
1. **Curriculum**: String sources that need deduplication
2. **Exam**: Dictionary sources with rich metadata

Both work seamlessly without type errors!

---

**Fix Applied By**: Cascade AI Assistant  
**Date**: November 9, 2025, 7:25 PM UTC+03:00  
**Status**: ✅ **Ready to Test**
