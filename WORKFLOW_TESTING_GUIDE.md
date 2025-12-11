# Complete End-to-End Workflow Testing Guide

## Prerequisites

### Backend Setup
```bash
# Activate virtual environment
cd d:/django_project/yeneta-ai-school
venv\Scripts\activate

# Run migrations (if not already done)
python manage.py migrate

# Start backend server
python manage.py runserver
```

Backend will be available at: `http://127.0.0.1:8000/`

### Frontend Setup
```bash
# In a new terminal, from project root
npm start
```

Frontend will be available at: `http://localhost:3001/` or `http://localhost:3000/`

### Test Credentials

```
Admin:
- Email: admin@yeneta.com
- Password: admin123

Teacher:
- Email: teacher@yeneta.com
- Password: teacher123

Student:
- Email: student@yeneta.com
- Password: student123

Parent:
- Email: parent@yeneta.com
- Password: parent123
```

---

## Complete Workflow Test Scenario

### Phase 1: Teacher Submits Course Request

**Steps**:
1. Login as Teacher (teacher@yeneta.com / teacher123)
2. Navigate to Teacher Dashboard
3. Click on "Course Request Manager" tab
4. Click "Request Course" button
5. Fill in the form:
   - Grade Level: Select "Grade 10"
   - Stream: (leave empty for Grade 10)
   - Subject: Select "Mathematics"
6. Click "Submit Request"

**Expected Results**:
- ✅ Success notification: "Course request for Mathematics submitted successfully!"
- ✅ Request appears in "My Course Requests" list with status "Pending"
- ✅ List updates automatically (auto-refresh every 15 seconds)
- ✅ Auto-refresh toggle is visible and enabled (green ⟳ button)

---

### Phase 2: Admin Receives & Approves Course Request

**Steps**:
1. Login as Admin (admin@yeneta.com / admin123)
2. Navigate to Admin Dashboard
3. Click on "Course Approval Manager" tab
4. Verify new course request appears in "Pending" tab
5. Click on the course request card to select it
6. Review details in the detail panel
7. Add review notes (optional): "Approved - Mathematics teacher qualified"
8. Click "Approve" button

**Expected Results**:
- ✅ Info notification on page load: "New course request received!"
- ✅ Request appears in "Pending" tab with teacher name and subject
- ✅ Detail panel shows all request information
- ✅ Success notification: "Course request for Mathematics (Teacher Name) has been approved"
- ✅ Request moves to "Approved" tab
- ✅ Status badge changes to green "APPROVED"
- ✅ Auto-refresh updates list (every 10 seconds)

**Teacher Verification**:
1. Go back to Teacher Dashboard (or refresh)
2. Check "My Course Requests" list
3. Request status should now show "APPROVED" (green badge)
4. Success notification should have been received

---

### Phase 3: Student Sees Available Course

**Steps**:
1. Login as Student (student@yeneta.com / student123)
2. Navigate to Student Dashboard
3. Click on "Available Courses" tab
4. Verify approved Mathematics course appears

**Expected Results**:
- ✅ Course card displays:
  - Subject: "Mathematics"
  - Grade: "Grade 10"
  - Teacher: "Teacher Name" (@teacher username)
  - "Request Enrollment" button
- ✅ Auto-refresh toggle visible and enabled
- ✅ List updates automatically (every 15 seconds)

---

### Phase 4: Student Requests Enrollment

**Steps**:
1. On "Available Courses" tab
2. Click "Request Enrollment" button on Mathematics course
3. Family selector modal appears
4. Select a family from the dropdown (or search)
5. Click "Submit Request"

**Expected Results**:
- ✅ Family selector modal displays
- ✅ Families load from database
- ✅ Success notification: "Enrollment request for Mathematics submitted successfully!"
- ✅ Modal closes
- ✅ Course status changes to show enrollment request status
- ✅ Request appears in "My Enrollment Requests" tab with status "Pending"

---

### Phase 5: Teacher Approves Enrollment

