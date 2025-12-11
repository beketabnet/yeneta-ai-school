#!/usr/bin/env python
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from academics.models import (
    Course, TeacherCourseRequest, StudentEnrollmentRequest, StudentGrade
)
from users.models import Family, FamilyMembership

User = get_user_model()

# Get test users
teacher1 = User.objects.get(email='teacher@yeneta.com')
teacher2 = User.objects.get(email='newteacher@yeneta.com')
student1 = User.objects.get(email='student@yeneta.com')
student2 = User.objects.get(email='student2@yeneta.com')
admin = User.objects.get(email='admin@yeneta.com')
parent = User.objects.get(email='parent@yeneta.com')

# Create or get family
family, _ = Family.objects.get_or_create(
    name='Test Family'
)

# Add parent and students to family
FamilyMembership.objects.get_or_create(
    family=family,
    user=parent,
    defaults={'role': 'Parent/Guardian'}
)
FamilyMembership.objects.get_or_create(
    family=family,
    user=student1,
    defaults={'role': 'Student'}
)
FamilyMembership.objects.get_or_create(
    family=family,
    user=student2,
    defaults={'role': 'Student'}
)

# Create courses
courses_data = [
    {'title': 'Mathematics 101', 'subject': 'Mathematics', 'description': 'Basic Mathematics'},
    {'title': 'English Literature', 'subject': 'English', 'description': 'English Literature Basics'},
    {'title': 'Physics 101', 'subject': 'Physics', 'description': 'Introduction to Physics'},
    {'title': 'Chemistry 101', 'subject': 'Chemistry', 'description': 'Basic Chemistry'},
    {'title': 'History 101', 'subject': 'History', 'description': 'World History'},
]

courses = []
for course_data in courses_data:
    course, _ = Course.objects.get_or_create(
        title=course_data['title'],
        teacher=teacher1,
        defaults={
            'subject': course_data['subject'],
            'description': course_data['description'],
            'grade_level': '10'
        }
    )
    courses.append(course)

print(f"✓ Created {len(courses)} courses")

# Create teacher course requests with different statuses
teacher_requests = [
    {'teacher': teacher1, 'subject': 'Mathematics', 'status': 'approved'},
    {'teacher': teacher1, 'subject': 'English', 'status': 'pending'},
    {'teacher': teacher1, 'subject': 'Physics', 'status': 'under_review'},
    {'teacher': teacher2, 'subject': 'Mathematics', 'status': 'approved'},
    {'teacher': teacher2, 'subject': 'Chemistry', 'status': 'approved'},
    {'teacher': teacher2, 'subject': 'History', 'status': 'declined'},
]

tcr_count = 0
for req_data in teacher_requests:
    tcr, created = TeacherCourseRequest.objects.get_or_create(
        teacher=req_data['teacher'],
        subject=req_data['subject'],
        grade_level='10',
        stream='A',
        defaults={
            'status': req_data['status'],
            'requested_at': datetime.now() - timedelta(days=5),
            'reviewed_by': admin if req_data['status'] != 'pending' else None,
            'reviewed_at': datetime.now() - timedelta(days=3) if req_data['status'] != 'pending' else None,
        }
    )
    if created:
        tcr.status = req_data['status']
        tcr.save()
        tcr_count += 1

print(f"✓ Created {tcr_count} teacher course requests")

# Create student enrollment requests with different statuses
student_requests = [
    {'student': student1, 'teacher': teacher1, 'subject': 'Mathematics', 'status': 'approved'},
    {'student': student1, 'teacher': teacher1, 'subject': 'English', 'status': 'pending'},
    {'student': student1, 'teacher': teacher1, 'subject': 'Physics', 'status': 'under_review'},
    {'student': student2, 'teacher': teacher1, 'subject': 'Mathematics', 'status': 'approved'},
    {'student': student2, 'teacher': teacher2, 'subject': 'Chemistry', 'status': 'approved'},
    {'student': student2, 'teacher': teacher2, 'subject': 'History', 'status': 'declined'},
]

ser_count = 0
for req_data in student_requests:
    ser, created = StudentEnrollmentRequest.objects.get_or_create(
        student=req_data['student'],
        teacher=req_data['teacher'],
        subject=req_data['subject'],
        grade_level='10',
        stream='A',
        family=family,
        defaults={
            'status': req_data['status'],
            'requested_at': datetime.now() - timedelta(days=4),
            'reviewed_by': admin if req_data['status'] != 'pending' else None,
            'reviewed_at': datetime.now() - timedelta(days=2) if req_data['status'] != 'pending' else None,
        }
    )
    if created:
        ser.status = req_data['status']
        ser.save()
        ser_count += 1

print(f"✓ Created {ser_count} student enrollment requests")

# Create student grades for approved enrollments
grades_data = [
    {'student': student1, 'subject': 'Mathematics', 'teacher': teacher1, 'score': 85, 'max_score': 100, 'type': 'assignment'},
    {'student': student1, 'subject': 'Mathematics', 'teacher': teacher1, 'score': 90, 'max_score': 100, 'type': 'exam'},
    {'student': student2, 'subject': 'Mathematics', 'teacher': teacher1, 'score': 78, 'max_score': 100, 'type': 'assignment'},
    {'student': student2, 'subject': 'Chemistry', 'teacher': teacher2, 'score': 92, 'max_score': 100, 'type': 'assignment'},
    {'student': student2, 'subject': 'Chemistry', 'teacher': teacher2, 'score': 88, 'max_score': 100, 'type': 'exam'},
    {'student': student1, 'subject': 'English', 'teacher': teacher1, 'score': 75, 'max_score': 100, 'type': 'assignment'},
    {'student': student1, 'subject': 'Physics', 'teacher': teacher1, 'score': 82, 'max_score': 100, 'type': 'exam'},
]

grade_count = 0
for grade_data in grades_data:
    assignment_type = 'Quiz' if grade_data['type'] == 'assignment' else None
    exam_type = 'Mid Exam' if grade_data['type'] == 'exam' else None
    
    grade, created = StudentGrade.objects.get_or_create(
        student=grade_data['student'],
        subject=grade_data['subject'],
        grade_level='10',
        stream='A',
        assignment_type=assignment_type,
        exam_type=exam_type,
        defaults={
            'score': grade_data['score'],
            'max_score': grade_data['max_score'],
            'category': 'Assignment' if grade_data['type'] == 'assignment' else 'Exam',
            'feedback': 'Excellent work!' if grade_data['score'] >= 85 else 'Good effort, keep improving!',
            'graded_by': grade_data['teacher'],
            'graded_at': datetime.now() - timedelta(days=1),
        }
    )
    if created:
        grade_count += 1

print(f"✓ Created {grade_count} student grades")

print("\n" + "="*50)
print("TEST DATA POPULATION COMPLETE!")
print("="*50)
print(f"\nSummary:")
print(f"  - Courses: {len(courses)}")
print(f"  - Teacher Course Requests: {tcr_count}")
print(f"  - Student Enrollment Requests: {ser_count}")
print(f"  - Student Grades: {grade_count}")
print(f"\nTest Scenarios:")
print(f"  ✓ Approved teacher courses")
print(f"  ✓ Pending teacher course requests")
print(f"  ✓ Under review teacher requests")
print(f"  ✓ Declined teacher requests")
print(f"  ✓ Approved student enrollments")
print(f"  ✓ Pending student enrollment requests")
print(f"  ✓ Under review student requests")
print(f"  ✓ Declined student requests")
print(f"  ✓ Student grades for approved courses")
