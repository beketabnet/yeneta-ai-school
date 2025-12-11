import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

User = get_user_model()

# Set password for existing users or create with password
test_users = [
    ('teacher@yeneta.com', 'password', 'Teacher'),
    ('student@yeneta.com', 'password', 'Student'),
    ('parent@yeneta.com', 'password', 'Parent'),
]

for email, password, role in test_users:
    try:
        user = User.objects.get(email=email)
        user.set_password(password)
        user.save()
        print(f"[OK] Updated password for {email}")
    except User.DoesNotExist:
        print(f"[NO] User {email} not found")
        
print("\nPassword setup complete!")
