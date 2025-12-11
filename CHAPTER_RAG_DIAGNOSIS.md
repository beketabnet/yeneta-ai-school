# Chapter-Based RAG Not Working - Diagnosis & Fix

**Date**: November 9, 2025, 6:55 AM UTC+03:00  
**Status**: ⚠️ **ISSUE IDENTIFIED - FIX NEEDED**

---

## 🐛 **Problem Report**

### **User Request**
- Grade: 7
- Subject: English
- Input: "Chapter 3"
- Expected: Questions about **Road Safety** (actual Unit 3 content)

### **Actual Curriculum Content (Unit 3)**
```
UNIT THREE: ROAD SAFETY
- Car accidents and road safety in Ethiopia
- Responsibilities in reducing accidents
- Grammar: Gerunds and infinitives
- Pronunciation: Silent consonants
- Writing: Capital letters, paragraph ordering
```

### **What Was Generated**
```
Question: "Imagine Chapter 3 of your English textbook tells a story 
about a family in Addis Ababa. If the story is written in the past 
tense, which of the following sentences would MOST likely appear?"

Options:
- The family visits Entoto Hill every Sunday
- The family is planning a trip to Bahir Dar
- The family enjoyed a delicious injera meal together last night
- The family usually watches television after dinner
```

### **The Mismatch**
❌ **Topic**: Road Safety → Family Story  
❌ **Grammar**: Gerunds/Infinitives → Past Tense  
❌ **Content**: 0% overlap with actual curriculum

---

## 🔍 **Root Cause Analysis**

### **Possible Issues**

#### **1. Vector Store Search Not Finding Correct Content**
**Symptoms**:
- RAG query is built correctly
- But vector store returns wrong documents or no documents
- AI model hallucinates when no relevant content provided

**Likely Causes**:
- Curriculum documents not properly chunked by chapter/unit
- Metadata not including chapter/unit numbers
- Semantic search not matching "Chapter 3" with "Unit Three"
- Document embeddings don't capture chapter structure

#### **2. Document Metadata Missing Chapter Info**
**Problem**: When curriculum PDFs are processed, the chapter/unit information may not be extracted as metadata

**Example**:
```python
# Current metadata (likely):
{
    'grade': 'Grade 7',
    'subject': 'English',
    'source': '88e5480a-912a-478d-89da-24587902f836.pdf'
    # ❌ Missing: 'chapter': '3', 'unit': 'Three'
}

# Needed metadata:
{
    'grade': 'Grade 7',
    'subject': 'English',
    'source': '88e5480a-912a-478d-89da-24587902f836.pdf',
    'chapter': '3',  # ✅ Added
    'unit': 'Three',  # ✅ Added
    'unit_title': 'Road Safety'  # ✅ Added
}
```

#### **3. Semantic Search Limitations**
**Problem**: Vector similarity search may not understand that:
- "Chapter 3" = "Unit Three" = "Unit 3"
- These are structural identifiers, not semantic concepts

**Current Query**:
```
"Find content from Grade 7 English curriculum.
Looking for content from: Chapter 3, Unit 3, Lesson 3, Chapter Three..."
```

**Issue**: This is a text query, but the documents may not contain these exact phrases in the embedded chunks.

---

## 🔧 **Recommended Fixes**

### **Fix 1: Add Metadata Filtering (Immediate)**
**Priority**: HIGH  
**Effort**: Low  
**Impact**: High

**Change**: Modify `query_curriculum_documents` to use metadata filters

```python
# Current (semantic search only):
documents = query_curriculum_documents(
    grade='Grade 7',
    subject='English',
    query='Chapter 3, Unit 3, Lesson 3...',
    top_k=3
)

# Improved (metadata + semantic):
documents = query_curriculum_documents(
    grade='Grade 7',
    subject='English',
    query='Road safety, car accidents, gerunds, infinitives',  # Semantic content
    metadata_filters={
        'chapter': '3',  # Exact match
        'unit': '3'      # Exact match
    },
    top_k=3
)
```

**Benefit**: Guarantees we get Chapter 3 content, then semantic search ranks within that chapter.

---

### **Fix 2: Extract Chapter Metadata During Document Processing**
**Priority**: HIGH  
**Effort**: Medium  
**Impact**: High

**Location**: `yeneta_backend/rag/services.py` - document processing

**Add Chapter Extraction**:
```python
def extract_chapter_metadata(text_chunk, page_num):
    """
    Extract chapter/unit information from text chunk.
    """
    import re
    
    # Look for chapter/unit headers
    patterns = [
        r'UNIT\s+([IVXLCDM]+|[0-9]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)',
        r'CHAPTER\s+([IVXLCDM]+|[0-9]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)',
        r'LESSON\s+([IVXLCDM]+|[0-9]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text_chunk, re.IGNORECASE)
        if match:
            chapter_raw = match.group(1)
            # Normalize to number
            chapter_num = normalize_chapter_number(chapter_raw)
            return {
                'chapter': str(chapter_num),
                'chapter_raw': chapter_raw
            }
    
    return None

# When processing documents:
for chunk in chunks:
    chapter_info = extract_chapter_metadata(chunk['text'], chunk['page'])
    if chapter_info:
        chunk['metadata']['chapter'] = chapter_info['chapter']
        chunk['metadata']['chapter_raw'] = chapter_info['chapter_raw']
```

---

### **Fix 3: Hybrid Search Strategy**
**Priority**: MEDIUM  
**Effort**: Medium  
**Impact**: Very High

