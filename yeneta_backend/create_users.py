#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

users = [
    {'email': 'admin@yeneta.com', 'password': 'admin123', 'role': 'Admin', 'first_name': 'Admin', 'last_name': 'User'},
    {'email': 'teacher@yeneta.com', 'password': 'teacher123', 'role': 'Teacher', 'first_name': 'Teacher', 'last_name': 'User'},
    {'email': 'student@yeneta.com', 'password': 'student123', 'role': 'Student', 'first_name': 'Student', 'last_name': 'User'},
    {'email': 'student2@yeneta.com', 'password': 'student123', 'role': 'Student', 'first_name': 'Student', 'last_name': 'Two'},
    {'email': 'parent@yeneta.com', 'password': 'parent123', 'role': 'Parent', 'first_name': 'Parent', 'last_name': 'User'},
    {'email': 'admin@yeneta.ai', 'password': 'admin123', 'role': 'Admin', 'first_name': 'Admin', 'last_name': 'AI'},
    {'email': 'parent@yeneta.ai', 'password': 'parent123', 'role': 'Parent', 'first_name': 'Parent', 'last_name': 'AI'},
    {'email': 'newteacher@yeneta.com', 'password': 'teacher123', 'role': 'Teacher', 'first_name': 'New', 'last_name': 'Teacher'},
    {'email': 'abinetalemu2018@gmail.com', 'password': 'abinet123', 'role': 'Student', 'first_name': 'Abinet', 'last_name': 'Alemu'},
    {'email': 'admin_test@example.com', 'password': 'admin123', 'role': 'Admin', 'first_name': 'Admin', 'last_name': 'Test'},
    {'email': 'teacher_test@example.com', 'password': 'teacher123', 'role': 'Teacher', 'first_name': 'Teacher', 'last_name': 'Test'},
]

for user_data in users:
    email = user_data['email']
    if not User.objects.filter(email=email).exists():
        user = User.objects.create_user(
            username=email.split('@')[0],
            email=email,
            password=user_data['password'],
            role=user_data['role'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name']
        )
        print("Created: {} ({})".format(email, user_data['role']))
    else:
        print("Already exists: {}".format(email))

print("\nAll users created successfully!")
