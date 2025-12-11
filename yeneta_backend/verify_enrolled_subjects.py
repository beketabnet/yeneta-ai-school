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
from academics.views import parent_enrolled_subjects_analytics_view

def verify_enrolled_subjects():
    print("Starting verification...", flush=True)
    # Find a parent user
    print("Finding parent...", flush=True)
    parent = User.objects.filter(role='Parent').first()
    if not parent:
        print("No parent found. Creating one...", flush=True)
        parent = User.objects.create_user(username='test_parent_verify', email='test_parent@example.com', password='password123', role='Parent')
        print(f"Created parent: {parent.username}", flush=True)

    print(f"Testing with parent: {parent.username}", flush=True)

    # Create test data if no families found
    from users.models import Family, FamilyMembership
    if FamilyMembership.objects.filter(user=parent, role='Parent').count() == 0:
        print("Creating test data...", flush=True)
        family = Family.objects.create(name="Test Family")
        FamilyMembership.objects.create(user=parent, family=family, role='Parent')
        
        student = User.objects.create_user(username='test_student_verify', email='test_student_v@example.com', password='password123', role='Student', first_name='Test', last_name='Student')
        FamilyMembership.objects.create(user=student, family=family, role='Student')
        
        teacher = User.objects.create_user(username='test_teacher_verify', email='test_teacher_v@example.com', password='password123', role='Teacher', first_name='Test', last_name='Teacher')
        
        from academics.models import StudentEnrollmentRequest
        StudentEnrollmentRequest.objects.create(
            student=student,
            teacher=teacher,
            family=family,
            subject='Science',
            grade_level='10',
            status='approved'
        )
        print("Test data created.", flush=True)

    # Create a request
    print("Creating request...", flush=True)
    factory = RequestFactory()
    request = factory.get('/academics/parent-enrolled-subjects-analytics/')
    force_authenticate(request, user=parent)

    # Call the view
    print("Calling view...", flush=True)
    response = parent_enrolled_subjects_analytics_view(request)
    print("View called.", flush=True)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.data
        families = data.get('families', [])
        print(f"Found {len(families)} families.")
        
        for family in families:
            for student in family.get('students', []):
                print(f"Student: {student.get('student_name')}")
                for subject in student.get('subjects', []):
                    teacher = subject.get('teacher', {})
                    print(f"  Subject: {subject.get('subject')}")
                    print(f"  Teacher Full Name: {teacher.get('full_name')}")
                    
                    if 'full_name' not in teacher:
                        print("  ERROR: full_name missing in teacher object!")
                    else:
                        print("  SUCCESS: full_name present.")
    else:
        print("Error response:", response.data)

if __name__ == "__main__":
    verify_enrolled_subjects()
