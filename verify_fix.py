#!/usr/bin/env python
import sys
import os

sys.path.insert(0, 'yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')

import django
django.setup()

from academics.services_grade_entry_enhanced import EnhancedTeacherSubjectGradesService
from django.contrib.auth import get_user_model

User = get_user_model()

print('=== Verification Report ===\n')

# Get all teachers
teachers = User.objects.filter(groups__name='Teacher')

for teacher in teachers[:3]:
    print('Teacher: {}'.format(teacher.username))
    
    subjects = EnhancedTeacherSubjectGradesService.get_teacher_enrolled_subjects_with_students(teacher.id)
    
    print('  Subjects: {}'.format(len(subjects)))
    
    for subject in subjects:
        status = 'OK' if subject.get('subject_id') else 'MISSING_ID'
        print('    [{}] {} (Grade {}) - ID: {}'.format(
            status,
            subject.get('subject_name'),
            subject.get('grade_level'),
            subject.get('subject_id')
        ))
    print()
