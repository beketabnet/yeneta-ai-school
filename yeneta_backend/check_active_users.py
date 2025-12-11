#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("\n" + "="*50)
print("ACTIVE USER ACCOUNTS IN DATABASE")
print("="*50 + "\n")

users = User.objects.filter(is_active=True).order_by('username')

if not users.exists():
    print("NO ACTIVE USERS FOUND\n")
else:
    for user in users:
        role = "Superuser" if user.is_superuser else ("Staff" if user.is_staff else "Regular User")
        print("-" * 50)
        print("Username: " + user.username)
        print("Email: " + user.email)
        print("Role: " + role)
        print("Created: " + str(user.date_joined))
        print()

print(f"Total active users: {users.count()}\n")
