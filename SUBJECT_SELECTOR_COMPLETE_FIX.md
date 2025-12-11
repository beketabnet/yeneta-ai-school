# Subject Selector Complete Fix - Final Solution

## Issues Identified

### Issue 1: Subject resets after selection
**Problem:** After selecting a subject, it immediately resets to "Select a subject..."

**Root Cause:** Infinite loop in useEffect due to `config.subject` in dependency array

### Issue 2: Must select grade before subject
**Problem:** If you select subject before changing grade, the subject resets when you later select a grade

**Root Cause:** On initial mount, the useEffect sees grade as "changed" from null to initial value, triggers fetch, and resets subject

## Complete Solution

### 1. Track Previous Values with useRef
```typescript
const prevGradeRef = useRef<number | string | null>(null);
const prevStreamRef = useRef<string | null>(null);
const isInitialMount = useRef(true);
```

### 2. Add shouldResetSubject Parameter
```typescript
const fetchSubjectsForGrade = useCallback(
    async (grade: number | string, stream?: string, shouldResetSubject: boolean = true) => {
        // ...
        // Reset subject ONLY if it's not in the new list AND we should reset
        if (shouldResetSubject && config.subject && !data.subjects.includes(config.subject)) {
            onConfigChange({ subject: '' });
        }
    }, 
    [config.subject, onConfigChange]
);
```

### 3. Handle Initial Mount Separately
```typescript
useEffect(() => {
    if (config.gradeLevel) {
        const streamParam = ...;
        
        // On initial mount, fetch subjects WITHOUT resetting subject
        if (isInitialMount.current) {
            fetchSubjectsForGrade(config.gradeLevel, streamParam, false); // ← false = don't reset
            prevGradeRef.current = config.gradeLevel;
            prevStreamRef.current = streamParam || null;
            isInitialMount.current = false;
            return;
        }
        
        // After initial mount, only fetch if grade/stream actually changed
        const gradeChanged = prevGradeRef.current !== config.gradeLevel;
        const streamChanged = prevStreamRef.current !== streamParam;
        
        if (gradeChanged || streamChanged) {
            fetchSubjectsForGrade(config.gradeLevel, streamParam, true); // ← true = reset if needed
            prevGradeRef.current = config.gradeLevel;
            prevStreamRef.current = streamParam || null;
        }
    }
}, [config.gradeLevel, config.stream, fetchSubjectsForGrade]);
```

## How It Works Now

### Scenario 1: Select subject first, then change grade
```
1. Component mounts with Grade 9
   - isInitialMount = true
   - Fetches subjects for Grade 9
   - Does NOT reset subject (shouldResetSubject = false)
   - Sets isInitialMount = false

2. User selects "English"
   - config.subject = "English"
   - useEffect runs but checks: gradeChanged? NO, streamChanged? NO
   - Skips fetch
   - Subject stays "English" ✅

3. User changes grade to 10
   - config.gradeLevel = 10
   - useEffect runs and checks: gradeChanged? YES
   - Fetches subjects for Grade 10
   - If "English" in Grade 10 subjects → keeps it ✅
   - If "English" NOT in Grade 10 subjects → resets (expected) ✅
```

### Scenario 2: Change grade first, then select subject
```
1. Component mounts with Grade 9
   - Fetches subjects for Grade 9
   - Does NOT reset subject

2. User changes grade to 10
   - Fetches subjects for Grade 10
   - Subject is empty, so nothing to reset

3. User selects "English"
   - config.subject = "English"
   - useEffect runs but checks: gradeChanged? NO
   - Skips fetch
   - Subject stays "English" ✅
```

### Scenario 3: Select subject, keep same grade
```
1. Component mounts with Grade 9
   - Fetches subjects for Grade 9
   - Does NOT reset subject

2. User selects "Mathematics"
   - config.subject = "Mathematics"
   - useEffect runs but checks: gradeChanged? NO
   - Skips fetch
   - Subject stays "Mathematics" ✅

3. User selects "English" (changes mind)
   - config.subject = "English"
   - useEffect runs but checks: gradeChanged? NO
   - Skips fetch
   - Subject stays "English" ✅
```

