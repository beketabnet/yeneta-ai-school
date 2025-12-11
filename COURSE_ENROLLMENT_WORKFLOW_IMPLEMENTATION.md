# Complete Course Approval and Enrollment Workflow Implementation

## Overview
This document describes the complete implementation of the course approval and enrollment workflow for Yeneta AI School platform. The workflow enables teachers to request courses, administrators to approve them, students to enroll in approved courses, and parents to view enrolled subjects.

## Architecture

### Backend Components

#### 1. Models (Already Existing)
- **TeacherCourseRequest**: Stores teacher requests to teach specific subjects
  - Fields: teacher, subject, grade_level, stream, status, requested_at, reviewed_at, reviewed_by, review_notes
  - Statuses: pending, approved, declined, under_review

- **StudentEnrollmentRequest**: Stores student enrollment requests for approved courses
  - Fields: student, teacher, family, subject, grade_level, stream, status, requested_at, reviewed_at, reviewed_by, review_notes
  - Statuses: pending, approved, declined, under_review

#### 2. New API Endpoints

**File**: `yeneta_backend/academics/urls.py`

```
GET  /academics/my-enrollment-requests/
     - Returns enrollment requests for current student
     - Requires: Student role

GET  /academics/parent-enrolled-subjects/
     - Returns approved enrollment requests grouped by family and student
     - Requires: Parent role
```

**File**: `yeneta_backend/academics/views.py`

New view functions:
- `my_enrollment_requests_view()`: Get student's enrollment requests
- `parent_enrolled_subjects_view()`: Get parent's family enrolled subjects

#### 3. Enhanced Endpoints

**TeacherCourseRequestViewSet**:
- `POST /academics/teacher-course-requests/` - Create course request
- `GET /academics/teacher-course-requests/` - List requests (filtered by role)
- `POST /academics/teacher-course-requests/{id}/approve/` - Admin approves
- `POST /academics/teacher-course-requests/{id}/decline/` - Admin declines
- `POST /academics/teacher-course-requests/{id}/under_review/` - Admin sets under review

**StudentEnrollmentRequestViewSet**:
- `POST /academics/student-enrollment-requests/` - Student creates enrollment request
- `GET /academics/student-enrollment-requests/` - List requests (filtered by role)
- `POST /academics/student-enrollment-requests/{id}/approve/` - Teacher approves
- `POST /academics/student-enrollment-requests/{id}/decline/` - Teacher declines
- `POST /academics/student-enrollment-requests/{id}/under_review/` - Teacher sets under review

#### 4. Notifications System

All actions trigger notifications:

**Teacher Course Request**:
- New request → Admin notification
- Approved → Teacher notification
- Declined → Teacher notification
- Under Review → Teacher notification

**Student Enrollment Request**:
- New request → Teacher notification
- Approved → Student, Parent, Admin notifications
- Declined → Student notification
- Under Review → Student notification

### Frontend Components

#### 1. Student Dashboard Components

**File**: `components/student/AvailableCourses.tsx`
- Displays approved teacher courses
- Family selector for enrollment
- Request enrollment button
- Shows enrollment request status
- Auto-refresh every 15 seconds
- Real-time notifications

**File**: `components/student/StudentEnrollmentManager.tsx`
- Lists all student's enrollment requests
- Filter by status (all, pending, approved, declined, under_review)
- Shows teacher information
- Displays review notes
- Auto-refresh every 15 seconds

#### 2. Teacher Dashboard Components

**File**: `components/teacher/CourseRequestManager.tsx` (Enhanced)
- Submit new course requests
- View all course requests
- Filter by status
- Shows approval status and review notes
- Auto-refresh capability

**File**: `components/teacher/TeacherEnrollmentApproval.tsx` (Enhanced)
- Lists enrollment requests from students
- Filter by status
- Approve/Decline/Under Review actions
- Add review notes
- Real-time notifications
- Auto-refresh every 10 seconds

#### 3. Admin Dashboard Components

**File**: `components/admin/AdminCourseApprovalManager.tsx` (Enhanced)
- Lists all teacher course requests
- Filter by status
- Approve/Decline/Under Review actions
- Add review notes
- Real-time notifications
- Auto-refresh every 10 seconds

#### 4. Parent Dashboard Components

**File**: `components/parent/ParentEnrolledSubjects.tsx`
- Family selector
- Student selector within family
- Lists enrolled subjects for selected student
- Shows teacher information
- Shows enrollment date
- Auto-refresh every 20 seconds

