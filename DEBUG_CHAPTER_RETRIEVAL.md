# Debug Chapter Retrieval Issue

**Date**: November 9, 2025, 7:45 AM UTC+03:00  
**Status**: 🔍 **DEBUGGING IN PROGRESS**

---

## 🎯 **Problem Identified**

The system is **always retrieving Unit Six content** regardless of which chapter is requested:

- **Input**: "Chapter Three" → **Output**: Unit Six questions ❌
- **Input**: "Chapter Five" → **Output**: Unit Six questions ❌
- **Input**: "Chapter Six" → **Output**: Unit Six questions ✅ (correct by accident)

---

## 🔍 **Root Cause Hypothesis**

The **RAG retrieval is not respecting the chapter parameter**. Possible causes:

1. **Semantic search dominance**: Unit Six has strong keywords like "conservation", "land", "opinion" that match many queries
2. **Chapter metadata missing**: Documents don't have chapter metadata, so filtering fails and falls back to semantic search
3. **Query variants too broad**: The query includes so many variants that it matches everything
4. **ChromaDB ranking**: Unit Six content ranks highest in semantic similarity regardless of chapter number

---

## 🔧 **Debugging Logs Added**

### **In `ai_tools/views.py` (Lines 1934-1945)**

```python
logger.info(f"📖 Chapter mode: {chapter}")
logger.info(f"📝 Query text preview: {query_text[:200]}...")
logger.info(f"🔍 Querying with chapter parameter: {chapter if use_chapter_mode and chapter else 'None'}")
```

### **In `rag/services.py` (Lines 545-580)**

```python
logger.info(f"🔢 Normalized chapter '{chapter}' to number: {chapter_num}")
logger.info(f"🔍 Applying metadata filter: {where_filter}")
logger.info(f"🔎 Query text (first 150 chars): {query[:150]}...")
logger.info(f"🎯 Attempting query WITH metadata filter...")
logger.info(f"✅ Filtered query returned {len(results['documents'][0])} results")
logger.info(f"⚠️ No results with chapter filter, falling back to semantic search only")
logger.info(f"✅ Semantic query returned {len(results['documents'][0])} results")
```

---

## 🧪 **Testing Instructions**

### **Step 1: Restart Django Server**
```bash
cd yeneta_backend
python manage.py runserver
```

### **Step 2: Test Different Chapters**

**Test A: Chapter Three**
1. Go to Practice Labs
2. Select: Grade 7, English
3. Enter: "Chapter Three"
4. Generate question

**Test B: Chapter Five**
1. Same setup
2. Enter: "Chapter Five"
3. Generate question

**Test C: Chapter Six**
1. Same setup
2. Enter: "Chapter Six"
3. Generate question

### **Step 3: Check Terminal Logs**

Look for these key indicators:

```
📖 Chapter mode: Chapter Three
📝 Query text preview: Find content from Grade 7 English curriculum...
🔍 Querying with chapter parameter: Chapter Three
🔢 Normalized chapter 'Chapter Three' to number: 3
🔍 Applying metadata filter: {'chapter': {'$eq': '3'}}
🎯 Attempting query WITH metadata filter...
```

**Then check the result**:

**Scenario A: Metadata filter works**
```
✅ Filtered query returned 3 results
📄 Document 1 preview: UNIT THREE ROAD SAFETY...
```
**Expected**: Questions about Road Safety ✅

**Scenario B: Metadata filter fails, fallback works**
```
⚠️ No results with chapter filter, falling back to semantic search only
✅ Fallback query returned 3 results
📄 Document 1 preview: UNIT SIX LAND CONSERVATION...
```
**Problem**: Semantic search always returns Unit Six ❌

**Scenario C: No chapter parameter passed**
```
📝 No chapter parameter provided, using semantic search only
🎯 Querying WITHOUT metadata filter (semantic search only)...
📄 Document 1 preview: UNIT SIX LAND CONSERVATION...
```
**Problem**: Chapter parameter not being passed ❌

---

## 🔎 **What to Look For**

### **1. Is chapter parameter being passed?**
```
🔍 Querying with chapter parameter: Chapter Three  ← Should show chapter
```
If it shows `None`, the problem is in the frontend or API call.