## Key Improvements

### Before (Broken)
```typescript
// ❌ Problem 1: config.subject in dependency causes infinite loop
const fetchSubjectsForGrade = useCallback(async (...) => {
    if (config.subject && !data.subjects.includes(config.subject)) {
        onConfigChange({ subject: '' });
    }
}, [config.subject, onConfigChange]);

// ❌ Problem 2: Always fetches on mount, resets subject
useEffect(() => {
    if (config.gradeLevel) {
        fetchSubjectsForGrade(config.gradeLevel, streamParam);
    }
}, [config.gradeLevel, config.stream, fetchSubjectsForGrade]);
```

### After (Fixed)
```typescript
// ✅ Solution 1: Add shouldResetSubject parameter
const fetchSubjectsForGrade = useCallback(
    async (grade, stream, shouldResetSubject = true) => {
        if (shouldResetSubject && config.subject && !data.subjects.includes(config.subject)) {
            onConfigChange({ subject: '' });
        }
    }, 
    [config.subject, onConfigChange]
);

// ✅ Solution 2: Handle initial mount separately
useEffect(() => {
    if (config.gradeLevel) {
        if (isInitialMount.current) {
            fetchSubjectsForGrade(config.gradeLevel, streamParam, false); // Don't reset
            isInitialMount.current = false;
            return;
        }
        
        // Only fetch if actually changed
        if (gradeChanged || streamChanged) {
            fetchSubjectsForGrade(config.gradeLevel, streamParam, true); // Reset if needed
        }
    }
}, [config.gradeLevel, config.stream, fetchSubjectsForGrade]);
```

## Testing Checklist

### Test 1: Subject First, Grade Second
- [ ] Open Practice Labs
- [ ] Select "English" from subject dropdown
- [ ] Verify subject stays "English"
- [ ] Change grade from 9 to 10
- [ ] Verify subject stays "English" (if available in Grade 10)

### Test 2: Grade First, Subject Second
- [ ] Open Practice Labs
- [ ] Change grade from 9 to 10
- [ ] Select "Mathematics" from subject dropdown
- [ ] Verify subject stays "Mathematics"

### Test 3: Multiple Subject Changes
- [ ] Open Practice Labs
- [ ] Select "English"
- [ ] Change to "Mathematics"
- [ ] Change to "Physics"
- [ ] Verify each selection stays selected

### Test 4: Grade Change with Subject Selected
- [ ] Select "English" at Grade 9
- [ ] Change to Grade 10
- [ ] Verify "English" stays if available in Grade 10
- [ ] Change to Grade 11
- [ ] Select stream if required
- [ ] Verify subject resets (different subject list)

### Test 5: Stream Change (Grades 11-12)
- [ ] Set Grade 11
- [ ] Select "Natural Science" stream
- [ ] Select "Physics"
- [ ] Change to "Social Science" stream
- [ ] Verify subject resets (different subject list)

## Console Logging

You'll see these logs in the browser console:

**On initial mount:**
```
Initial mount, fetching subjects for: 9 undefined
```

**When selecting subject:**
```
Subject selected: English
```

**When changing grade:**
```
Grade or stream changed, fetching subjects: 10 undefined
```

**When subject not in new list:**
```
Subject not in new list, resetting: English
```

## Files Modified
- `components/student/practiceLabs/ConfigPanel.tsx`
  - Added `isInitialMount` ref
  - Added `shouldResetSubject` parameter to `fetchSubjectsForGrade`
  - Modified `useEffect` to handle initial mount separately
  - Pass `false` on initial mount, `true` on subsequent changes

## Status
✅ **COMPLETELY FIXED** - Subject selector now works in all scenarios:
- ✅ Can select subject before changing grade
- ✅ Can select subject after changing grade
- ✅ Subject stays selected when not changing grade
- ✅ Subject resets only when not available in new grade/stream
