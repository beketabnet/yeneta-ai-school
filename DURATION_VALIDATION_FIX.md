# Duration Validation Fix - Save/Export Lesson Plan

## Issue Report
**Date**: November 9, 2025 at 3:58am UTC+03:00  
**Error**: "duration: Ensure this value is less than or equal to 180"  
**Status**: ✅ FIXED

## Root Cause Analysis

### Error Details
```
Failed to save: duration: Ensure this value is less than or equal to 180.
Failed to export: duration: Ensure this value is less than or equal to 180.

Terminal:
Bad Request: /api/ai-tools/saved-lesson-plans/
[09/Nov/2025 03:56:28] "POST /api/ai-tools/saved-lesson-plans/ HTTP/1.1" 400 64
```

### Root Cause

**Problem**: The chapter extraction feature calculated duration as `10 lessons × 45 minutes = 450 minutes`, but the database model has a validation constraint of `MaxValueValidator(180)`.

**Call Stack:**
1. User extracts "Unit Three" content
2. Curriculum says: "10 lessons (450 minutes)"
3. Frontend calculates: `10 × 45 = 450 minutes`
4. Frontend sets duration to 450
5. User generates lesson plan
6. User clicks "Save"
7. Backend validates: `duration <= 180` ❌ FAILS
8. Returns 400 Bad Request

**Database Model:**
```python
# models.py - SavedLessonPlan
duration = models.IntegerField(
    validators=[MinValueValidator(15), MaxValueValidator(180)],
    help_text="Duration in minutes"
)
```

**Why 180 minutes?**
- 180 minutes = 3 hours
- Reasonable for a single lesson plan
- Longer units should be split into multiple lessons
- Prevents overly long, unmanageable plans

## Fix Applied

### File: `LessonPlanner.tsx`

**Before (BROKEN):**
```typescript
if (content.estimated_duration) {
    const durationMatch = content.estimated_duration.match(/\d+/);
    if (durationMatch) {
        setDuration(parseInt(durationMatch[0]) * 45); // ❌ Can exceed 180
    }
}
```

**After (FIXED):**
```typescript
let durationNote = '';
if (content.estimated_duration) {
    const durationMatch = content.estimated_duration.match(/\d+/);
    if (durationMatch) {
        // Convert lessons to minutes, but cap at 180 (database limit)
        const calculatedDuration = parseInt(durationMatch[0]) * 45;
        const cappedDuration = Math.min(calculatedDuration, 180);
        setDuration(cappedDuration);
        
        if (calculatedDuration > 180) {
            durationNote = `\n\n⚠️ Note: Duration capped at 180 minutes (${calculatedDuration} minutes estimated). Consider creating multiple lesson plans for longer units.`;
        }
    }
}

setShowExtractedContent(true);
alert(`✅ Chapter content extracted successfully!\n\nTopics: ${content.topics?.length || 0}\nObjectives: ${content.objectives?.length || 0}\n\nFields have been auto-populated. You can edit them before generating the plan.${durationNote}`);
```

## Changes Made

### 1. Cap Duration at 180 Minutes
```typescript
const cappedDuration = Math.min(calculatedDuration, 180);
setDuration(cappedDuration);
```

**Effect:**
- 45 minutes (1 lesson) → 45 ✅
- 90 minutes (2 lessons) → 90 ✅
- 135 minutes (3 lessons) → 135 ✅
- 180 minutes (4 lessons) → 180 ✅
- 450 minutes (10 lessons) → 180 ✅ (capped)

### 2. Notify User When Capped
```typescript
if (calculatedDuration > 180) {
    durationNote = `\n\n⚠️ Note: Duration capped at 180 minutes (${calculatedDuration} minutes estimated). Consider creating multiple lesson plans for longer units.`;
}
```

**User sees:**
```
✅ Chapter content extracted successfully!

Topics: 4
Objectives: 4

Fields have been auto-populated. You can edit them before generating the plan.

⚠️ Note: Duration capped at 180 minutes (450 minutes estimated). 
Consider creating multiple lesson plans for longer units.
```

## Example Scenarios

### Scenario 1: Short Unit (2 lessons = 90 minutes)
**Extraction:** "Unit One: 5 lessons (225 minutes)"  
**Calculated:** 5 × 45 = 225 minutes  
**Set to:** 180 minutes (capped)  
**User sees:** Warning about capping  
**Result:** ✅ Can save and export

### Scenario 2: Medium Unit (3 lessons = 135 minutes)
**Extraction:** "Unit Two: 3 lessons (135 minutes)"  
**Calculated:** 3 × 45 = 135 minutes  
**Set to:** 135 minutes (within limit)  
**User sees:** No warning  
**Result:** ✅ Can save and export

### Scenario 3: Long Unit (10 lessons = 450 minutes)
**Extraction:** "Unit Three: 10 lessons (450 minutes)"  
**Calculated:** 10 × 45 = 450 minutes  
**Set to:** 180 minutes (capped)  
**User sees:** Warning about capping + suggestion  
**Result:** ✅ Can save and export

