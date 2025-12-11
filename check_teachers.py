#!/usr/bin/env python
import sys
import os

sys.path.insert(0, 'yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from academics.models import StudentEnrollmentRequest

User = get_user_model()

print('Checking for teachers...')
print('Total users: {}'.format(User.objects.count()))

teachers = User.objects.filter(groups__name='Teacher')
print('Teachers: {}'.format(teachers.count()))

for teacher in teachers:
    print('  - {}'.format(teacher.username))

print('\nChecking approved requests...')
reqs = StudentEnrollmentRequest.objects.filter(status='approved')
print('Total approved requests: {}'.format(reqs.count()))

for req in reqs[:3]:
    print('  - {} ({}) by {}'.format(req.subject, req.grade_level, req.teacher.username))