#### 5. Dashboard Integration

**StudentDashboard.tsx**:
- Added "Available Courses" tab
- Added "My Enrollments" tab
- Maintains existing tabs

**TeacherDashboard.tsx**:
- Already has "Course Requests" tab
- Already has "Enrollment Approval" tab

**ParentDashboard.tsx**:
- Added "Enrolled Subjects" tab
- Maintains existing tabs

**AdminDashboard.tsx**:
- Already has "Course Approval Manager" component

### Reusable Components

**File**: `components/student/FamilySelector.tsx`
- Reusable family selector component
- Search functionality
- Used in AvailableCourses and StudentEnrollmentManager

## Workflow Process

### Step 1: Teacher Submits Course Request
1. Teacher navigates to "Course Requests" tab in Teacher Dashboard
2. Clicks "Request Course" button
3. Selects Grade Level, Stream (if applicable), and Subject
4. Submits request
5. **Notification**: Admin receives notification about new course request

### Step 2: Administrator Reviews and Approves
1. Admin navigates to "Course Approval Manager" in Admin Dashboard
2. Sees pending course requests
3. Selects a request to review
4. Can add review notes
5. Clicks "Approve", "Decline", or "Under Review"
6. **Notification**: Teacher receives notification about decision

### Step 3: Student Views Available Courses
1. Student navigates to "Available Courses" tab in Student Dashboard
2. Sees all approved teacher courses
3. Selects a family from the family dropdown
4. Clicks "Request" button on desired course
5. **Notification**: Teacher receives notification about enrollment request

### Step 4: Teacher Reviews Enrollment Request
1. Teacher navigates to "Enrollment Approval" tab in Teacher Dashboard
2. Sees pending enrollment requests from students
3. Selects a request to review
4. Can add review notes
5. Clicks "Approve", "Decline", or "Under Review"
6. **Notifications**:
   - Student receives notification
   - Parent receives notification
   - Admin receives notification

### Step 5: Student Views Enrollment Status
1. Student navigates to "My Enrollments" tab in Student Dashboard
2. Sees all enrollment requests with current status
3. Can filter by status
4. Sees review notes if any

### Step 6: Parent Views Enrolled Subjects
1. Parent navigates to "Enrolled Subjects" tab in Parent Dashboard
2. Selects a family
3. Selects a student within that family
4. Views all subjects the student is enrolled in
5. Sees teacher information for each subject

## Testing

### Management Command

**File**: `yeneta_backend/academics/management/commands/test_course_workflow.py`

Run the complete workflow test:
```bash
python manage.py test_course_workflow
```

This command:
1. Creates a course request from a teacher
2. Approves it as an admin
3. Creates an enrollment request from a student
4. Approves it as a teacher
5. Generates all necessary notifications
6. Displays a summary of the workflow

## Key Features

### 1. Dynamic Data Updates
- All components auto-refresh at regular intervals
- Manual refresh buttons available
- Real-time status changes reflected immediately

### 2. Comprehensive Notifications
- Toast notifications in UI
- Database notifications for persistence
- Notifications for all stakeholders (Teacher, Student, Parent, Admin)

### 3. Role-Based Access Control
- Teachers can only see their own requests
- Students can only see their own requests
- Parents can only see their family's requests
- Admins can see all requests

### 4. Status Tracking
- Pending: Awaiting review
- Approved: Request accepted
- Declined: Request rejected
- Under Review: Being reviewed

### 5. Review Notes
- Optional notes can be added when approving/declining/setting under review
- Notes are displayed to relevant users
- Helps with communication and transparency

### 6. Family Integration
- Students select family when requesting enrollment
- Parents can view all family members' enrollments
- Enables multi-child family management

## API Response Examples

### Get Available Courses
```json
GET /academics/approved-teacher-courses/

[
  {
    "id": 1,
    "teacher": {
      "id": 2,
      "first_name": "John",
      "last_name": "Doe",
      "username": "john_doe"
    },
    "subject": "Mathematics",
    "grade_level": "10",
    "stream": null
  }
]
```

### Get My Enrollment Requests
```json
GET /academics/my-enrollment-requests/

[
  {
    "id": 1,
    "student": {
      "id": 3,
      "username": "student1",
      "first_name": "Alice",
      "last_name": "Smith"
    },
    "teacher": 2,
    "teacher_detail": {
      "id": 2,
      "first_name": "John",
      "last_name": "Doe"
    },
    "subject": "Mathematics",
    "grade_level": "10",
    "stream": null,
    "status": "pending",
    "requested_at": "2024-01-15T10:00:00Z",
    "reviewed_at": null,
    "reviewed_by": null,
    "review_notes": "",
    "family": 1
  }
]
```

