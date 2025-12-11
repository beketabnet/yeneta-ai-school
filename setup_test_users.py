#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'yeneta_backend'))
os.chdir(os.path.join(os.path.dirname(__file__), 'yeneta_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Family, FamilyMembership

User = get_user_model()

def create_or_update_user(email, username, first_name, last_name, role, password='password'):
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': username,
            'first_name': first_name,
            'last_name': last_name,
            'role': role,
            'is_active': True
        }
    )
    if created:
        user.set_password(password)
        user.save()
        print(f"Created {role}: {username}")
    else:
        print(f"User exists: {username}")
    return user

# Create users
admin = create_or_update_user('admin@yeneta.ai', 'admin', 'Admin', 'User', 'Admin')
teacher = create_or_update_user('teacher@yeneta.ai', 'teacher', 'John', 'Doe', 'Teacher')
student = create_or_update_user('student@yeneta.ai', 'student', 'Jane', 'Smith', 'Student')
parent = create_or_update_user('parent@yeneta.ai', 'parent', 'Mary', 'Smith', 'Parent')

# Create family and link student and parent
family, created = Family.objects.get_or_create(name='Smith Family')
if created:
    print(f"Created family: {family.name}")

FamilyMembership.objects.get_or_create(
    family=family,
    user=student,
    defaults={'role': 'Student', 'is_active': True}
)

FamilyMembership.objects.get_or_create(
    family=family,
    user=parent,
    defaults={'role': 'Parent/Guardian', 'is_active': True}
)

print("\nTest users setup complete!")
print(f"Admin: admin@yeneta.ai / password")
print(f"Teacher: teacher@yeneta.ai / password")
print(f"Student: student@yeneta.ai / password")
print(f"Parent: parent@yeneta.ai / password")
