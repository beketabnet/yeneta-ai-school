# Gradebook Manager - Testing & Verification Guide

## Real-Time Update Architecture

### Current Implementation
- **Framework**: Event-driven architecture with HTTP polling
- **Polling Interval**: 15 seconds (Student Gradebook auto-refresh)
- **Event Service**: Client-side event emitter for component communication
- **No WebSocket**: Uses simpler HTTP polling for compatibility

### Data Flow Diagram
```
Teacher Dashboard (Gradebook Manager)
  ↓
  [Save Grade via API]
  ↓
API Response
  ↓
useGradebookManager Hook
  ↓
  [Emit GRADE_UPDATED event + Refetch data]
  ↓
Student Dashboard (ApprovedCoursesGradebook)
  ├─ Listens for GRADE_UPDATED event → Refetch immediately
  └─ Auto-refresh every 15 seconds → Fetch updates
  ↓
Parent Dashboard (Parent-enrolled-subjects)
  ├─ Listens for GRADE_UPDATED event → Refetch immediately
  └─ Auto-refresh every 15 seconds → Fetch updates
```

## Testing Checklist

### 1. Setup Test Environment
- [ ] Activate Python venv: `venv\Scripts\activate.bat`
- [ ] Start Django backend: `python manage.py runserver`
- [ ] Start Vite dev server: `npm run dev`
- [ ] Create test users:
  - Teacher: teacher1@test.com / password
  - Student: student1@test.com / password
  - Parent: parent1@test.com / password

### 2. Test Grade Entry (Teacher Dashboard)
```
Test Case: Teacher enters a grade
Steps:
1. Login as teacher1
2. Go to Dashboard → Gradebook Manager
3. Verify students and subjects are displayed
4. Click "Add" button for a student's Assignment score
5. Enter score (e.g., 85)
6. Click "Save Score"

Expected Results:
✓ Score appears in table immediately
✓ Overall Score is calculated and updated
✓ No errors in console
✓ Grade is persisted (refresh page, should still show)
```

### 3. Test Student Gradebook Update (Student Dashboard)
```
Test Case: Student sees grade entered by teacher
Steps:
1. Open second browser window, login as student1
2. Go to Dashboard → Gradebook
3. Verify grades visible (or wait up to 15 seconds for auto-refresh)
4. Return to Teacher Dashboard, enter another grade for this student
5. Return to Student Dashboard, observe update

Expected Results:
✓ New grade appears within 15 seconds (max)
✓ Grades are properly categorized (Assignments, Quizzes, Exams)
✓ Overall Score is calculated
✓ Chart/statistics update if visible
✓ No errors in console
```

### 4. Test Parent Dashboard Updates (Parent Dashboard)
```
Test Case: Parent sees child's grades
Prerequisites:
- Enrollment request must be approved (status='approved')
- Parent must be linked to student's family
- Teacher has entered grades

Steps:
1. Login as parent1
2. Go to Dashboard → View enrolled subjects/grades
3. Verify child's name and enrolled subjects visible
4. Check that grades match what teacher entered
5. Return to Teacher Dashboard, enter new grade
6. Return to Parent Dashboard within 15 seconds

Expected Results:
✓ Enrolled subjects displayed with current grades
✓ Overall scores calculated and shown
✓ New grades appear within 15 seconds
✓ Multiple children/subjects grouped properly (if applicable)
✓ No errors in console
```

### 5. Test Real-Time Event Emission
```
Test Case: Event service emits GRADE_UPDATED
Prerequisites:
- Open browser DevTools Console

Steps:
1. Login as teacher1, open DevTools
2. Add this listener to console:
   ```javascript
   // Monitor eventService emissions
   const originalEmit = window.eventService?.emit;
   window.eventService.emit = function(event, data) {
     console.log('EVENT EMITTED:', event, data);
     return originalEmit.call(this, event, data);
   };
   ```
3. Enter a grade in Gradebook Manager
4. Check console for GRADE_UPDATED event

Expected Results:
✓ Event is emitted with grade data
✓ Event listeners receive the event
✓ Data matches what was saved
```

### 6. Test Data Persistence
```
Test Case: Grades persist across sessions
Steps:
1. Teacher enters grade for Math, Student1, Assignment: 90
2. Refresh page (F5)
3. Verify grade still shows: 90
4. Logout, close browser
5. Open new browser, login as same teacher
6. Navigate to Gradebook Manager
7. Verify grade still shows: 90

Expected Results:
✓ Grades appear after page refresh
✓ Grades persist after logout/login
✓ Database is being properly updated
```

