from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create test users for all roles'

    def handle(self, *args, **options):
        # Test users data
        test_users = [
            {
                'email': 'admin@yeneta.com',
                'username': 'Administrator',
                'password': 'admin123',
                'role': 'Admin',
            },
            {
                'email': 'teacher@yeneta.com',
                'username': 'Teacher Smith',
                'password': 'teacher123',
                'role': 'Teacher',
            },
            {
                'email': 'student@yeneta.com',
                'username': 'John Student',
                'password': 'student123',
                'role': 'Student',
                'grade': 'Grade 10',
                'grade_level': '10',
            },
            {
                'email': 'parent@yeneta.com',
                'username': 'Parent Johnson',
                'password': 'parent123',
                'role': 'Parent',
            },
            {
                'email': 'student2@yeneta.com',
                'username': 'Jane Student',
                'password': 'student123',
                'role': 'Student',
                'grade': 'Grade 9',
                'grade_level': '9',
            },
        ]

        for user_data in test_users:
            email = user_data['email']
            
            # Check if user already exists
            if User.objects.filter(email=email).exists():
                self.stdout.write(
                    self.style.WARNING(f'User {email} already exists. Skipping.')
                )
                continue
            
            # Create user
            user = User.objects.create_user(
                email=user_data['email'],
                username=user_data['username'],
                password=user_data['password'],
                role=user_data['role'],
                grade=user_data.get('grade', ''),
                grade_level=user_data.get('grade_level', ''),
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created user: {user.username} ({user.role})')
            )
        
        # Link student2 to parent
        try:
            parent = User.objects.get(email='parent@yeneta.com')
            student2 = User.objects.get(email='student2@yeneta.com')
            student2.parent = parent
            student2.save()
            self.stdout.write(
                self.style.SUCCESS(f'Linked {student2.username} to {parent.username}')
            )
        except User.DoesNotExist:
            pass
        
        self.stdout.write(
            self.style.SUCCESS('\n=== Test Users Created ===')
        )
        self.stdout.write('Admin: admin@yeneta.com / admin123')
        self.stdout.write('Teacher: teacher@yeneta.com / teacher123')
        self.stdout.write('Student: student@yeneta.com / student123')
        self.stdout.write('Parent: parent@yeneta.com / parent123')
        self.stdout.write('Student2: student2@yeneta.com / student123')
