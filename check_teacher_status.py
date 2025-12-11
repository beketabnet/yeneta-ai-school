#!/usr/bin/env python
import sys
import os

sys.path.insert(0, 'yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from academics.models import StudentEnrollmentRequest, Course

User = get_user_model()

print('Getting teachers from StudentEnrollmentRequest...')
reqs = StudentEnrollmentRequest.objects.filter(status='approved').values_list('teacher_id', flat=True).distinct()
print('Unique teacher IDs from requests: {}'.format(len(list(reqs))))

for teacher_id in list(reqs)[:3]:
    teacher = User.objects.get(id=teacher_id)
    print('Teacher: {} (ID: {})'.format(teacher.username, teacher.id))
    
    # Get this teacher's subjects
    subject_data = {}
    for req in StudentEnrollmentRequest.objects.filter(teacher_id=teacher_id, status='approved'):
        key = '{}-{}'.format(req.subject, req.grade_level)
        if key not in subject_data:
            # Try to find matching course
            course = Course.objects.filter(
                teacher_id=teacher_id,
                subject=req.subject,
                grade_level=req.grade_level
            ).first()
            subject_data[key] = {
                'subject': req.subject,
                'grade_level': req.grade_level,
                'course_id': course.id if course else None
            }
    
    print('  Subjects:')
    for key, data in subject_data.items():
        status = 'OK' if data['course_id'] else 'MISSING'
        print('    [{}] {} (Grade {}) - Course ID: {}'.format(
            status,
            data['subject'],
            data['grade_level'],
            data['course_id']
        ))
