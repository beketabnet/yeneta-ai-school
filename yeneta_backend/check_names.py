import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from users.models import User

def check_user_names():
    print(f"{'ID':<5} | {'Username':<30} | {'First Name':<15} | {'Last Name':<15} | {'Role':<10}")
    print("-" * 90)
    
    for user in User.objects.filter(id__lte=20).order_by('id'):
        fname = user.first_name or ""
        lname = user.last_name or ""
        print(f"{user.id:<5} | {user.username:<30} | {fname:<15} | {lname:<15} | {user.role:<10}")

if __name__ == '__main__':
    check_user_names()