**Steps**:
1. Login as Teacher (teacher@yeneta.com / teacher123)
2. Navigate to Teacher Dashboard
3. Click on "Enrollment Approval Manager" tab
4. Verify student enrollment request appears in "Pending" tab
5. Click on the request to view details
6. Modal opens with student and course information
7. Add review notes (optional): "Approved - Student meets prerequisites"
8. Click "Approve" button

**Expected Results**:
- ✅ Enrollment request appears in "Pending" tab
- ✅ Shows student name, subject, and grade
- ✅ Detail modal displays all information
- ✅ Success notification: "Enrollment request approved successfully"
- ✅ Modal closes
- ✅ Request moves to "Approved" tab
- ✅ Auto-refresh updates list (every 10 seconds)

**Student Verification**:
1. Go to Student Dashboard
2. Check "My Enrollment Requests" tab
3. Request status should show "APPROVED" (green badge)
4. Success notification should have been received

---

### Phase 6: Parent Sees Enrolled Subject

**Steps**:
1. Login as Parent (parent@yeneta.com / parent123)
2. Navigate to Parent Dashboard
3. Click on "Enrolled Subjects" tab
4. Verify family is auto-selected
5. Verify student is auto-selected
6. Verify Mathematics subject appears in the list

**Expected Results**:
- ✅ Family selector shows available families
- ✅ Student selector shows students in selected family
- ✅ Enrolled subjects card displays:
  - Subject: "Mathematics"
  - Grade: "Grade 10"
  - Teacher: "Teacher Name" (@teacher username)
  - Enrolled Date: Current date
  - Status: "Enrolled" (green badge)
- ✅ Auto-refresh toggle visible and enabled
- ✅ List updates automatically (every 20 seconds)

---

## Testing Auto-Refresh Functionality

### Test 1: Auto-Refresh Toggle

**Steps**:
1. On any dashboard with auto-refresh (e.g., Course Request Manager)
2. Click the auto-refresh toggle button (green ⟳ or gray ⊘)
3. Observe the button color changes
4. Wait for the refresh interval to pass
5. Verify data updates when enabled, doesn't update when disabled

**Expected Results**:
- ✅ Toggle button changes color (green when enabled, gray when disabled)
- ✅ Data refreshes automatically when enabled
- ✅ Data doesn't refresh when disabled
- ✅ Manual refresh still works regardless of toggle state

### Test 2: Manual Refresh

**Steps**:
1. On any dashboard
2. Click the manual refresh button (↻)
3. Observe loading state
4. Verify data updates

**Expected Results**:
- ✅ Button shows loading state
- ✅ Data refreshes immediately
- ✅ Loading state clears after refresh

### Test 3: Event-Driven Updates

**Steps**:
1. Open two browser windows side by side
2. Window 1: Admin Dashboard - Course Approval Manager
3. Window 2: Teacher Dashboard - Course Request Manager
4. In Window 1: Approve a pending course request
5. In Window 2: Observe the status change in real-time

**Expected Results**:
- ✅ Status updates in Window 2 within 100ms
- ✅ No manual refresh needed
- ✅ Notification appears in Window 2

---

## Testing Notifications

### Test 1: Success Notifications

**Steps**:
1. Perform any successful action (submit request, approve, etc.)
2. Observe notification appears

**Expected Results**:
- ✅ Green notification appears at top
- ✅ Shows success icon
- ✅ Displays clear message
- ✅ Auto-dismisses after 5 seconds

### Test 2: Error Notifications

**Steps**:
1. Try to submit a form with missing required fields
2. Or simulate network error
3. Observe notification appears

**Expected Results**:
- ✅ Red notification appears at top
- ✅ Shows error icon
- ✅ Displays error message
- ✅ Auto-dismisses after 5 seconds

### Test 3: Info Notifications

**Steps**:
1. Admin approves a course request
2. Teacher receives notification

**Expected Results**:
- ✅ Blue notification appears
- ✅ Shows info icon
- ✅ Displays informational message

