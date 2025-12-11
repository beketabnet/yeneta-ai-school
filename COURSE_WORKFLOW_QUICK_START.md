# Course Approval & Enrollment Workflow - Quick Start Guide

## Prerequisites

- Backend server running: `python manage.py runserver`
- Frontend server running: `npm start` or `npm run dev`
- Test users created (see backend setup)

## Test Users

```
Admin:    admin@yeneta.com / admin123
Teacher:  teacher@yeneta.com / teacher123
Student:  student@yeneta.com / student123
Parent:   parent@yeneta.com / parent123
```

## Quick Setup

### 1. Run Database Migrations
```bash
cd yeneta_backend
python manage.py migrate
```

### 2. Create Test Data
```bash
python manage.py test_course_workflow
```

This command will:
- Create a course request from teacher
- Approve it as admin
- Create an enrollment request from student
- Approve it as teacher
- Generate all notifications
- Display a summary

## Manual Workflow Testing

### Step 1: Teacher Submits Course Request

1. **Login as Teacher**
   - Email: `teacher@yeneta.com`
   - Password: `teacher123`

2. **Navigate to Teacher Dashboard**
   - Click on "Course Requests" tab

3. **Submit Course Request**
   - Click "Request Course" button
   - Select Grade Level: `10`
   - Select Subject: `Mathematics`
   - Click "Submit Request"
   - ✅ Should see success notification

### Step 2: Admin Approves Course Request

1. **Login as Admin**
   - Email: `admin@yeneta.com`
   - Password: `admin123`

2. **Navigate to Admin Dashboard**
   - Click on "Course Approval Manager"

3. **Review and Approve**
   - Filter by "Pending" status
   - Click on the Mathematics course request
   - Add review notes (optional): "Approved for teaching"
   - Click "Approve" button
   - ✅ Should see success notification

4. **Verify Notification**
   - Teacher should receive notification about approval
   - Check notification system

### Step 3: Student Views Available Courses

1. **Login as Student**
   - Email: `student@yeneta.com`
   - Password: `student123`

2. **Navigate to Student Dashboard**
   - Click on "Available Courses" tab

3. **Select Family and Request Enrollment**
   - Select a family from dropdown (or create one)
   - Should see "Mathematics - Grade 10" course
   - Click "Request" button
   - ✅ Should see success notification

### Step 4: Teacher Approves Enrollment

1. **Login as Teacher**
   - Email: `teacher@yeneta.com`
   - Password: `teacher123`

2. **Navigate to Teacher Dashboard**
   - Click on "Enrollment Approval" tab

3. **Review and Approve**
   - Filter by "Pending" status
   - Click on the enrollment request from student
   - Add review notes (optional): "Approved for enrollment"
   - Click "Approve" button
   - ✅ Should see success notification

4. **Verify Notifications**
   - Student should receive approval notification
   - Parent should receive enrollment notification
   - Admin should receive enrollment notification

### Step 5: Student Views Enrollment Status

1. **Login as Student**
   - Email: `student@yeneta.com`
   - Password: `student123`

2. **Navigate to Student Dashboard**
   - Click on "My Enrollments" tab

3. **Verify Enrollment**
   - Should see Mathematics course with "Approved" status
   - Should see teacher name and date

### Step 6: Parent Views Enrolled Subjects

1. **Login as Parent**
   - Email: `parent@yeneta.com`
   - Password: `parent123`

2. **Navigate to Parent Dashboard**
   - Click on "Enrolled Subjects" tab

3. **Select Family and Student**
   - Select family from dropdown
   - Select student from dropdown
   - Should see Mathematics course listed
   - Should see teacher information

## Testing Different Scenarios

### Scenario 1: Decline Course Request

1. As Admin, select a course request
2. Click "Decline" button
3. Add notes: "Not qualified for this subject"
4. Teacher should receive decline notification

### Scenario 2: Set Under Review

1. As Admin, select a course request
2. Click "Under Review" button
3. Add notes: "Checking qualifications"
4. Teacher should receive under review notification

### Scenario 3: Decline Enrollment

1. As Teacher, select an enrollment request
2. Click "Decline" button
3. Add notes: "Class is full"
4. Student should receive decline notification

### Scenario 4: Multiple Families

1. Create multiple families in database
2. Add student to multiple families
3. Request enrollment with different families
4. Parent should see all family enrollments

## Verification Checklist

### Backend Verification

- [ ] Course request created in database
- [ ] Enrollment request created in database
- [ ] Notifications created for all stakeholders
- [ ] Status changes reflected in database
- [ ] No errors in Django console

### Frontend Verification

