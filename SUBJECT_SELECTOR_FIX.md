# Subject Selector Retention Fix

## Issue
Subject dropdown in Practice Labs was not retaining selected values. After selecting a subject, it would immediately reset back to "Select a subject...", keeping the "Generate Practice Question" button disabled.

## Root Cause
The `useEffect` hook that fetches subjects had `config.subject` in its dependency array, causing an infinite loop:

```typescript
// BEFORE (Broken)
useEffect(() => {
    if (config.gradeLevel) {
        fetchSubjectsForGrade(config.gradeLevel, streamParam);
    }
}, [config.gradeLevel, config.stream, fetchSubjectsForGrade]);

// fetchSubjectsForGrade had config.subject in dependencies
const fetchSubjectsForGrade = useCallback(async (...) => {
    // ...
}, [config.subject, onConfigChange]); // ❌ This causes re-creation on every subject change
```

**The Loop:**
1. User selects subject → `config.subject` changes
2. `fetchSubjectsForGrade` function is recreated (due to dependency)
3. `useEffect` detects function change → runs again
4. Fetches subjects → potentially resets subject
5. Repeat infinitely

## Solution
Use `useRef` to track previous grade/stream values and only fetch when they actually change:

```typescript
// AFTER (Fixed)
// Track previous values
const prevGradeRef = useRef<number | string | null>(null);
const prevStreamRef = useRef<string | null>(null);

useEffect(() => {
    if (config.gradeLevel) {
        const streamParam = ...;
        
        // Only fetch if grade or stream actually changed
        const gradeChanged = prevGradeRef.current !== config.gradeLevel;
        const streamChanged = prevStreamRef.current !== streamParam;
        
        if (gradeChanged || streamChanged) {
            console.log('Grade or stream changed, fetching subjects');
            fetchSubjectsForGrade(config.gradeLevel, streamParam);
            prevGradeRef.current = config.gradeLevel;
            prevStreamRef.current = streamParam || null;
        }
    }
}, [config.gradeLevel, config.stream, fetchSubjectsForGrade]);
```

## Key Changes

### 1. Added useRef for tracking
```typescript
const prevGradeRef = useRef<number | string | null>(null);
const prevStreamRef = useRef<string | null>(null);
```

### 2. Check if values actually changed
```typescript
const gradeChanged = prevGradeRef.current !== config.gradeLevel;
const streamChanged = prevStreamRef.current !== streamParam;

if (gradeChanged || streamChanged) {
    // Only fetch when needed
}
```

### 3. Update refs after fetch
```typescript
prevGradeRef.current = config.gradeLevel;
prevStreamRef.current = streamParam || null;
```

## Behavior Now

### Scenario 1: User selects subject
```
1. User clicks dropdown, selects "English"
2. config.subject changes to "English"
3. useEffect runs
4. Checks: gradeChanged? NO, streamChanged? NO
5. Skips fetch
6. Subject remains "English" ✅
```

### Scenario 2: User changes grade
```
1. User changes grade from 7 to 8
2. config.gradeLevel changes
3. useEffect runs
4. Checks: gradeChanged? YES
5. Fetches new subjects for Grade 8
6. If "English" not in Grade 8 subjects → resets
7. If "English" in Grade 8 subjects → keeps it ✅
```

### Scenario 3: User changes stream (Grades 11-12)
```
1. User changes from "Natural Science" to "Social Science"
2. config.stream changes
3. useEffect runs
4. Checks: streamChanged? YES
5. Fetches new subjects for Social Science
6. Resets subject (different subject lists) ✅
```

## Files Modified
- `components/student/practiceLabs/ConfigPanel.tsx`
  - Added `useRef` import
  - Added `prevGradeRef` and `prevStreamRef`
  - Modified `useEffect` to check for actual changes
  - Added console logging for debugging

## Testing
1. ✅ Select subject → stays selected
2. ✅ Change grade → fetches new subjects
3. ✅ Change stream → fetches new subjects
4. ✅ Subject resets only when not in new list
5. ✅ Button enables when subject selected

## Status
✅ **FIXED** - Subject dropdown now properly retains selected values
