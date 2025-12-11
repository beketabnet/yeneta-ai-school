import os
import sys
import django

os.chdir('yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
sys.path.insert(0, '.')
django.setup()

from django.contrib.auth import get_user_model
from academics.models import Enrollment, StudentGrade
from academics.services_grade_entry import TeacherSubjectGradesService

User = get_user_model()
teacher = User.objects.filter(role='Teacher', email='smith.teacher@school.edu').first()

if teacher:
    print('Teacher found:', teacher.email)
    print('Teacher ID:', teacher.id)
    print()
    
    enrollments = Enrollment.objects.filter(course__teacher_id=teacher.id)
    print(f'Enrollments for teacher: {enrollments.count()}')
    
    grades = StudentGrade.objects.filter(graded_by_id=teacher.id)
    print(f'Grades created by teacher: {grades.count()}')
    for grade in grades[:5]:
        print(f'  - Student {grade.student.username}: {grade.subject} - Score {grade.score}')
    
    print()
    print('='*60)
    print('Service Response:')
    subjects = TeacherSubjectGradesService.get_teacher_enrolled_subjects(teacher.id)
    print(f'Subjects returned: {len(subjects)}')
    import json
    print(json.dumps(subjects, indent=2, default=str))
