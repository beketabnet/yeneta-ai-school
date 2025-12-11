import os
import sys
import django

os.chdir('yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
sys.path.insert(0, '.')
django.setup()

from academics.models import Course, StudentEnrollmentRequest, Enrollment
from academics.services_grade_entry import TeacherSubjectGradesService
from django.contrib.auth import get_user_model

User = get_user_model()

teacher = User.objects.get(id=2)
print(f"Teacher: {teacher.get_full_name()} (ID: {teacher.id}, Email: {teacher.email})\n")

print("="*70)
print("COURSES FOR TEACHER SMITH")
print("="*70)

courses = teacher.taught_courses.all()
print(f"Total courses: {courses.count()}\n")

for course in courses:
    enrollments = Enrollment.objects.filter(course_id=course.id)
    print(f"{course.title} (Grade {course.grade_level})")
    print(f"  Enrollments: {enrollments.count()}")
    for e in enrollments:
        print(f"    - {e.student.get_full_name()}")
    print()

print("="*70)
print("ENROLLMENT REQUESTS FOR THIS TEACHER")
print("="*70)

enrollment_reqs = StudentEnrollmentRequest.objects.filter(teacher_id=teacher.id)
print(f"Total enrollment requests: {enrollment_reqs.count()}\n")

for req in enrollment_reqs:
    print(f"{req.student.get_full_name()} - {req.subject} (Grade {req.grade_level})")
    print(f"  Status: {req.status}")
    print(f"  Requested: {req.requested_at}")
    print(f"  Reviewed: {req.reviewed_at}")
    print()

print("="*70)
print("SERVICE: get_teacher_enrolled_subjects")
print("="*70)

subjects = TeacherSubjectGradesService.get_teacher_enrolled_subjects(teacher.id)
print(f"Subjects returned: {len(subjects)}\n")

for subj in subjects:
    print(f"{subj['subject_name']} (Grade {subj['grade_level']})")
    print(f"  Student count: {subj['student_count']}")
    print(f"  Average score: {subj['average_score']}")
    print()
