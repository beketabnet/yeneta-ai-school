# GRADEBOOK ERRORS - ROOT CAUSE ANALYSIS

**Date:** November 20, 2025  
**Analysis Type:** Comprehensive Root Cause Analysis  
**Status:** ✅ COMPLETE

---

## ERROR SUMMARY

### Observed Errors
1. **Chart displays 3 subjects** instead of 1
2. **Detailed breakdown lists 3 subjects** instead of 1
3. **"Unknown Teacher" displayed** for 2 subjects
4. **Data mismatch** between enrollment requests and gradebook

### Correct Behavior
- Total Courses: 1 ✅
- My Enrollment Requests: Shows correct data ✅
- Backend API: Returns correct data ✅

---

## ROOT CAUSE #1: Dual Data Source in useGradeChartData

### The Error
```typescript
// WRONG: Fetching from TWO sources
const [coursesData, gradesData] = await Promise.all([
  apiService.getApprovedCoursesWithGrades(),  // Source 1: Approved courses
  apiService.getStudentGradebook()             // Source 2: ALL grades
]);
```

### Why It's Wrong
1. **Source 1** returns only approved enrollments (1 course: Mathematics)
2. **Source 2** returns ALL grades in database (3 subjects: English, Math, Physics)
3. The hook then **merged both sources**, creating entries for non-approved subjects
4. Result: Displayed 3 subjects when only 1 is approved

### The Logic Error
```typescript
// Process approved courses first
for (const course of validCoursesData) {  // 1 course
  subjectsMap.set(id, {...});
}

// Then add grades from ALL subjects
for (const gradeSubject of validGradesData) {  // 3 subjects
  if (subjectsMap.has(gradeKey)) {
    // Update existing
  } else {
    // CREATE NEW ENTRY for non-approved subjects ❌
    subjectsMap.set(gradeKey, {...});
  }
}
```

### Why This Happened
- Developer assumed `getStudentGradebook()` would return only approved grades
- But backend returns ALL grades for the student
- No filtering was applied to match approved enrollments
- Result: Orphaned grades (grades without approved enrollment) were displayed

### The Fix
```typescript
// CORRECT: Use ONLY approved courses
const coursesData = await apiService.getApprovedCoursesWithGrades();

// Process ONLY approved courses
for (const course of validCoursesData) {  // 1 course
  subjectsMap.set(id, {...});
}

// Don't fetch or process grades separately
```

---

## ROOT CAUSE #2: No Filtering in useStudentGradesEnhanced

### The Error
```typescript
// WRONG: Fetch ALL grades without filtering
const response = await apiService.getStudentGradebook();
const organized = organizeGrades(response);  // Organizes ALL grades
```

### Why It's Wrong
1. `getStudentGradebook()` returns ALL grades for the student
2. No check is performed to see if subject has approved enrollment
3. All grades are organized and displayed
4. Result: Detailed breakdown shows 3 subjects when only 1 is approved

### The Data Issue
```
Database StudentGrade table:
├─ English (Grade 10) - 89.3% - graded_by: Teacher User
├─ Mathematics (Grade 10) - 82.0% - graded_by: Teacher User
└─ Physics (Grade 10) - (A) - graded_by: Teacher User

StudentEnrollmentRequest table:
└─ Mathematics (Grade 10) - status: approved - teacher: Teacher User

Hook behavior:
- Fetches all 3 grades
- Displays all 3 subjects
- Never checks if enrollment is approved ❌
```

### Why This Happened
- Hook was designed to show "all grades" without considering enrollment status
- No cross-reference with approved enrollments
- Assumption that grades only exist for approved courses (FALSE)
- Result: Orphaned grades displayed

### The Fix
```typescript
// CORRECT: Filter grades by approved subjects
const [approvedCoursesData, gradebookData] = await Promise.all([
  apiService.getApprovedCoursesWithGrades(),
  apiService.getStudentGradebook()
]);

// Create set of approved subjects
const approvedSubjects = new Set();
for (const course of approvedCoursesData) {
  const key = `${course.subject}_${course.grade_level}_${course.stream || ''}`;
  approvedSubjects.add(key);
}

// Filter grades to only approved subjects
let filteredGradebookData = {};
for (const item of gradebookData) {
  const key = `${item.subject}_${item.grade_level}_${item.stream || ''}`;
  if (approvedSubjects.has(key)) {  // ✅ Check approval status
    filteredGradebookData[item.subject] = item;
  }
}
```

---

## ROOT CAUSE #3: "Unknown Teacher" Display

### The Error
```
Chart shows:
- English (Grade 10) - "Unknown Teacher" ❌
- Mathematics (Grade 10) - "Teacher User" ✅
- Physics (Grade 10) - "Unknown Teacher" ❌
```

### Why It Happened
1. For approved courses, teacher info comes from `StudentEnrollmentRequest.teacher`
2. For non-approved subjects, there's no enrollment record
3. Hook tries to fetch teacher info via `getSubjectTeacherInfo()` API
4. This API might not have data for subjects without active enrollments
5. Result: "Unknown Teacher" displayed

### The Logic
```typescript
// Teacher info from approved enrollment
if (course.teacher) {
  teacher_name = getTeacherName(course.teacher);  // ✅ Works
}

// For non-approved subjects, tries to fetch
if (subject.teacher_name === 'Unknown Teacher') {
  const teacherInfo = await apiService.getSubjectTeacherInfo(...);
  // This might fail if no active enrollment exists
  if (!teacherInfo) {
    teacher_name = 'Unknown Teacher';  // ❌ Fallback
  }
}
```

