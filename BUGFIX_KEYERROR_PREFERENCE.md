# Bug Fix: KeyError 'preference' - November 8, 2025

## Problem
Question generation was failing with a `KeyError: 'preference'` error.

### Error Message:
```
File "D:\django_project\yeneta-ai-school\yeneta_backend\ai_tools\views.py", line 1304, in get_question_style_guidance
    - {personality['preference']}
       ~~~~~~~~~~~^^^^^^^^^^^^^^
KeyError: 'preference'
```

### Impact:
- ❌ Practice Labs couldn't generate questions
- ❌ Users saw "Failed to generate question. Please try again."
- ❌ All question generation requests returned HTTP 500 errors

---

## Root Cause

**File**: `yeneta_backend/ai_tools/views.py`  
**Function**: `get_question_style_guidance()`  
**Line**: 1304

### The Bug:
```python
# Line 1304 - INCORRECT
- {personality['preference']}
```

The code was trying to access a dictionary key called `'preference'`, but the actual key in the `personality_styles` dictionary was `'question_preference'`.

### Dictionary Structure:
```python
personality_styles = {
    'patient': {
        'approach': 'Use gentle, encouraging language...',
        'question_preference': 'Prefer guided questions...'  # ← Correct key name
    },
    'energetic': {
        'approach': 'Use dynamic, engaging language...',
        'question_preference': 'Mix question types frequently...'
    },
    'analyst': {
        'approach': 'Use precise, technical language...',
        'question_preference': 'Prefer analytical questions...'
    }
}
```

---

## Solution

### Fix Applied:
```python
# Line 1304 - CORRECTED
- {personality['question_preference']}
```

Changed `personality['preference']` to `personality['question_preference']` to match the actual dictionary key.

---

## Files Modified

**File**: `yeneta_backend/ai_tools/views.py`  
**Line**: 1304  
**Change**: `'preference'` → `'question_preference'`

---

## Testing

### Before Fix:
```
POST /api/ai-tools/generate-practice-question/ HTTP/1.1" 500
KeyError: 'preference'
```

### After Fix:
```
POST /api/ai-tools/generate-practice-question/ HTTP/1.1" 200
Question generated successfully ✅
```

---

## Prevention

This was a simple typo/naming inconsistency. To prevent similar issues:

1. **Use consistent naming** across dictionary definitions and access
2. **Test all code paths** including different coach personalities
3. **Add error handling** for dictionary key access
4. **Use `.get()` method** with defaults for safer dictionary access

### Safer Alternative:
```python
# Instead of:
personality['question_preference']

# Consider:
personality.get('question_preference', 'Default preference text')
```

---

## Status

✅ **FIXED** - Django server auto-reloaded with the correction  
✅ **TESTED** - Question generation now works  
✅ **DEPLOYED** - Ready for use

---

**Fixed By**: Cascade AI Assistant  
**Date**: November 8, 2025  
**Time**: 05:42 AM UTC+03:00
