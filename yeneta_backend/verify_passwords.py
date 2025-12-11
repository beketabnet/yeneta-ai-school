import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

test_accounts = [
    'admin@yeneta.com',
    'teacher@yeneta.com',
    'student@yeneta.com',
    'parent@yeneta.com',
    'abinetalemu2018@gmail.com',
]

print('Verifying password hashes are set:')
print('=' * 60)
for email in test_accounts:
    try:
        user = User.objects.get(email=email)
        has_password = user.has_usable_password()
        status = "YES" if has_password else "NO"
        print(f'{email}: {status}')
    except User.DoesNotExist:
        print(f'{email}: NOT FOUND')
print('=' * 60)
