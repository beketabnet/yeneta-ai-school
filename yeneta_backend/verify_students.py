import os
import django
import json
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.test import force_authenticate
from users.models import User
from academics.views import teacher_enrolled_students_view

def verify_teacher_students():
    # Find a teacher user
    teacher = User.objects.filter(role='Teacher').first()
    if not teacher:
        print("No teacher found.")
        return

    print(f"Testing with teacher: {teacher.username}")

    # Create a request
    factory = RequestFactory()
    request = factory.get('/academics/teacher-enrolled-students/')
    force_authenticate(request, user=teacher)

    from academics.models import TeacherCourseRequest, StudentEnrollmentRequest

    # Create test data if none exists
    if TeacherCourseRequest.objects.filter(teacher=teacher).count() == 0:
        print("Creating test data...")
        # Create a student
        student = User.objects.create_user(username='test_student_verify', email='test_student@example.com', password='password123', role='Student', first_name='Test', last_name='Student')
        
        # Create approved course
        TeacherCourseRequest.objects.create(
            teacher=teacher,
            subject='Mathematics',
            grade_level='10',
            status='approved'
        )
        
        # Create approved enrollment
        StudentEnrollmentRequest.objects.create(
            teacher=teacher,
            student=student,
            subject='Mathematics',
            grade_level='10',
            status='approved'
        )
        print("Test data created.")

    # Check TeacherCourseRequest
    course_requests = TeacherCourseRequest.objects.filter(teacher=teacher)
    print(f"Total TeacherCourseRequests: {course_requests.count()}")
    approved_courses = course_requests.filter(status='approved')
    print(f"Approved TeacherCourseRequests: {approved_courses.count()}")
    for cr in approved_courses:
        print(f"  - {cr.subject} (Grade {cr.grade_level})")

    # Check StudentEnrollmentRequest
    enrollments = StudentEnrollmentRequest.objects.filter(teacher=teacher)
    print(f"Total StudentEnrollmentRequests: {enrollments.count()}")
    approved_enrollments = enrollments.filter(status='approved')
    print(f"Approved StudentEnrollmentRequests: {approved_enrollments.count()}")

    # Call the view
    response = teacher_enrolled_students_view(request)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.data
        print(f"Found {len(data)} students from view.")
        for student in data[:3]: # Print first 3 students
            print(f"Student: {student.get('student_name') or student.get('username')}")
            print(f"Courses: {json.dumps(student.get('courses'), indent=2)}")
    else:
        print("Error response:", response.data)

if __name__ == "__main__":
    verify_teacher_students()