- [ ] Course request form validates input
- [ ] Success notifications appear
- [ ] Auto-refresh updates data
- [ ] Manual refresh works
- [ ] Filter buttons work correctly
- [ ] Status badges display correctly
- [ ] Teacher information displays correctly

### API Verification

Test endpoints using curl or Postman:

```bash
# Get available courses
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/academics/approved-teacher-courses/

# Get my enrollment requests
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/academics/my-enrollment-requests/

# Get parent enrolled subjects
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/academics/parent-enrolled-subjects/

# Create course request
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Mathematics","grade_level":"10"}' \
  http://localhost:8000/api/academics/teacher-course-requests/

# Approve course request
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"review_notes":"Approved"}' \
  http://localhost:8000/api/academics/teacher-course-requests/1/approve/
```

## Troubleshooting

### Issue: "No families found"
**Solution**: Create a family and add student as member
```bash
python manage.py shell
from users.models import Family, FamilyMembership, User
family = Family.objects.create(name="Test Family")
student = User.objects.get(username="student@yeneta.com")
FamilyMembership.objects.create(family=family, user=student, role="Student")
```

### Issue: "No approved courses available"
**Solution**: Make sure course request is approved
- Login as Admin
- Go to Course Approval Manager
- Approve pending course requests

### Issue: Notifications not showing
**Solution**: Check browser console for errors
- Open Developer Tools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for API errors

### Issue: Auto-refresh not working
**Solution**: Check network connectivity
- Verify backend server is running
- Check if API endpoints are accessible
- Look for CORS errors in console

### Issue: "Only the assigned teacher can approve"
**Solution**: Make sure you're logged in as the correct teacher
- Verify teacher email matches the course request teacher
- Try logging out and back in

## Performance Tips

1. **Reduce Auto-Refresh Interval**
   - For testing, you can reduce the 10-15 second intervals
   - Edit component files to change interval

2. **Use Manual Refresh**
   - Click "Refresh" button instead of waiting for auto-refresh
   - Faster for testing

3. **Clear Browser Cache**
   - If seeing stale data, clear cache
   - Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)

## Next Steps

After successful testing:

1. **Customize for Your School**
   - Add your school's subjects
   - Configure grade levels
   - Set up streams

2. **Integrate with Existing Features**
   - Link to gradebook
   - Connect to assignments
   - Integrate with communication system

3. **Deploy to Production**
   - Follow deployment checklist in main documentation
   - Set up monitoring and alerts
   - Configure email notifications

4. **Train Users**
   - Create user guides for each role
   - Conduct training sessions
   - Set up support system

## Support Resources

- **Main Documentation**: `COURSE_ENROLLMENT_WORKFLOW_IMPLEMENTATION.md`
- **Backend API**: `yeneta_backend/academics/views.py`
- **Frontend Components**: `components/student/`, `components/teacher/`, `components/admin/`, `components/parent/`
- **Database Models**: `yeneta_backend/academics/models.py`
- **Management Command**: `yeneta_backend/academics/management/commands/test_course_workflow.py`

## Common Commands

```bash
# Run test workflow
python manage.py test_course_workflow

# Create superuser
python manage.py createsuperuser

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver

# Access Django admin
http://localhost:8000/admin/

# Access API
http://localhost:8000/api/

# Access frontend
http://localhost:3000/
```

## Useful Django Shell Commands

```python
python manage.py shell

# View all course requests
from academics.models import TeacherCourseRequest
TeacherCourseRequest.objects.all()

# View all enrollment requests
from academics.models import StudentEnrollmentRequest
StudentEnrollmentRequest.objects.all()

# View notifications
from communications.models import Notification
Notification.objects.all()

# Filter by status
TeacherCourseRequest.objects.filter(status='pending')

# Delete test data
TeacherCourseRequest.objects.all().delete()
StudentEnrollmentRequest.objects.all().delete()
```

## Success Indicators

✅ **Workflow Complete When**:
- [ ] Teacher can submit course request
- [ ] Admin can approve/decline/review course request
- [ ] Teacher receives notifications
- [ ] Student can see available courses
- [ ] Student can request enrollment
- [ ] Teacher can approve/decline/review enrollment
- [ ] Student receives notifications
- [ ] Parent receives notifications
- [ ] Admin receives notifications
- [ ] Parent can view enrolled subjects
- [ ] All data persists in database
- [ ] Auto-refresh works correctly
- [ ] Manual refresh works correctly
- [ ] Filters work correctly
- [ ] No console errors

## Estimated Time

- Setup: 5 minutes
- Manual workflow test: 10-15 minutes
- Scenario testing: 10-15 minutes
- Verification: 5-10 minutes
- **Total: 30-45 minutes**

Enjoy testing the course approval and enrollment workflow! 🎉