---

## Testing Dark Mode

**Steps**:
1. On any page, toggle dark mode (usually in header)
2. Verify all components display correctly in dark mode

**Expected Results**:
- ✅ All text is readable
- ✅ Buttons are visible
- ✅ Form inputs are visible
- ✅ Notifications display correctly
- ✅ Status badges are visible

---

## Testing Responsive Design

**Steps**:
1. Open browser developer tools (F12)
2. Toggle device toolbar
3. Test on different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)
4. Verify layout adapts correctly

**Expected Results**:
- ✅ Mobile: Single column layout, touch-friendly buttons
- ✅ Tablet: Two column layout where appropriate
- ✅ Desktop: Full layout with all features visible
- ✅ No horizontal scrolling
- ✅ All buttons are clickable

---

## Testing Accessibility

**Steps**:
1. Use keyboard navigation (Tab key)
2. Verify all buttons and inputs are reachable
3. Use screen reader (if available)
4. Verify all elements have proper labels

**Expected Results**:
- ✅ All interactive elements are keyboard accessible
- ✅ Focus indicators are visible
- ✅ Screen reader announces elements correctly
- ✅ Form labels are associated with inputs

---

## Performance Testing

### Test 1: Page Load Time

**Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Observe load time

**Expected Results**:
- ✅ Initial load: < 3 seconds
- ✅ Data fetch: < 1 second
- ✅ No console errors

### Test 2: Interaction Response

**Steps**:
1. Click buttons and observe response time
2. Submit forms and observe response time

**Expected Results**:
- ✅ Button click feedback: Instant
- ✅ Form submission: < 1 second
- ✅ Data updates: < 500ms

### Test 3: Memory Usage

**Steps**:
1. Open DevTools (F12)
2. Go to Memory tab
3. Take heap snapshot
4. Perform actions for 5 minutes
5. Take another heap snapshot
6. Compare memory usage

**Expected Results**:
- ✅ No significant memory increase
- ✅ No memory leaks
- ✅ Subscriptions properly cleaned up

---

## Troubleshooting

### Issue: Notifications not appearing
**Solution**:
- Verify NotificationProvider is in App.tsx
- Verify NotificationDisplay is in App.tsx
- Check browser console for errors

### Issue: Auto-refresh not working
**Solution**:
- Verify useAutoRefresh hook is imported
- Check browser console for errors
- Verify API endpoints are responding

### Issue: Events not triggering updates
**Solution**:
- Verify eventService is imported correctly
- Check browser console for event emissions
- Verify event listeners are subscribed

### Issue: Styles not applying
**Solution**:
- Verify Tailwind CSS is configured
- Check browser DevTools for CSS errors
- Verify dark mode classes are applied

---

## Test Results Checklist

- [ ] Course request submission works
- [ ] Admin receives notification
- [ ] Admin can approve/decline/review requests
- [ ] Teacher receives status updates
- [ ] Student sees available courses
- [ ] Student can request enrollment
- [ ] Teacher receives enrollment requests
- [ ] Teacher can approve/decline/review enrollments
- [ ] Student receives status updates
- [ ] Parent sees enrolled subjects
- [ ] Auto-refresh works correctly
- [ ] Manual refresh works correctly
- [ ] Event-driven updates work
- [ ] Notifications display correctly
- [ ] Dark mode works
- [ ] Responsive design works
- [ ] Accessibility features work
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] No memory leaks

---

## Final Verification

Once all tests pass:

1. ✅ All components compile without errors
2. ✅ All API endpoints respond correctly
3. ✅ All notifications display
4. ✅ All real-time updates work
5. ✅ All user interactions work smoothly
6. ✅ Performance is acceptable
7. ✅ Accessibility is compliant
8. ✅ Dark mode works correctly
9. ✅ Responsive design works
10. ✅ No console errors or warnings

**Status**: 🎉 READY FOR PRODUCTION 🎉

---

**Last Updated**: November 15, 2025
**Version**: 1.0
