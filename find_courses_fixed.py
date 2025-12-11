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
    print(f"{course.title} (Grade {course.grade_level})")
    print(f"  Teacher: {teacher.get_full_name()} ({teacher.email}, ID: {teacher.id})")
    print(f"  Enrollments: {enrollments}")
    print()

print("\n" + "="*70)
print("ALL TEACHERS WITH COURSE COUNT")
print("="*70)

for course in Course.objects.all():
    enrollments = Enrollment.objects.filter(course_id=course.id)
    print(f"\n{course.teacher.get_full_name()} (ID: {course.teacher.id}):")
    print(f"  {course.title} (Grade {course.grade_level}): {enrollments.count()} enrollments")
    for e in enrollments:
        print(f"    - {e.student.get_full_name()}")