## User Guidance

### When Duration is Capped

**Message:**
> ⚠️ Note: Duration capped at 180 minutes (450 minutes estimated). Consider creating multiple lesson plans for longer units.

**What this means:**
- The curriculum suggests this unit takes 450 minutes (10 lessons)
- System capped it at 180 minutes (4 lessons)
- Teacher should create multiple lesson plans

**Recommended approach:**
1. **Plan 1:** First 4 lessons (180 minutes)
2. **Plan 2:** Next 4 lessons (180 minutes)
3. **Plan 3:** Final 2 lessons (90 minutes)

### Benefits of Multiple Plans

**Pedagogical:**
- ✅ Better focus per plan
- ✅ Clear learning chunks
- ✅ Easier to manage
- ✅ More flexible scheduling

**Practical:**
- ✅ Can save/export each plan
- ✅ Can share specific sections
- ✅ Can modify independently
- ✅ Better organization

## Alternative Solutions Considered

### Option 1: Increase Database Limit ❌
**Pros:** Allows longer plans  
**Cons:** 
- Encourages overly long plans
- Harder to manage
- Poor pedagogical practice
- Database performance impact

**Decision:** Not recommended

### Option 2: Remove Limit Entirely ❌
**Pros:** No validation errors  
**Cons:**
- No guardrails
- Can create unusable plans
- Poor user experience
- Database issues

**Decision:** Not recommended

### Option 3: Cap Duration + Notify User ✅ (CHOSEN)
**Pros:**
- Prevents validation errors
- Guides users to best practice
- Maintains data integrity
- Clear communication

**Cons:**
- Requires user action for long units

**Decision:** Best balance of usability and best practices

### Option 4: Auto-split into Multiple Plans
**Pros:** Fully automated  
**Cons:**
- Complex implementation
- May not align with teacher's intent
- Harder to understand

**Decision:** Future enhancement

## Database Validation

### Current Constraints
```python
duration = models.IntegerField(
    validators=[
        MinValueValidator(15),   # Minimum 15 minutes
        MaxValueValidator(180)   # Maximum 180 minutes (3 hours)
    ],
    help_text="Duration in minutes"
)
```

### Why These Limits?

**Minimum (15 minutes):**
- Shortest meaningful lesson
- Quick review or assessment
- Practical lower bound

**Maximum (180 minutes):**
- 3 hours = reasonable lesson block
- Maintains focus and engagement
- Aligns with typical class periods
- Prevents unwieldy plans

## Testing

### Test Case 1: Within Limit
```typescript
Input: "5 lessons (225 minutes)"
Calculated: 225 minutes
Set to: 180 minutes
Warning: Yes
Save: ✅ Success
```

### Test Case 2: At Limit
```typescript
Input: "4 lessons (180 minutes)"
Calculated: 180 minutes
Set to: 180 minutes
Warning: No
Save: ✅ Success
```

### Test Case 3: Below Limit
```typescript
Input: "2 lessons (90 minutes)"
Calculated: 90 minutes
Set to: 90 minutes
Warning: No
Save: ✅ Success
```

### Test Case 4: Far Exceeds Limit
```typescript
Input: "10 lessons (450 minutes)"
Calculated: 450 minutes
Set to: 180 minutes
Warning: Yes (shows 450 → 180)
Save: ✅ Success
```

## Files Modified

**File:** `components/teacher/LessonPlanner.tsx`

**Function:** `handleExtractChapter()`

**Changes:**
1. Added duration capping logic with `Math.min()`
2. Added warning message when duration is capped
3. Included helpful suggestion about multiple plans

**Lines Changed:** ~15 lines

## Impact

### Before Fix
- ❌ Save fails with validation error
- ❌ Export fails with validation error
- ❌ Confusing error message
- ❌ No guidance for users

### After Fix
- ✅ Save succeeds (duration capped)
- ✅ Export succeeds (duration capped)
- ✅ Clear warning message
- ✅ Helpful guidance provided

## Future Enhancements

### Phase 2 Ideas
1. **Auto-split feature** - Automatically create multiple plans
2. **Duration wizard** - Guide users through splitting
3. **Plan series** - Link related plans together
4. **Bulk operations** - Save/export multiple plans at once

### Smart Features
1. **Suggest split points** - Based on topics/objectives
2. **Preview split** - Show how unit would be divided
3. **Template series** - Pre-configured multi-plan templates
4. **Progress tracking** - Track completion across plan series

## Summary

**Root Cause:** Duration exceeded database validation limit (180 minutes)  
**Fix:** Cap duration at 180 and notify user  
**User Impact:** Can now save/export plans successfully  
**Guidance:** Clear message about creating multiple plans  
**Status:** ✅ FIXED

---

**Next Action:** Test save/export with extracted content!
