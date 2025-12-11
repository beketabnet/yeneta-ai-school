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
    print("[OK] Teacher created: {} {}".format(teacher.first_name, teacher.last_name))
else:
    print("[OK] Teacher exists: {} {}".format(teacher.first_name, teacher.last_name))

# Check/Create test family
family, created = Family.objects.get_or_create(
    name='Test Family',
    defaults={'created_at': timezone.now()}
)
print("[OK] Family: {} (ID: {})".format(family.name, family.id))

# Check/Create test students
students = []
for i in range(1, 4):
    student, created = User.objects.get_or_create(
        username='student{}'.format(i),
        defaults={
            'email': 'student{}@school.edu'.format(i),
            'first_name': 'Student{}'.format(i),
            'last_name': 'Last{}'.format(i),
            'role': 'Student',
            'grade_level': str(i+9)
        }
    )
    if created:
        student.set_password('student123')
        student.save()
        print("[OK] Student created: {} {} (Grade {})".format(student.first_name, student.last_name, student.grade_level))
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
            'description': "{} course".format(course_data['title'])
        }
    )
    if created:
        print("[OK] Course created: {} (Grade {})".format(course.title, course.grade_level))
    courses.append(course)

# Create enrollments
print("\n[OK] Creating enrollments...")
for course in courses:
    for student in students:
        enrollment, created = Enrollment.objects.get_or_create(
            student=student,
            course=course,
            defaults={'enrolled_at': timezone.now()}
        )

# Create StudentEnrollmentRequests for the gradebook service
print("[OK] Creating student enrollment requests...")
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
print("[OK] Creating sample grades...")
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

print("\n=== Summary ===")
print("[OK] Teacher: {} ({})".format(teacher.username, teacher.email))
print("[OK] Students: {}".format(len(students)))
print("[OK] Courses: {}".format(len(courses)))
print("[OK] Enrollments: {}".format(Enrollment.objects.filter(course__teacher=teacher).count()))
print("[OK] Student Enrollment Requests: {}".format(StudentEnrollmentRequest.objects.filter(teacher=teacher, status='approved').count()))
print("[OK] Grades: {}".format(StudentGrade.objects.filter(graded_by=teacher).count()))

print("\n[OK] Test data setup complete!")
print("\nYou can now login with:")
print("  Email: smith.teacher@school.edu")
print("  Password: teacher123")