### **2. Is normalization working?**
```
🔢 Normalized chapter 'Chapter Three' to number: 3  ← Should show 3
```
If it shows wrong number or fails, the problem is in `_normalize_chapter_for_filter()`.

### **3. Is metadata filter being applied?**
```
🎯 Attempting query WITH metadata filter...  ← Should attempt
```
If it goes straight to "WITHOUT metadata filter", the problem is chapter parameter not reaching RAG service.

### **4. Does metadata filter return results?**
```
✅ Filtered query returned 3 results  ← Good!
⚠️ No results with chapter filter...  ← Documents lack metadata
```
If no results, documents don't have chapter metadata.

### **5. What content is actually retrieved?**
```
📄 Document 1 preview: UNIT THREE ROAD SAFETY...  ← Should match chapter
📄 Document 1 preview: UNIT SIX LAND CONSERVATION...  ← Wrong!
```
If always Unit Six, semantic search is broken.

---

## 🎯 **Possible Fixes Based on Logs**

### **Fix 1: Chapter metadata missing**
**Symptom**: Metadata filter returns no results, always falls back

**Solution**: Run reprocessing command
```bash
cd yeneta_backend
python manage.py reprocess_with_chapters --grade "Grade 7" --subject "English"
```

### **Fix 2: Semantic search bias toward Unit Six**
**Symptom**: Fallback always returns Unit Six content

**Solution**: Improve query specificity
- Add more chapter-specific keywords
- Increase weight of chapter number in query
- Use negative keywords to exclude other chapters

### **Fix 3: Chapter parameter not passed**
**Symptom**: Logs show "No chapter parameter provided"

**Solution**: Check frontend/API
- Verify `chapter` is in request body
- Verify `useChapterMode` is true
- Check API service call

### **Fix 4: Normalization fails**
**Symptom**: Error in normalization or wrong number

**Solution**: Fix `_normalize_chapter_for_filter()`
- Add more word-to-number mappings
- Handle edge cases
- Add fallback logic

---

## 📊 **Expected vs Actual**

### **Chapter Three**
```
Expected Query: "Chapter 3, Unit 3, Unit Three, Chapter Three..."
Expected Filter: {'chapter': {'$eq': '3'}}
Expected Content: UNIT THREE ROAD SAFETY
Actual Content: UNIT SIX LAND CONSERVATION ❌
```

### **Chapter Five**
```
Expected Query: "Chapter 5, Unit 5, Unit Five, Chapter Five..."
Expected Filter: {'chapter': {'$eq': '5'}}
Expected Content: UNIT FIVE [topic]
Actual Content: UNIT SIX LAND CONSERVATION ❌
```

### **Chapter Six**
```
Expected Query: "Chapter 6, Unit 6, Unit Six, Chapter Six..."
Expected Filter: {'chapter': {'$eq': '6'}}
Expected Content: UNIT SIX LAND CONSERVATION
Actual Content: UNIT SIX LAND CONSERVATION ✅
```

---

## 🚀 **Next Steps**

1. **Restart server** with new logging
2. **Test all three chapters** (Three, Five, Six)
3. **Analyze terminal logs** to identify exact failure point
4. **Apply appropriate fix** based on log analysis
5. **Retest** to verify fix

---

## 📝 **Log Analysis Template**

Copy this template and fill in with actual log output:

```
=== TEST: Chapter Three ===
Chapter mode: _______
Query text preview: _______
Chapter parameter: _______
Normalized to: _______
Metadata filter: _______
Filter result: _______
Document 1 preview: _______
Question topic: _______

=== TEST: Chapter Five ===
Chapter mode: _______
Query text preview: _______
Chapter parameter: _______
Normalized to: _______
Metadata filter: _______
Filter result: _______
Document 1 preview: _______
Question topic: _______

=== TEST: Chapter Six ===
Chapter mode: _______
Query text preview: _______
Chapter parameter: _______
Normalized to: _______
Metadata filter: _______
Filter result: _______
Document 1 preview: _______
Question topic: _______
```

---

**Prepared By**: Cascade AI Assistant  
**Date**: November 9, 2025, 7:45 AM UTC+03:00
