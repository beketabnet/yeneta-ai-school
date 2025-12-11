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
print("CHECKING ENGLISH COURSES")
print("="*70)

english_courses = Course.objects.filter(title__icontains='english')
print(f"English courses: {english_courses.count()}")

for course in english_courses:
    print(f"\n{course.title} (Grade {course.grade_level})")
    print(f"  Teacher: {course.teacher.get_full_name()} (ID: {course.teacher.id})")
    
    enrollments = Enrollment.objects.filter(course_id=course.id)
    print(f"  Actual Enrollments: {enrollments.count()}")
    for e in enrollments:
        print(f"    - {e.student.get_full_name()}")

print("\n" + "="*70)
print("JOHN STUDENT'S ENROLLMENT REQUESTS")
print("="*70)

john = User.objects.filter(first_name='John', role='Student').first()
if john:
    print(f"Student: {john.get_full_name()}\n")
    
    reqs = StudentEnrollmentRequest.objects.filter(student_id=john.id)
    print(f"Total requests: {reqs.count()}")
    
    for req in reqs:
        print(f"\n{req.subject} (Grade {req.grade_level})")
        print(f"  Teacher: {req.teacher.get_full_name()}")
        print(f"  Status: {req.status}")
        
        # Check if there's an actual enrollment
        enrollment = Enrollment.objects.filter(student_id=john.id).filter(course__title=req.subject).filter(course__grade_level=req.grade_level).first()
        if enrollment:
            print(f"  ✓ Corresponding Enrollment exists")
        else:
            print(f"  ✗ No corresponding Enrollment found")
            
            # Find matching courses
            matching_courses = Course.objects.filter(title=req.subject, grade_level=req.grade_level)
            print(f"  Matching courses: {matching_courses.count()}")
            for course in matching_courses:
                print(f"    - {course.title} (Grade {course.grade_level}) by {course.teacher.get_full_name()}")

print("\n" + "="*70)
print("JOHN STUDENT'S ACTUAL ENROLLMENTS")
print("="*70)

if john:
    enrollments = Enrollment.objects.filter(student_id=john.id)
    print(f"Actual enrollments: {enrollments.count()}")
    
    for e in enrollments:
        print(f"  - {e.course.title} (Grade {e.course.grade_level}) by {e.course.teacher.get_full_name()}")
