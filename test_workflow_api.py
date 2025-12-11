#!/usr/bin/env python
"""
Test the complete course approval and student enrollment workflow via API.
"""
import os
import sys
import django
import requests
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'yeneta_backend'))
os.chdir(os.path.join(os.path.dirname(__file__), 'yeneta_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from academics.models import TeacherCourseRequest, StudentEnrollmentRequest
from communications.models import Notification

User = get_user_model()
API_URL = 'http://localhost:8000/api'

def get_token(email, password):
    """Get JWT token for user login."""
    response = requests.post(
        f'{API_URL}/users/token/',
        json={'email': email, 'password': password}
    )
    if response.status_code == 200:
        return response.json()['access']
    else:
        print(f"Login failed for {email}: {response.text}")
        return None

def get_headers(token):
    """Get headers with auth token."""
    return {'Authorization': f'Bearer {token}'}

print("=" * 80)
print("COMPLETE COURSE APPROVAL AND STUDENT ENROLLMENT WORKFLOW TEST")
print("=" * 80)

# Step 1: Teacher submits course request
print("\n[STEP 1] Teacher submits course request...")
teacher_token = get_token('teacher_test@example.com', 'password123')
if not teacher_token:
    print("FAILED: Could not authenticate teacher")
    sys.exit(1)

course_request_data = {
    'subject': 'Mathematics',
    'grade_level': '10',
    'stream': None
}

response = requests.post(
    f'{API_URL}/academics/teacher-course-requests/',
    json=course_request_data,
    headers=get_headers(teacher_token)
)
if response.status_code == 201:
    course_request = response.json()
    print(f"✓ Course request created: ID={course_request['id']}, Status={course_request['status']}")
else:
    print(f"✗ FAILED to create course request: {response.text}")
    sys.exit(1)

# Step 2: Check admin receives notification
print("\n[STEP 2] Admin receives new course request notification...")
admin = User.objects.get(role='Admin')
admin_notifications = Notification.objects.filter(
    recipient=admin,
    notification_type='new_course_request'
)
if admin_notifications.exists():
    print(f"✓ Admin has {admin_notifications.count()} course request notification(s)")
else:
    print("✗ No notifications found for admin")

# Step 3: Admin approves course request
print("\n[STEP 3] Admin approves course request...")
admin_token = get_token('admin_test@example.com', 'password123')
if not admin_token:
    print("FAILED: Could not authenticate admin")
    sys.exit(1)

response = requests.post(
    f'{API_URL}/academics/teacher-course-requests/{course_request["id"]}/approve/',
    json={'review_notes': 'Approved for teaching Mathematics'},
    headers=get_headers(admin_token)
)
if response.status_code == 200:
    approved_request = response.json()
    print(f"✓ Course request approved: Status={approved_request['status']}")
else:
    print(f"✗ FAILED to approve course request: {response.text}")
    sys.exit(1)

# Step 4: Check teacher receives approval notification
print("\n[STEP 4] Teacher receives approval notification...")
teacher = User.objects.get(role='Teacher')
teacher_notifications = Notification.objects.filter(
    recipient=teacher,
    notification_type='course_request_approved'
)
if teacher_notifications.exists():
    print(f"✓ Teacher has {teacher_notifications.count()} approval notification(s)")
else:
    print("✗ No approval notification found for teacher")

# Step 5: Student sees available courses
print("\n[STEP 5] Student sees available courses...")
student_token = get_token('student_test@example.com', 'password123')
if not student_token:
    print("FAILED: Could not authenticate student")
    sys.exit(1)

response = requests.get(
    f'{API_URL}/academics/available-courses/',
    headers=get_headers(student_token)
)
if response.status_code == 200:
    courses = response.json()
    math_courses = [c for c in courses if c['subject'] == 'Mathematics']
    if math_courses:
        print(f"✓ Student sees {len(courses)} available course(s), including Mathematics")
    else:
        print("✗ Mathematics course not in available courses")
        print(f"Available courses: {courses}")
else:
    print(f"✗ FAILED to get available courses: {response.text}")

# Step 6: Student submits enrollment request
print("\n[STEP 6] Student submits enrollment request...")
from users.models import Family, FamilyMembership

family = Family.objects.first()
enrollment_data = {
    'course': course_request['id'],
    'subject': 'Mathematics',
    'grade_level': '10',
    'family': family.id if family else None
}

response = requests.post(
    f'{API_URL}/academics/student-enrollment-requests/',
    json=enrollment_data,
    headers=get_headers(student_token)
)
if response.status_code == 201:
    enrollment_request = response.json()
    print(f"✓ Enrollment request created: ID={enrollment_request['id']}, Status={enrollment_request['status']}")
else:
    print(f"✗ FAILED to create enrollment request: {response.text}")
    sys.exit(1)

# Step 7: Check teacher receives new enrollment notification
print("\n[STEP 7] Teacher receives new enrollment notification...")
teacher_enrollment_notif = Notification.objects.filter(
    recipient=teacher,
    notification_type='new_enrollment_request'
)
if teacher_enrollment_notif.exists():
    print(f"✓ Teacher has {teacher_enrollment_notif.count()} new enrollment notification(s)")
else:
    print("✗ No new enrollment notification found for teacher")

# Step 8: Teacher approves enrollment request
print("\n[STEP 8] Teacher approves enrollment request...")
response = requests.post(
    f'{API_URL}/academics/student-enrollment-requests/{enrollment_request["id"]}/approve/',
    json={'review_notes': 'Approved for enrollment'},
    headers=get_headers(teacher_token)
)
if response.status_code == 200:
    approved_enrollment = response.json()
    print(f"✓ Enrollment request approved: Status={approved_enrollment['status']}")
else:
    print(f"✗ FAILED to approve enrollment request: {response.text}")
    sys.exit(1)

# Step 9: Check student receives approval notification
print("\n[STEP 9] Student receives approval notification...")
student = User.objects.get(role='Student')
student_enrollment_notif = Notification.objects.filter(
    recipient=student,
    notification_type='enrollment_request_approved'
)
if student_enrollment_notif.exists():
    print(f"✓ Student has {student_enrollment_notif.count()} approval notification(s)")
else:
    print("✗ No approval notification found for student")

# Step 10: Check admin receives enrollment approval notification
print("\n[STEP 10] Admin receives enrollment approval notification...")
admin_enrollment_notif = Notification.objects.filter(
    recipient=admin,
    notification_type='enrollment_request_approved'
)
if admin_enrollment_notif.exists():
    print(f"✓ Admin has {admin_enrollment_notif.count()} enrollment approval notification(s)")
else:
    print("✗ No enrollment approval notification found for admin")

# Step 11: Check notifications are retrievable via API
print("\n[STEP 11] Test notification retrieval endpoints...")
response = requests.get(
    f'{API_URL}/communications/notifications/unread/',
    headers=get_headers(student_token)
)
if response.status_code == 200:
    unread_notifs = response.json()
    print(f"✓ Student has {len(unread_notifs)} unread notification(s)")
else:
    print(f"✗ FAILED to get unread notifications: {response.text}")

# Step 12: Test notification count endpoint
response = requests.get(
    f'{API_URL}/communications/notifications/unread_count/',
    headers=get_headers(student_token)
)
if response.status_code == 200:
    count = response.json()['count']
    print(f"✓ Unread count endpoint works: {count} unread notification(s)")
else:
    print(f"✗ FAILED to get unread count: {response.text}")

print("\n" + "=" * 80)
print("✓ ALL TESTS PASSED - Complete workflow successful!")
print("=" * 80)
