#!/usr/bin/env python
"""
Quick test to verify subject_id is being returned correctly
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from yeneta_backend.academics.services_grade_entry_enhanced import EnhancedTeacherSubjectGradesService
from yeneta_backend.users.models import User

# Get a teacher user
try:
    teacher = User.objects.filter(role='Teacher').first()
    if teacher:
        print(f"Testing with teacher: {teacher.username} (ID: {teacher.id})")
        subjects = EnhancedTeacherSubjectGradesService.get_teacher_enrolled_subjects_with_students(teacher.id)
        print(f"\nReturned {len(subjects)} subjects:")
        for subject in subjects:
            print(f"  - {subject['subject_name']} (Grade {subject['grade_level']}): subject_id={subject['subject_id']} (type: {type(subject['subject_id']).__name__})")
    else:
        print("No teacher found")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