### Why This Happened
- Non-approved subjects don't have enrollment records
- No teacher assignment for non-approved subjects
- API call fails or returns empty
- Result: "Unknown Teacher" displayed

### The Fix
- By removing non-approved subjects entirely, this error is eliminated
- Only approved subjects are displayed
- All have valid teacher information from enrollment

---

## ROOT CAUSE #4: Data Inconsistency Across Components

### The Error
```
Total Courses: 1 ✅ (from useApprovedCourses)
Chart: 3 subjects ❌ (from useGradeChartData)
Breakdown: 3 subjects ❌ (from useStudentGradesEnhanced)
Enrollment Requests: 1 approved ✅ (from API)
```

### Why It Happened
1. Different components use different data sources
2. No coordination between hooks
3. Each hook independently fetches and processes data
4. No validation that displayed data matches approved enrollments
5. Result: Inconsistent display across dashboard

### The Data Flow
```
Component 1: useApprovedCourses
└─ Uses: getApprovedCoursesWithGrades()
   └─ Returns: 1 course ✅

Component 2: useGradeChartData
├─ Uses: getApprovedCoursesWithGrades() → 1 course
├─ Uses: getStudentGradebook() → 3 subjects
└─ Merges: Shows 3 subjects ❌

Component 3: useStudentGradesEnhanced
├─ Uses: getStudentGradebook() → 3 subjects
└─ Shows: 3 subjects ❌

Result: Inconsistent data display ❌
```

### Why This Happened
- Hooks were developed independently
- No shared data source or validation
- Each hook had different assumptions about data
- No integration testing between hooks
- Result: Data inconsistency

### The Fix
- All hooks now use approved courses as source of truth
- Filtering is applied consistently
- Data is validated before display
- Result: Consistent data across all components

---

## ARCHITECTURAL ISSUES

### Issue 1: Multiple Data Fetching
**Problem:** Each hook independently fetches data  
**Impact:** Redundant API calls, potential race conditions  
**Solution:** Consider combining hooks or implementing caching

### Issue 2: No Data Validation
**Problem:** No check that displayed data matches enrollment status  
**Impact:** Orphaned data displayed  
**Solution:** Always validate against approved enrollments

### Issue 3: Implicit Assumptions
**Problem:** Assumptions about API responses not documented  
**Impact:** Bugs when assumptions are wrong  
**Solution:** Add explicit filtering and validation

### Issue 4: Lack of Integration Testing
**Problem:** Components tested in isolation  
**Impact:** Data inconsistencies not caught  
**Solution:** Add integration tests for data flow

---

## PREVENTION MEASURES

### For Future Development
1. **Always validate data** against source of truth
2. **Document assumptions** about API responses
3. **Add filtering logic** explicitly, don't assume backend filters
4. **Test data flow** end-to-end, not just components
5. **Use consistent data sources** across related components
6. **Add logging** for debugging data issues
7. **Implement caching** to reduce API calls

### Code Review Checklist
- [ ] Data source is clearly documented
- [ ] Filtering logic is explicit
- [ ] Assumptions about API responses are validated
- [ ] Data consistency is verified
- [ ] Error cases are handled
- [ ] Logging is added for debugging

---

## LESSONS LEARNED

### What Went Wrong
1. Mixing multiple data sources without coordination
2. Assuming backend filters when it doesn't
3. Not validating data against enrollment status
4. Lack of integration testing

### What Went Right
1. Backend was correctly implemented
2. API responses were consistent
3. Error was isolated to frontend logic
4. Fix was straightforward once root cause identified

### Best Practices Applied
1. Single source of truth (approved courses)
2. Explicit filtering logic
3. Comprehensive logging
4. Detailed documentation

---

## CONCLUSION

The gradebook errors were caused by **mixing multiple data sources without proper filtering and validation**. The solution was to:

1. **Use single source of truth** (approved courses)
2. **Apply explicit filtering** (only approved subjects)
3. **Validate data** (check enrollment status)
4. **Add logging** (for debugging)

### Key Takeaway
> Always validate data against the source of truth. Don't assume backend filters. Make filtering logic explicit and testable.

---

## TECHNICAL DETAILS

### Error Classification
- **Type:** Data Consistency Error
- **Severity:** High (incorrect data displayed)
- **Impact:** User confusion, incorrect information
- **Scope:** Frontend only
- **Root Cause:** Logic error in data fetching

### Error Pattern
```
Multiple Data Sources → No Filtering → Data Merging → Inconsistency
```

### Fix Pattern
```
Single Source of Truth → Explicit Filtering → Validation → Consistency
```

---

## REFERENCES

### Files Involved
- `hooks/useGradeChartData.ts` - Chart data fetching
- `hooks/useStudentGradesEnhanced.ts` - Grade organization
- `hooks/useApprovedCourses.ts` - Approved courses fetching
- `components/student/gradebook/ApprovedCoursesGradebook.tsx` - Main component

### Related Documentation
- `GRADEBOOK_DATA_MISMATCH_FIX.md` - Fix details
- `GRADEBOOK_FIX_IMPLEMENTATION_SUMMARY.md` - Implementation summary

---

**Analysis Complete** ✅  
**All errors identified and fixed** ✅  
**Prevention measures documented** ✅