**Approach**: Combine metadata filtering + semantic search

**Implementation**:
```python
def query_curriculum_with_chapter(grade, subject, chapter_num, top_k=3):
    """
    Two-stage search:
    1. Filter by metadata (grade, subject, chapter)
    2. Semantic search within filtered results
    """
    
    # Stage 1: Metadata filter
    metadata_filter = {
        'grade': grade,
        'subject': subject,
        'chapter': str(chapter_num)
    }
    
    # Stage 2: Semantic search
    # Use broad query to get all content from that chapter
    query = f"{subject} concepts, topics, and learning objectives"
    
    results = vector_store.search(
        query=query,
        filter_metadata=metadata_filter,
        n_results=top_k
    )
    
    return results
```

---

### **Fix 4: Fallback to Chapter Title Search**
**Priority**: LOW  
**Effort**: Low  
**Impact**: Medium

**Approach**: If chapter number search fails, try searching by chapter title

```python
# If user enters "Chapter 3" and no results:
# 1. Try to extract chapter title from curriculum index
# 2. Search by title: "Road Safety"
# 3. This is more likely to match content

chapter_titles = {
    'Grade 7': {
        'English': {
            '1': 'Introduction',
            '2': 'Communication Skills',
            '3': 'Road Safety',  # ← Use this
            '4': 'Environment',
            # ...
        }
    }
}

if not results and chapter_num in chapter_titles[grade][subject]:
    title = chapter_titles[grade][subject][chapter_num]
    query = f"{subject} {title} concepts and topics"
    results = vector_store.search(query=query, ...)
```

---

## 🧪 **Diagnostic Steps**

### **Step 1: Check Vector Store Metadata**
```python
# In Django shell:
from rag.models import VectorStore

# Check what metadata exists for Grade 7 English
docs = VectorStore.objects.filter(
    grade='Grade 7',
    subject='English'
)

for doc in docs:
    print(f"Source: {doc.file_name}")
    print(f"Metadata: {doc.metadata}")
    print(f"Has chapter info: {'chapter' in doc.metadata}")
    print("---")
```

### **Step 2: Test RAG Query**
```python
# Test what documents are retrieved
from rag.services import query_curriculum_documents

results = query_curriculum_documents(
    grade='Grade 7',
    subject='English',
    query='Chapter 3, Unit 3, Unit Three, Road Safety',
    top_k=5
)

for i, doc in enumerate(results):
    print(f"\n=== Document {i+1} ===")
    print(f"Source: {doc.get('source')}")
    print(f"Content preview: {doc.get('content', '')[:200]}")
    print(f"Relevance: {doc.get('relevance', 'N/A')}")
```

### **Step 3: Check Backend Logs**
Look for these log messages in terminal:
```
📚 Practice Labs: Querying curriculum documents - Grade 7, Subject: English, Topic: General, Chapter: Chapter 3
📖 Using chapter-based query for: Chapter 3
✅ Retrieved X curriculum documents for practice questions
```

If X = 0, the search is failing.

---

## 📊 **Expected vs Actual**

### **Expected Behavior**
1. User enters "Chapter 3"
2. System normalizes to: Chapter 3, Unit 3, Unit Three, etc.
3. Vector store searches with metadata filter: `chapter='3'`
4. Returns: Unit 3 Road Safety content
5. AI generates: Road safety questions with gerunds/infinitives

### **Actual Behavior**
1. User enters "Chapter 3" ✅
2. System normalizes correctly ✅
3. Vector store search returns: ❌ Wrong documents or no documents
4. AI model receives: ❌ No relevant content or wrong content
5. AI generates: ❌ Hallucinated question about family story

---

## 🎯 **Immediate Action Plan**

### **Phase 1: Diagnosis (Now)**
1. Check vector store metadata structure
2. Test RAG query with logging
3. Verify what documents are being retrieved
4. Confirm if chapter metadata exists

### **Phase 2: Quick Fix (If metadata missing)**
1. Add chapter extraction to document processing
2. Reprocess Grade 7 English curriculum
3. Verify metadata is now present
4. Test chapter-based queries

### **Phase 3: Robust Solution**
1. Implement hybrid search (metadata + semantic)
2. Add chapter title fallback
3. Improve query construction
4. Add validation and error handling

---

## 🔍 **Key Questions to Answer**

1. **Does the vector store have chapter metadata?**
   - Check: `VectorStore.objects.filter(grade='Grade 7', subject='English').first().metadata`
   - Expected: Should include `'chapter': '3'` or similar

2. **Are documents being retrieved?**
   - Check backend logs for: "✅ Retrieved X curriculum documents"
   - If X = 0, search is failing

3. **What content is being retrieved?**
   - Log the actual document content being passed to AI
   - Does it mention Road Safety or family stories?

4. **Is the AI model ignoring the RAG context?**
   - If correct content is retrieved but wrong question generated
   - Issue is in prompt engineering, not RAG

---

## 📝 **Next Steps**

1. **Run diagnostic queries** to understand current state
2. **Check vector store metadata** structure
3. **Implement metadata filtering** if not already present
4. **Add chapter extraction** to document processing
5. **Test with multiple chapters** to verify fix works broadly

---

**Status**: Awaiting diagnostic results to determine exact fix needed.

**Prepared By**: Cascade AI Assistant  
**Date**: November 9, 2025, 6:55 AM UTC+03:00
