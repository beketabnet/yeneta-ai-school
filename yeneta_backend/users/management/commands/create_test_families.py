from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Family, FamilyMembership

User = get_user_model()


class Command(BaseCommand):
    help = 'Create test families with members'

    def handle(self, *args, **options):
        # Get or create test users
        try:
            parent = User.objects.get(email='parent@yeneta.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('Parent user not found. Run create_test_users first.'))
            return

        try:
            student1 = User.objects.get(email='student@yeneta.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('Student user not found. Run create_test_users first.'))
            return

        try:
            student2 = User.objects.get(email='student2@yeneta.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('Student2 user not found. Run create_test_users first.'))
            return

        # Create test families
        families_data = [
            {
                'name': 'Parent Johnson',
                'members': [
                    {'user': parent, 'role': 'Parent/Guardian'},
                    {'user': student1, 'role': 'Student'},
                ]
            },
            {
                'name': 'Smith Family',
                'members': [
                    {'user': student2, 'role': 'Student'},
                ]
            },
            {
                'name': 'Anderson Household',
                'members': [
                    {'user': student1, 'role': 'Student'},
                ]
            },
        ]

        for family_data in families_data:
            # Check if family already exists
            family, created = Family.objects.get_or_create(name=family_data['name'])
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created family: {family.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Family {family.name} already exists.')
                )
            
            # Add members to family
            for member_data in family_data['members']:
                user = member_data['user']
                role = member_data['role']
                
                # Check if membership already exists
                membership, created = FamilyMembership.objects.get_or_create(
                    family=family,
                    user=user,
                    defaults={'role': role, 'is_active': True}
                )
                
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(f'  Added {user.username} ({role}) to {family.name}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'  {user.username} already in {family.name}')
                    )
        
        self.stdout.write(
            self.style.SUCCESS('\n=== Test Families Created ===')
        )
        self.stdout.write('Family 1: Parent Johnson (Parent + Student)')
        self.stdout.write('Family 2: Smith Family (Student)')
        self.stdout.write('Family 3: Anderson Household (Student)')
