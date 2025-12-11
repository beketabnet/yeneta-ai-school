import os
import sys
import django

os.chdir('yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
sys.path.insert(0, '.')
django.setup()

from django.contrib.auth import get_user_model
from academics.models import Enrollment, Course, StudentEnrollmentRequest
from academics.services_grade_entry import TeacherSubjectGradesService

User = get_user_model()

# List all teachers with courses
print("="*70)
print("TEACHERS WITH ENROLLMENTS")
print("="*70)

teachers = User.objects.filter(role='Teacher')
print(f"Total teachers: {teachers.count()}\n")

for teacher in teachers[:15]:
    enrollments = Enrollment.objects.filter(course__teacher_id=teacher.id)
    if enrollments.count() > 0:
        print(f"Teacher: {teacher.get_full_name()} ({teacher.email})")
        print(f"  ID: {teacher.id}")
        
        # Get via relationships
        courses = teacher.taught_courses.all()
        print(f"  Total Courses: {courses.count()}")
        
        for course in courses:
            enrollments_for_course = Enrollment.objects.filter(course_id=course.id)
            print(f"    - {course.title} (Grade {course.grade_level}): {enrollments_for_course.count()} enrollments")
        
        # Get enrolled subjects via service
        subjects = TeacherSubjectGradesService.get_teacher_enrolled_subjects(teacher.id)
        print(f"  Service returned: {len(subjects)} subjects")
        for subj in subjects:
            print(f"    - {subj['subject_name']} (Grade {subj['grade_level']}): {subj['student_count']} students")
        print()

print("\n" + "="*70)
print("LOOKING FOR TEACHER WITH GEOGRAPHY, IT, ENGLISH")
print("="*70)

# Find teachers with those specific courses
all_courses = Course.objects.filter(title__in=['Geography', 'Information Technology', 'English'])
print(f"\nCourses found:")
for course in all_courses:
    print(f"  - {course.title} (Grade {course.grade_level}, Teacher: {course.teacher.get_full_name()})")

print("\nTeachers with any of these courses:")
teachers_with_these_courses = set()
for course in all_courses:
    teachers_with_these_courses.add(course.teacher_id)

for teacher_id in teachers_with_these_courses:
    teacher = User.objects.get(id=teacher_id)
    print(f"\nTeacher: {teacher.get_full_name()} ({teacher.email})")
    print(f"  ID: {teacher.id}")
    
    courses = teacher.taught_courses.filter(title__in=['Geography', 'Information Technology', 'English'])
    print(f"  Matching courses: {courses.count()}")
    for course in courses:
        enrollments = Enrollment.objects.filter(course_id=course.id)
        print(f"    - {course.title} (Grade {course.grade_level}): {enrollments.count()} enrollments")
        
        # Show enrolled students
        for enrollment in enrollments:
            print(f"        Student: {enrollment.student.get_full_name()}")
    
    # Get ALL courses for this teacher
    all_teacher_courses = teacher.taught_courses.all()
    print(f"  ALL courses for this teacher: {all_teacher_courses.count()}")
    for course in all_teacher_courses:
        enrollments = Enrollment.objects.filter(course_id=course.id)
        print(f"    - {course.title} (Grade {course.grade_level}): {enrollments.count()} enrollments")
    
    # Get enrolled subjects via service
    subjects = TeacherSubjectGradesService.get_teacher_enrolled_subjects(teacher.id)
    print(f"  Service returned: {len(subjects)} subjects")
    for subj in subjects:
        print(f"    - {subj['subject_name']} (Grade {subj['grade_level']}): {subj['student_count']} students")