### Get Parent Enrolled Subjects
```json
GET /academics/parent-enrolled-subjects/

[
  {
    "family_id": 1,
    "family_name": "Smith Family",
    "students": [
      {
        "student_id": 3,
        "student_name": "Alice Smith",
        "subjects": [
          {
            "id": 1,
            "subject": "Mathematics",
            "grade_level": "10",
            "stream": null,
            "teacher": {
              "id": 2,
              "first_name": "John",
              "last_name": "Doe",
              "username": "john_doe"
            },
            "enrolled_date": "2024-01-15T10:00:00Z"
          }
        ]
      }
    ]
  }
]
```

## Database Queries

### Get Pending Course Requests (Admin)
```python
TeacherCourseRequest.objects.filter(status='pending').select_related('teacher')
```

### Get Approved Courses (Student)
```python
TeacherCourseRequest.objects.filter(status='approved')
```

### Get Enrollment Requests for Teacher
```python
StudentEnrollmentRequest.objects.filter(teacher=teacher_user).select_related('student', 'family')
```

### Get Approved Enrollments for Family
```python
StudentEnrollmentRequest.objects.filter(family=family, status='approved').select_related('student', 'teacher')
```

## Error Handling

### Validation
- Grade level and subject are required
- Stream is required for grades 11-12
- Family must be selected before enrollment request
- Duplicate requests are prevented by unique_together constraint

### Permissions
- Only teachers can create course requests
- Only admins can approve/decline course requests
- Only teachers can approve/decline enrollment requests
- Only students can create enrollment requests
- Only parents can view family enrolled subjects

### Notifications
- Graceful handling if notification creation fails
- Notifications don't block main operations
- Errors are logged but don't prevent workflow completion

## Performance Considerations

### Database Optimization
- Use `select_related()` for foreign keys
- Use `prefetch_related()` for reverse relations
- Index on status fields for filtering

### Frontend Optimization
- Auto-refresh intervals are configurable
- Manual refresh available to avoid unnecessary API calls
- Pagination can be added for large result sets

### Caching
- Consider caching approved courses list
- Cache family membership data
- Invalidate cache on status changes

## Security Considerations

### Authentication
- All endpoints require authentication
- JWT tokens used for API authentication

### Authorization
- Role-based access control enforced
- Users can only see their own data
- Admins have full access

### Data Validation
- Input validation on all endpoints
- SQL injection prevention via ORM
- CSRF protection on state-changing operations

## Future Enhancements

1. **Bulk Operations**: Allow admins to approve/decline multiple requests at once
2. **Scheduling**: Set course availability dates
3. **Capacity Limits**: Limit students per course
4. **Waitlist**: Queue students if course is full
5. **Prerequisites**: Require completion of previous courses
6. **Grading Integration**: Link enrollments to gradebook
7. **Reporting**: Generate enrollment reports
8. **Audit Trail**: Track all approval decisions
9. **Email Notifications**: Send emails in addition to in-app notifications
10. **Mobile App**: Mobile-friendly interface for all workflows

## Troubleshooting

### Issue: Notifications not appearing
- Check if Notification model is properly imported
- Verify recipient user exists and is active
- Check browser console for JavaScript errors

### Issue: Auto-refresh not working
- Verify API endpoint is accessible
- Check network tab in browser dev tools
- Ensure authentication token is valid

### Issue: Family selector showing no families
- Verify FamilyMembership records exist
- Check that user is part of a family
- Verify family is marked as active

### Issue: Course requests not appearing
- Verify teacher role is set correctly
- Check if requests are in pending status
- Verify admin is viewing correct filter

## Deployment Checklist

- [ ] Run database migrations: `python manage.py migrate`
- [ ] Test management command: `python manage.py test_course_workflow`
- [ ] Verify all API endpoints are accessible
- [ ] Test complete workflow end-to-end
- [ ] Check notifications are being created
- [ ] Verify auto-refresh is working
- [ ] Test with different user roles
- [ ] Check error handling
- [ ] Verify permissions are enforced
- [ ] Load test with multiple concurrent users

## Support

For issues or questions about this implementation, refer to:
- Backend API documentation
- Frontend component documentation
- Database schema documentation
- Test management command output
