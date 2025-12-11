#!/usr/bin/env python
import sys
import os

sys.path.insert(0, 'yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')

import django
django.setup()

from academics.models import StudentEnrollmentRequest, Course

# Print model fields
print('StudentEnrollmentRequest fields:')
for field in StudentEnrollmentRequest._meta.get_fields():
    print(f'  {field.name}: {type(field).__name__}')

print('\nCourse fields:')
for field in Course._meta.get_fields():
    print(f'  {field.name}: {type(field).__name__}')
