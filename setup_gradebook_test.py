import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
sys.path.insert(0, r'd:\django_project\yeneta-ai-school\yeneta_backend')

django.setup()

from django.contrib.auth import get_user_model
from academics.models import Course, Enrollment, StudentGrade
from django.utils import timezone

User = get_user_model()

print("=== Setting up Gradebook Test Data ===\n")

# Check/Create test teacher
teacher, created = User.objects.get_or_create(
    username='smith.teacher',
    defaults={
        'email': 'smith.teacher@school.edu',
        'first_name': 'Smith',
        'last_name': 'Teacher',
        'role': 'Teacher'
    }
)
if created:
    teacher.set_password('teacher123')
    teacher.save()
    print(f"Teacher created: {teacher.first_name} {teacher.last_name}")
else:
    print(f"Teacher exists: {teacher.first_name} {teacher.last_name}")

# Check/Create test students
students = []
for i in range(1, 4):
    student, created = User.objects.get_or_create(
        username=f'student{i}',
        defaults={
            'email': f'student{i}@school.edu',
            'first_name': f'Student{i}',
            'last_name': f'Last{i}',
            'role': 'Student',
            'grade_level': f'{i+9}'
        }
    )
    if created:
        student.set_password('student123')
        student.save()
        print(f"Student created: {student.first_name} {student.last_name}")
    students.append(student)

# Check/Create test courses
courses_data = [
    {'title': 'Mathematics', 'grade_level': '10', 'stream': ''},
    {'title': 'Physics', 'grade_level': '10', 'stream': 'Natural Science'},
    {'title': 'English', 'grade_level': '11', 'stream': ''},
]

courses = []
for course_data in courses_data:
    course, created = Course.objects.get_or_create(
        teacher=teacher,
        title=course_data['title'],
        grade_level=course_data['grade_level'],
        defaults={'description': f"{course_data['title']} course"}
    )
    if created:
        print(f"Course created: {course.title} (Grade {course.grade_level})")
    courses.append(course)

# Create enrollments
for i, course in enumerate(courses):
    for student in students:
        enrollment, created = Enrollment.objects.get_or_create(
            student=student,
            course=course,
            defaults={'status': 'approved', 'created_at': timezone.now()}
        )
        if created:
            print(f"Enrollment created: {student.first_name} -> {course.title}")

print(f"\n=== Summary ===")
print(f"Teacher: {teacher.username}")
print(f"Students: {len(students)}")
print(f"Courses: {len(courses)}")
print(f"Enrollments: {Enrollment.objects.filter(course__teacher=teacher, status='approved').count()}")

print("\nTest data setup complete!")
