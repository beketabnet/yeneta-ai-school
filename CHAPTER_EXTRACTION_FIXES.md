# Chapter Extraction Fixes - Nov 11, 2025

## Issues Identified

From test with English Grade 7, Chapter 3:

### 1. **Wrong Topic** ❌
- **Expected**: "ROAD SAFETY"
- **Got**: "Debate"
- **Cause**: Pre-extraction pattern not matching "UNIT THREE ROAD SAFETY" format

### 2. **Objectives Formatting Issues** ⚠️
- **Problem**: Extra `ø` characters in objectives
- **Example**: `Students will be able to ø find out specific information...`
- **Cause**: Bullet character not being cleaned from extracted text

### 3. **Missing MoE Code** ❌
- **Problem**: MoE Code field empty
- **Cause**: Not present in textbook or not extracted by LLM

### 4. **LLM Fallback Issue** ⚠️
- **Problem**: Gemini quota exceeded, fell back to Ollama
- **Result**: Lower quality extraction from local model

---

## Fixes Applied

### Fix 1: Enhanced Chapter Title Patterns

**File**: `chapter_title_extractor.py`

**Before**:
```python
r'(?:UNIT|CHAPTER)\s+(?:THREE)\s*[:\-]?\s*([A-Z][A-Z\s]+?)(?:\n|UNIT OBJECTIVES)'
```

**After**:
```python
# Primary pattern - matches "UNIT THREE ROAD SAFETY"
r'(?:UNIT|CHAPTER|LESSON|MODULE)\s+(?:[IVXLCDM]+|[0-9]+|ONE|TWO|THREE...)\s+([A-Z][A-Z\s]+?)(?:\s*\n|UNIT OBJECTIVES)'

# With colon - matches "CHAPTER THREE: ROAD SAFETY"
r'(?:UNIT|CHAPTER)\s+(?:THREE)\s*[:\-]\s*([A-Z][A-Z\s]+?)(?:\s*\n|UNIT OBJECTIVES)'

# Fallback patterns with both numeric and word forms
f'UNIT {chapter_number}\\s+([A-Z][A-Z\\s]+?)(?:\\s*\\n|UNIT OBJECTIVES)'
f'UNIT {number_words[chapter_number]}\\s+([A-Z][A-Z\\s]+?)(?:\\s*\\n|UNIT OBJECTIVES)'
```

**Key Changes**:
- Added `\s+` (space required) between unit number and title
- Changed `(?:\n|UNIT OBJECTIVES)` to `(?:\s*\n|UNIT OBJECTIVES)` for flexible whitespace
- Added word-form fallback patterns (THREE, FOUR, etc.)
- Added number-to-word mapping for chapters 1-15

### Fix 2: Clean Bullet Characters from Objectives

**File**: `chapter_title_extractor.py`

**Before**:
```python
OBJECTIVE_PATTERNS = [
    r'[•\-\*]\s*(.+?)(?:\n|$)',  # Only handled •, -, *
]

objective = match.group(1).strip()
objective = re.sub(r'\s+', ' ', objective)  # Only normalized whitespace
```

**After**:
```python
OBJECTIVE_PATTERNS = [
    r'[øØ•\-\*]\s*(.+?)(?:\n|$)',  # Added ø and Ø characters
]

objective = match.group(1).strip()
objective = re.sub(r'^[øØ•\-\*\s]+', '', objective)  # Remove leading bullets
objective = re.sub(r'\s+', ' ', objective)  # Normalize whitespace
objective = objective.strip()
```

**Key Changes**:
- Added `ø` and `Ø` to bullet pattern recognition
- Added explicit cleaning step to remove bullet characters from start of text
- Ensures objectives are clean before formatting

### Fix 3: Fallback for Missing Title

**File**: `views.py`

**Added**:
```python
if pre_extracted.get('chapter_title'):
    extracted_content['chapter_title'] = pre_extracted['chapter_title']
elif not extracted_content.get('chapter_title'):
    # Fallback if both pre-extraction and LLM failed
    logger.warning(f"⚠️ No chapter title extracted - using fallback")
    extracted_content['chapter_title'] = f"Chapter {chapter}"
```

**Ensures**: Topic field is never empty, even if extraction fails

---

## Expected Results After Fixes

### Test: English Grade 7, Chapter 3

**Topic Field**:
```
ROAD SAFETY
```
✅ Exact title from textbook

**Learning Objectives Field**:
```
Students will be able to find out specific information from the listening text in each paragraph
Students will be able to talk about their responsibility in reducing car accidents
Students will be able to pronounce words with silent consonants in english
Students will be able to identify specific information about the road safety situation in ethiopia
Students will be able to work out the contextual meanings of the words given in bold in the passage
Students will be able to use the newly learnt words in spoken or written sentences
Students will be able to use gerunds and infinitives in sentences correctly
Students will be able to identify the words which are always followed by gerunds and infinities
Students will be able to order sentences in a paragraph logically
Students will be able to use capital letters correctly in different written texts
```
✅ All 10 objectives, clean formatting (no ø characters)

**MoE Code Field**:
```
[Will be extracted if present in textbook, otherwise null]
```

---

## Pattern Matching Examples

### Title Extraction Patterns

**Pattern 1**: `UNIT THREE ROAD SAFETY`
```regex
UNIT\s+THREE\s+([A-Z][A-Z\s]+?)(?:\s*\n|UNIT OBJECTIVES)
Matches: "ROAD SAFETY"
```

**Pattern 2**: `CHAPTER 3: ROAD SAFETY`
```regex
CHAPTER\s+3\s*:\s*([A-Z][A-Z\s]+?)(?:\s*\n|CHAPTER OBJECTIVES)
Matches: "ROAD SAFETY"
```

