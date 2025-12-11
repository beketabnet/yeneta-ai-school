import os
import sys
import django

os.chdir('yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
sys.path.insert(0, '.')
django.setup()

from django.contrib.auth import get_user_model
from academics.models import Enrollment, Course
from academics.services_grade_entry import TeacherSubjectGradesService

User = get_user_model()

# List all teachers with courses
teachers = User.objects.filter(role='Teacher').exclude(id=346)  # Exclude smith.teacher
print("Teachers with courses:\n")

for teacher in teachers[:10]:
    courses = Course.objects.filter(teacher_id=teacher.id)
    if courses.count() > 0:
        print(f"Teacher: {teacher.get_full_name()} ({teacher.email})")
        print(f"  ID: {teacher.id}")
        print(f"  Total Courses: {courses.count()}")
        
        for course in courses:
            enrollments = Enrollment.objects.filter(course_id=course.id)
            print(f"    - {course.title} (Grade {course.grade_level}): {enrollments.count()} enrollments")
        
        # Get enrolled subjects via service
        subjects = TeacherSubjectGradesService.get_teacher_enrolled_subjects(teacher.id)
        print(f"  Service returned: {len(subjects)} subjects")
        for subj in subjects:
            print(f"    - {subj['subject_name']} (Grade {subj['grade_level']}): {subj['student_count']} students")
        print()

print("\n" + "="*70)
print("SPECIFIC TEACHER WITH GEOGRAPHY, IT, ENGLISH:")
# Query for teacher with Geography, Information Technology, English courses
teachers_with_geo = User.objects.filter(
    role='Teacher',
    course__title__in=['Geography', 'Information Technology', 'English']
).distinct()

print(f"Found {teachers_with_geo.count()} teacher(s) with these subjects\n")

for teacher in teachers_with_geo[:5]:
    print(f"Teacher: {teacher.get_full_name()} ({teacher.email}, ID: {teacher.id})")
    courses = Course.objects.filter(teacher_id=teacher.id)
    print(f"  All courses: {courses.count()}")
    
    for course in courses:
        enrollments = Enrollment.objects.filter(course_id=course.id)
        print(f"    - {course.title} (Grade {course.grade_level}): {enrollments.count()} enrollments")
    
    subjects = TeacherSubjectGradesService.get_teacher_enrolled_subjects(teacher.id)
    print(f"  Service response: {len(subjects)} subjects")
    for subj in subjects:
        print(f"    - {subj['subject_name']} (Grade {subj['grade_level']}): {subj['student_count']} students")
    print()
