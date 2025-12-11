import os
import sys
import django

os.chdir('yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
sys.path.insert(0, '.')
django.setup()

from django.contrib.auth import get_user_model
from academics.models import Enrollment, Course

User = get_user_model()

teachers = User.objects.filter(role='Teacher')[:3]
print(f"Total teachers found: {User.objects.filter(role='Teacher').count()}\n")

for teacher in teachers:
    print(f"Teacher: {teacher.get_full_name()} ({teacher.email})")
    courses = Course.objects.filter(teacher_id=teacher.id)
    print(f"  Courses: {courses.count()}")
    
    for course in courses:
        enrollments = Enrollment.objects.filter(course_id=course.id)
        print(f"    {course.title} (Grade {course.grade_level}): {enrollments.count()} enrollments")

print("\n" + "="*50)
if User.objects.filter(role='Teacher').exists():
    teacher = User.objects.filter(role='Teacher').first()
    from academics.services_grade_entry import TeacherSubjectGradesService
    subjects = TeacherSubjectGradesService.get_teacher_enrolled_subjects(teacher.id)
    print(f"Subjects for {teacher.get_full_name()}: {len(subjects)}")
    for s in subjects:
        print(f"  - {s}")
