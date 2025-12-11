import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from yeneta_backend.academics.models import Enrollment, Course

User = get_user_model()

# Get all teachers
teachers = User.objects.filter(role='Teacher')
print(f"Total teachers: {teachers.count()}")

for teacher in teachers:
    print(f"\nTeacher: {teacher.get_full_name()} ({teacher.email})")
    
    # Get courses for this teacher
    courses = Course.objects.filter(teacher_id=teacher.id)
    print(f"  Courses: {courses.count()}")
    
    for course in courses:
        print(f"    - {course.title} (Grade {course.grade_level})")
        
        # Get enrollments for this course
        enrollments = Enrollment.objects.filter(course_id=course.id)
        print(f"      Enrollments: {enrollments.count()}")
        
        for enrollment in enrollments:
            print(f"        - {enrollment.student.get_full_name()}")

print("\n" + "="*50)
print("Checking last teacher's enrolled subjects:")
if teachers.exists():
    last_teacher = teachers.last()
    from yeneta_backend.academics.services_grade_entry import TeacherSubjectGradesService
    subjects = TeacherSubjectGradesService.get_teacher_enrolled_subjects(last_teacher.id)
    print(f"Teacher: {last_teacher.get_full_name()}")
    print(f"Enrolled subjects returned: {len(subjects)}")
    for subject in subjects:
        print(f"  - {subject}")
