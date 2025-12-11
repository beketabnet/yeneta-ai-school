import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
sys.path.insert(0, r'd:\django_project\yeneta-ai-school\yeneta_backend')

django.setup()

from django.contrib.auth import get_user_model
from academics.services_grade_entry import TeacherSubjectGradesService

User = get_user_model()

# Get the teacher
teacher = User.objects.get(username='smith.teacher')

print("=== Verifying API Data ===\n")

# Call the service method directly
subjects = TeacherSubjectGradesService.get_teacher_enrolled_subjects(teacher.id)

print("Teacher enrolled subjects:")
print("Total: {}".format(len(subjects)))
print("\nDetails:")
for subject in subjects:
    print("  - {}: Grade {} ({} students)".format(
        subject['subject_name'],
        subject['grade_level'],
        subject['student_count']
    ))

# Check available grade levels
grade_levels = set(s['grade_level'] for s in subjects)
print("\nAvailable Grade Levels: {}".format(sorted(grade_levels)))

print("\nAPI verification complete!")
