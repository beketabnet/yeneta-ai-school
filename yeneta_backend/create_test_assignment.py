import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from academics.models import Assignment
from users.models import User

# Get a teacher user
teacher = User.objects.filter(role='Teacher').first()
if not teacher:
    print("No teacher found. Creating one.")
    teacher = User.objects.create_user(username='teacher1', email='teacher1@example.com', password='password123', role='Teacher')

# Create an assignment
assignment = Assignment.objects.create(
    title='Test Essay Assignment',
    description='This is a test assignment for debugging.',
    document_type='essay',
    due_date=timezone.now() + timedelta(days=7),
    created_by=teacher,
    course='English Grade 10'
)

print(f"Created assignment: {assignment.title} (ID: {assignment.id})")
