import os
import sys
import django

os.chdir('yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
sys.path.insert(0, '.')
django.setup()

from academics.models import StudentEnrollmentRequest, Enrollment
from django.contrib.auth import get_user_model

User = get_user_model()

print("="*70)
print("SEARCHING FOR 'JOHN' IN STUDENTS")
print("="*70)

# First find students with 'John' in first or last name
john_users = User.objects.filter(role='Student').filter(username__icontains='john') | User.objects.filter(role='Student', email__icontains='john')
print(f"Found: {john_users.count()}")
for user in john_users:
    print(f"  - {user.get_full_name()} ({user.email}, ID: {user.id})")

print("\n" + "="*70)
print("CHECKING TEACHER SMITH'S ENROLLMENT REQUESTS")
print("="*70)

teacher = User.objects.get(id=2)
reqs = StudentEnrollmentRequest.objects.filter(teacher_id=teacher.id)
print(f"Total requests: {reqs.count()}\n")

students_in_requests = set()
for req in reqs:
    students_in_requests.add(req.student_id)
    print(f"Student ID: {req.student_id} - {req.student.get_full_name()} ({req.student.email})")

print("\n" + "="*70)
print("CHECKING JOHN STUDENT'S REQUESTS AND ENROLLMENTS")
print("="*70)

for student_id in students_in_requests:
    student = User.objects.get(id=student_id)
    print(f"\n{student.get_full_name()} (ID: {student.id}, Email: {student.email})")
    
    # Requests
    reqs = StudentEnrollmentRequest.objects.filter(student_id=student_id)
    print(f"  Enrollment Requests: {reqs.count()}")
    for req in reqs:
        print(f"    - {req.subject} (Grade {req.grade_level}) with {req.teacher.get_full_name()}")
    
    # Enrollments
    enrolls = Enrollment.objects.filter(student_id=student_id)
    print(f"  Actual Enrollments: {enrolls.count()}")
    for enroll in enrolls:
        print(f"    - {enroll.course.title} (Grade {enroll.course.grade_level}) with {enroll.course.teacher.get_full_name()}")
