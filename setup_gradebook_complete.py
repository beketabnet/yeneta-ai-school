import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
sys.path.insert(0, r'd:\django_project\yeneta-ai-school\yeneta_backend')

django.setup()

from django.contrib.auth import get_user_model
from academics.models import Course, Enrollment, StudentGrade, StudentEnrollmentRequest
from users.models import Family
from django.utils import timezone

User = get_user_model()

print("=== Setting up Gradebook Complete Test Data ===\n")

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
    print(f"✓ Teacher created: {teacher.first_name} {teacher.last_name}")
else:
    print(f"✓ Teacher exists: {teacher.first_name} {teacher.last_name}")

# Check/Create test family
family, created = Family.objects.get_or_create(
    name='Test Family',
    defaults={'created_at': timezone.now()}
)
print(f"✓ Family: {family.name} (ID: {family.id})")

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
        print(f"✓ Student created: {student.first_name} {student.last_name} (Grade {student.grade_level})")
    students.append(student)

# Check/Create test courses
courses_data = [
    {'title': 'Mathematics', 'subject': 'Mathematics', 'grade_level': '10', 'stream': ''},
    {'title': 'Physics', 'subject': 'Physics', 'grade_level': '10', 'stream': 'Natural Science'},
    {'title': 'English', 'subject': 'English', 'grade_level': '11', 'stream': ''},
]

courses = []
for course_data in courses_data:
    course, created = Course.objects.get_or_create(
        teacher=teacher,
        title=course_data['title'],
        grade_level=course_data['grade_level'],
        defaults={
            'subject': course_data['subject'],
            'description': f"{course_data['title']} course"
        }
    )
    if created:
        print(f"✓ Course created: {course.title} (Grade {course.grade_level})")
    courses.append(course)

# Create enrollments
print(f"\n✓ Creating enrollments...")
for course in courses:
    for student in students:
        enrollment, created = Enrollment.objects.get_or_create(
            student=student,
            course=course,
            defaults={'enrolled_at': timezone.now()}
        )

# Create StudentEnrollmentRequests for the gradebook service
print(f"✓ Creating student enrollment requests...")
for student in students:
    for course in courses:
        enrollment_request, created = StudentEnrollmentRequest.objects.get_or_create(
            student=student,
            teacher=teacher,
            subject=course.title,
            grade_level=course.grade_level,
            defaults={
                'family': family,
                'status': 'approved',
                'requested_at': timezone.now()
            }
        )

# Create some sample grades
print(f"✓ Creating sample grades...")
for i, student in enumerate(students, 1):
    for j, course in enumerate(courses, 1):
        score = 70 + (i * j * 3) % 30
        grade, created = StudentGrade.objects.get_or_create(
            student=student,
            subject=course.title,
            graded_by=teacher,
            assignment_type='Quiz',
            defaults={
                'grade_level': course.grade_level,
                'score': score,
                'max_score': 100,
                'graded_at': timezone.now()
            }
        )

print(f"\n=== Summary ===")
print(f"✓ Teacher: {teacher.username} ({teacher.email})")
print(f"✓ Students: {len(students)}")
print(f"✓ Courses: {len(courses)}")
print(f"✓ Enrollments: {Enrollment.objects.filter(course__teacher=teacher).count()}")
print(f"✓ Student Enrollment Requests: {StudentEnrollmentRequest.objects.filter(teacher=teacher, status='approved').count()}")
print(f"✓ Grades: {StudentGrade.objects.filter(graded_by=teacher).count()}")

print(f"\n✓ Test data setup complete!")
print(f"\nYou can now login with:")
print(f"  Email: smith.teacher@school.edu")
print(f"  Password: teacher123")
