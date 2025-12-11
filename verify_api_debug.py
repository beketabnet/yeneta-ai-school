import os
import sys
import django
import json

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

print("Type: {}".format(type(subjects)))
print("Total: {}\n".format(len(subjects)))

if subjects:
    print("First item keys: {}".format(list(subjects[0].keys())))
    print("\nFirst item:")
    print(json.dumps(subjects[0], indent=2, default=str))
    
    print("\nAll subjects:")
    for subject in subjects:
        print("  - {}: Grade {} (Student ID: {})".format(
            subject.get('subject_name', 'N/A'),
            subject.get('grade_level', 'N/A'),
            subject.get('student_id', 'N/A')
        ))
