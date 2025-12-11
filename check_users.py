import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta.settings')
django.setup()

from django.contrib.auth.models import User

print("\n=== Active User Accounts ===\n")
users = User.objects.filter(is_active=True).order_by('username')
for user in users:
    role = "Superuser" if user.is_superuser else ("Staff" if user.is_staff else "User")
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
    print(f"Role: {role}")
    print()