### 7. Test Filter Functionality
```
Test Case: Filters work correctly
Steps:
1. In Gradebook Manager, enter multiple grades for different students/subjects
2. Filter by Subject (select one subject)
3. Verify only rows with that subject displayed
4. Filter by Grade Level
5. Filter by Student name (search box)
6. Click "Clear Filters"

Expected Results:
✓ Filters apply correctly
✓ Only matching records shown
✓ Clear Filters restores all records
✓ Multiple filter combinations work
```

### 8. Test Stats Calculation
```
Test Case: Statistics are accurate
Steps:
1. Enter 5 grades with known values:
   - Student1, Math, Assignment: 80
   - Student1, Math, Quiz: 90
   - Student2, English, Assignment: 85
   - Student2, English, Mid Exam: 75
   - Student3, Science, Final Exam: 95

2. Check stats displayed:
   - Total Students: should be 3
   - Total Subjects: should be 3
   - Average Score: should be (80+90+85+75+95)/5 = 85
   - Grades Entered: should be 5

Expected Results:
✓ All stats match calculations
✓ Overall scores calculated correctly for each entry
```

### 9. Test Modal Grade Entry
```
Test Case: Grade entry modal works
Steps:
1. Click "Add" button for Assignment score
2. Modal opens with fields:
   - Score input (0-100)
   - Feedback text area
   - Student name and subject displayed
3. Enter valid score (50)
4. Add feedback: "Good effort"
5. Click "Save Score"

Expected Results:
✓ Modal opens/closes smoothly
✓ Validation prevents scores > 100
✓ Percentage calculated and displayed (e.g., 50%)
✓ Score saved with feedback
✓ Grade appears in table
```

### 10. Test Edge Cases

#### Empty State
```
Test Case: No enrolled students
Expected: "No enrolled subjects found" message displayed
```

#### Multiple Score Types
```
Test Case: Save all four score types for same student/subject
Expected: All scores saved, Overall Score = average of all four
```

#### Score Updates
```
Test Case: Update previously entered score
Steps:
1. Enter Assignment score: 80
2. Click to edit, change to: 85
3. Save
Expected: Grade updated to 85, Overall Score recalculated
```

#### Zero Scores
```
Test Case: Enter score of 0
Expected: 0 is valid, Overall Score calculation includes it
```

## Performance Testing

### Load Testing Data
```sql
-- Expected data volume for scalability:
- Teachers: 50-100
- Students per teacher: 30-100
- Subjects per teacher: 5-15
- Grades per student: 20-50
```

### Performance Benchmarks
- [ ] Gradebook Manager loads in < 2 seconds
- [ ] Grade entry modal opens in < 500ms
- [ ] Saving grade completes in < 1 second
- [ ] Student Gradebook auto-refresh updates in < 5 seconds
- [ ] Parent Dashboard loads enrolled subjects in < 3 seconds

## Browser Compatibility Testing
- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (if applicable)

## Console Error Checklist
- [ ] No 404 errors (missing API endpoints)
- [ ] No CORS errors
- [ ] No TypeScript/JavaScript errors
- [ ] No warning messages

## Backend API Verification

### Endpoint Testing
```bash
# Test grade retrieval
curl "http://localhost:8000/academics/student-grades/" \
  -H "Authorization: Bearer <token>"

# Expected response:
[
  {
    "id": 1,
    "student": 5,
    "subject": "Mathematics",
    "grade_level": "10",
    "assignment_type": "Assignment",
    "exam_type": null,
    "score": 90,
    "max_score": 100,
    "feedback": "",
    "graded_by": 3,
    "graded_at": "2024-11-16T..."
  }
]
```

### Database Verification
```sql
-- Check StudentGrade records
SELECT student_id, subject, assignment_type, exam_type, score 
FROM student_grades 
WHERE graded_by_id = <teacher_id>
ORDER BY created_at DESC
LIMIT 10;

-- Verify enrollment
SELECT student_id, subject, status 
FROM academics_studentenrollmentrequest 
WHERE status = 'approved'
LIMIT 10;
```

## Troubleshooting

### Grades Not Showing
1. Verify StudentGrade records in database
2. Check student ID matches between tables
3. Verify teacher is graded_by user
4. Check browser auto-refresh is enabled (default: on)

### Auto-Refresh Not Working
1. Open DevTools Network tab
2. Verify API requests to `/academics/student-grades/` happening every 15 seconds
3. Check response status (200 OK)
4. Verify response contains grade data

### Scores Not Calculating
1. Verify all four score types entered
2. Check Overall Score formula: (assignment + quiz + mid + final) / 4
3. Verify no null values in calculation

### API Errors (400/500)
1. Check request payload format
2. Verify all required fields present
3. Check score value is within 0-100 range
4. Check student_id exists in database

## Regression Testing

After any changes, verify:
- [ ] Existing grades still display
- [ ] Grade entry still works
- [ ] Stats still calculate correctly
- [ ] Filters still work
- [ ] Auto-refresh still triggers
- [ ] Overall Score still aggregates

