import os
import sys
import django

os.chdir('yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
sys.path.insert(0, '.')
django.setup()

from academics.models import Course, StudentEnrollmentRequest, Enrollment
from django.contrib.auth import get_user_model

User = get_user_model()

print("="*70)
print("ALL COURSES IN DATABASE")
print("="*70)

all_courses = Course.objects.all()
print(f"Total courses: {all_courses.count()}\n")

for course in all_courses:
    teacher = course.teacher
    enrollments = Enrollment.objects.filter(course_id=course.id).count()
    reqs = StudentEnrollmentRequest.objects.filter(course_id=course.id).count()
    print(f"{course.title} (Grade {course.grade_level})")
    print(f"  Teacher: {teacher.get_full_name()} ({teacher.email})")
    print(f"  Enrollments: {enrollments}, Requests: {reqs}")
    print()

print("\n" + "="*70)
print("SEARCH FOR 'GEOGRAPHY' OR 'INFORMATION'")
print("="*70)

geo_courses = Course.objects.filter(title__icontains='geography')
print(f"\nGeography courses: {geo_courses.count()}")
for course in geo_courses:
    print(f"  - {course.title} (Grade {course.grade_level}, Teacher: {course.teacher.get_full_name()})")

it_courses = Course.objects.filter(title__icontains='information')
print(f"\nInformation Technology courses: {it_courses.count()}")
for course in it_courses:
    print(f"  - {course.title} (Grade {course.grade_level}, Teacher: {course.teacher.get_full_name()})")

print("\n" + "="*70)
print("FIND JOHN STUDENT")
print("="*70)

john_students = User.objects.filter(first_name='John', role='Student')
print(f"John Students found: {john_students.count()}")

for student in john_students:
    print(f"\n{student.get_full_name()} ({student.email})")
    
    # Check enrollment requests
    reqs = StudentEnrollmentRequest.objects.filter(student_id=student.id)
    print(f"  Enrollment Requests: {reqs.count()}")
    for req in reqs:
        print(f"    - {req.course.title} (Grade {req.course.grade_level}), Status: {req.status}")
    
    # Check enrollments
    enrolls = Enrollment.objects.filter(student_id=student.id)
    print(f"  Enrollments: {enrolls.count()}")
    for enroll in enrolls:
        print(f"    - {enroll.course.title} (Grade {enroll.course.grade_level})")