**Pattern 3**: `Unit 3: Road Safety` (title case)
```regex
Unit\s+3\s*:\s*([A-Z][A-Za-z\s]+?)(?:\s*\n|Unit Objectives)
Matches: "Road Safety"
```

### Objectives Extraction Patterns

**Pattern 1**: `ø find out specific information`
```regex
[øØ•\-\*]\s*(.+?)(?:\n|$)
Matches: "find out specific information"
Then cleaned: removes leading ø
```

**Pattern 2**: `• talk about their responsibility`
```regex
[øØ•\-\*]\s*(.+?)(?:\n|$)
Matches: "talk about their responsibility"
Then cleaned: removes leading •
```

---

## Logging Enhancements

### Pre-Extraction Logs

**Success**:
```
🔍 Pre-extracting chapter info from RAG context (15000 chars)
✅ Extracted chapter title: 'ROAD SAFETY'
✅ Found objectives section: 450 chars
✅ Extracted 10 objectives
📋 Pre-extracted: title='ROAD SAFETY', objectives=10
```

**Failure**:
```
🔍 Pre-extracting chapter info from RAG context (15000 chars)
⚠️ Could not extract chapter title
⚠️ Could not find explicit objectives section - will rely on AI generation
📋 Pre-extracted: title='N/A', objectives=0
```

### Merging Logs

**With Pre-Extracted Title**:
```
🔄 Using pre-extracted chapter title: 'ROAD SAFETY'
✅ Using 10 pre-extracted objectives from textbook
```

**Without Pre-Extracted Title**:
```
⚠️ No chapter title extracted - using fallback
Chapter title set to: 'Chapter 3'
```

---

## Testing Checklist

### Test Case 1: English Grade 7, Chapter 3
- [ ] Topic = "ROAD SAFETY" (not "Debate")
- [ ] 10 objectives extracted
- [ ] No `ø` characters in objectives
- [ ] Objectives start with "Students will be able to"
- [ ] MoE Code extracted (if present)

### Test Case 2: Different Chapter Formats
- [ ] "UNIT THREE ROAD SAFETY" → "ROAD SAFETY"
- [ ] "CHAPTER 3: ROAD SAFETY" → "ROAD SAFETY"
- [ ] "Unit 3: Road Safety" → "Road Safety"
- [ ] "CHAPTER THREE PHOTOSYNTHESIS" → "PHOTOSYNTHESIS"

### Test Case 3: Different Bullet Formats
- [ ] `ø objective text` → clean
- [ ] `• objective text` → clean
- [ ] `- objective text` → clean
- [ ] `* objective text` → clean

---

## Root Cause Analysis

### Why "Debate" Appeared

**Hypothesis**:
1. Gemini quota exceeded → fell back to Ollama
2. Ollama (local LLM) has lower quality than Gemini
3. Pre-extraction pattern didn't match "UNIT THREE ROAD SAFETY"
4. Ollama generated "Debate" from context (possibly saw debate-related content)
5. No pre-extracted title to override LLM output

**Solution**:
- Enhanced patterns to match Ethiopian textbook format
- Added fallback patterns for word forms (THREE, FOUR, etc.)
- Added ultimate fallback to "Chapter {number}" if all else fails

### Why `ø` Characters Appeared

**Hypothesis**:
1. Textbook uses `ø` as bullet character
2. Pattern matched the objective but didn't clean the bullet
3. Objective text included the `ø` character

**Solution**:
- Added `ø` and `Ø` to bullet pattern recognition
- Added explicit cleaning step: `re.sub(r'^[øØ•\-\*\s]+', '', objective)`
- Ensures all bullet characters are removed before formatting

---

## Files Modified

1. **`chapter_title_extractor.py`**
   - Enhanced `CHAPTER_HEADER_PATTERNS` (lines 16-25)
   - Added `ø` to `OBJECTIVE_PATTERNS` (line 34)
   - Enhanced objective cleaning (lines 125-127)
   - Added word-form fallback patterns (lines 72-95)

2. **`views.py`**
   - Added fallback for missing title (lines 4586-4589)

---

## Next Steps

1. **Restart Django backend**:
   ```bash
   python manage.py runserver
   ```

2. **Test extraction**:
   - Grade: Grade 7
   - Subject: English
   - Chapter: 3 or "Three" or "Unit Three"

3. **Verify results**:
   - Topic should be "ROAD SAFETY"
   - 10 clean objectives (no ø characters)
   - Proper formatting

4. **Check logs**:
   - Look for "✅ Extracted chapter title: 'ROAD SAFETY'"
   - Look for "✅ Extracted 10 objectives"
   - Look for "🔄 Using pre-extracted chapter title"

---

## Success Criteria

✅ **Title Accuracy**: Extracts "ROAD SAFETY" not "Debate"
✅ **Objective Cleanliness**: No `ø` or other bullet characters
✅ **Objective Completeness**: All 10 objectives extracted
✅ **Formatting**: "Students will be able to [objective]"
✅ **Robustness**: Works with different chapter formats
✅ **Fallback**: Never leaves fields empty

---

## Summary

Enhanced the chapter extraction system to:
1. **Better match Ethiopian textbook formats** (UNIT THREE ROAD SAFETY)
2. **Clean bullet characters** (ø, •, -, *) from objectives
3. **Provide fallbacks** when extraction fails
4. **Support multiple formats** (numeric, word, title case)

The system should now correctly extract "ROAD SAFETY" as the topic and provide clean, properly formatted objectives for English Grade 7, Chapter 3.
