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

# Check/Create test family
family, created = Family.objects.get_or_create(
    name='Test Family',
    defaults={'created_at': timezone.now()}
)

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
    students.append(student)

# Check/Create test courses
courses_data = [
    {'title': 'Mathematics', 'subject': 'Mathematics', 'grade_level': '10'},
    {'title': 'Physics', 'subject': 'Physics', 'grade_level': '10'},
    {'title': 'English', 'subject': 'English', 'grade_level': '11'},
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
    courses.append(course)

# Create enrollments
for course in courses:
    for student in students:
        Enrollment.objects.get_or_create(
            student=student,
            course=course,
            defaults={'enrolled_at': timezone.now()}
        )

# Create StudentEnrollmentRequests for the gradebook service
for student in students:
    for course in courses:
        StudentEnrollmentRequest.objects.get_or_create(
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
for i, student in enumerate(students, 1):
    for j, course in enumerate(courses, 1):
        score = 70 + (i * j * 3) % 30
        StudentGrade.objects.get_or_create(
            student=student,
            subject=course.title,
            graded_by=teacher,
            assignment_type='Quiz',
            defaults={
                'score': score,
                'max_score': 100,
                'graded_at': timezone.now()
            }
        )

print("Setup complete!")
print("Teacher: smith.teacher@school.edu / teacher123")
print("Courses: {}".format(len(courses)))
print("Students: {}".format(len(students)))
print("Enrollments: {}".format(Enrollment.objects.filter(course__teacher=teacher).count()))
print("Grades: {}".format(StudentGrade.objects.filter(graded_by=teacher).count()))
