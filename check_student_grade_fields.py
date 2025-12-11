import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
sys.path.insert(0, r'd:\django_project\yeneta-ai-school\yeneta_backend')

django.setup()

from academics.models import StudentGrade

print("=== StudentGrade Model Fields ===")
for field in StudentGrade._meta.get_fields():
    print("  {}: {}".format(field.name, field.__class__.__name__))
