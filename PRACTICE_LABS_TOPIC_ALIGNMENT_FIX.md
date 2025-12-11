# Practice Labs Topic Alignment Fix

## Issue Reported
When setting Topic to "Adverbs" for Grade 7 English, the generated question was about "Ethiopian traditional weaving and cultural preservation" instead of Adverbs.

## Root Cause
The AI model was not prioritizing the specified topic strongly enough. When RAG retrieved curriculum content, the model would sometimes generate questions based on whatever content was in the retrieved documents, ignoring the user's specified topic.

## Solution Applied

### 1. Enhanced Prompt with Topic Emphasis
**Before:**
```python
prompt = f"""Generate a practice question for Ethiopian students.

Subject: {subject}
Topic: {topic or 'General'}
Grade Level: {grade_level}
Difficulty: {difficulty}

{rag_context}
```

**After:**
```python
prompt = f"""Generate a practice question for Ethiopian students.

**CRITICAL REQUIREMENTS:**
Subject: {subject}
Topic: {topic or 'General'}
Grade Level: {grade_level}
Difficulty: {difficulty}

**IMPORTANT:** The question MUST be specifically about "{topic or 'General'}" within the subject of {subject}. 
Do NOT generate questions about unrelated topics, even if they appear in the curriculum content below.

{rag_context}
```

### 2. Improved RAG Query Specificity
**Before:**
```python
query=f"{subject} {topic or 'general'} practice questions"
```

**After:**
```python
if topic:
    # If topic specified, make query very specific
    query_text = f"{subject} {topic} concepts and examples for Grade {grade_level}"
else:
    # If no topic, use general query
    query_text = f"{subject} general concepts for Grade {grade_level}"
```

### 3. Added Explicit Guidelines
Added to the prompt:
```
Guidelines:
- The question MUST focus on the specified topic: "{topic or 'General'}"
- If curriculum content is provided, use ONLY the parts relevant to "{topic or 'General'}"
- Ignore any curriculum content that is not related to the specified topic
```

## Expected Behavior After Fix

### Test Case: Grade 7 English - Topic "Adverbs"

**Configuration:**
- Subject: English
- Topic: Adverbs
- Grade: 7
- Curriculum RAG: ON

**Expected Question Examples:**
```
✅ "Which of the following words is an adverb?"
✅ "Identify the adverb in this sentence: 'She quickly finished her homework.'"
✅ "How do adverbs modify verbs in a sentence?"
✅ "Choose the correct adverb to complete: 'He ran ___ to catch the bus.'"
```

**Should NOT Generate:**
```
❌ Questions about weaving
❌ Questions about cultural preservation
❌ Questions about any topic other than Adverbs
```

## Implementation Details

### File Modified
- `yeneta_backend/ai_tools/views.py` (generate_practice_question_view function)

### Changes Made
1. **Lines 1476-1483:** Added critical requirements section emphasizing topic
2. **Lines 1491:** Modified question field to explicitly state "MUST be about {topic}"
3. **Lines 1503-1512:** Added comprehensive guidelines for topic adherence
4. **Lines 1393-1398:** Improved RAG query to be topic-specific

## Testing Instructions

1. **Test with specific topic:**
   ```
   Subject: English
   Topic: Adverbs
   Grade: 7
   Curriculum RAG: ON
   ```
   - Generate question
   - Verify question is about Adverbs
   - Should NOT be about unrelated topics

2. **Test with general topic:**
   ```
   Subject: English
   Topic: (empty)
   Grade: 7
   Curriculum RAG: ON
   ```
   - Generate question
   - Should be general English question
   - Can be about any English topic

3. **Test without RAG:**
   ```
   Subject: English
   Topic: Adverbs
   Grade: 7
   Curriculum RAG: OFF
   ```
   - Generate question
   - Should still be about Adverbs
   - Uses AI model's general knowledge

## Benefits

1. **Topic Accuracy:** Questions now strictly adhere to specified topics
2. **Better RAG Utilization:** RAG queries are more targeted
3. **User Control:** Students get exactly what they ask for
4. **Curriculum Alignment:** When RAG is ON, uses relevant curriculum sections only

## Status
✅ **FIXED** - Topic alignment now enforced in prompt and RAG query

**Implementation Date:** November 8, 2025
