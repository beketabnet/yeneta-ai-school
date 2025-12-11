import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
sys.path.insert(0, r'd:\django_project\yeneta-ai-school\yeneta_backend')

django.setup()

from academics.models import Enrollment, StudentEnrollmentRequest, Course
import inspect

print("=== Enrollment Model Fields ===")
for field in Enrollment._meta.get_fields():
    print(f"  {field.name}: {field.__class__.__name__}")

print("\n=== StudentEnrollmentRequest Model Fields ===")
for field in StudentEnrollmentRequest._meta.get_fields():
    print(f"  {field.name}: {field.__class__.__name__}")

print("\n=== Course Model Fields ===")
for field in Course._meta.get_fields():
    print(f"  {field.name}: {field.__class__.__name__}")
