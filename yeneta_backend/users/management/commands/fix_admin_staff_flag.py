from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Fix is_staff flag for Admin users'

    def handle(self, *args, **options):
        # Set is_staff=True for all Admin users
        admin_users = User.objects.filter(role='Admin', is_staff=False)
        count = admin_users.update(is_staff=True)
        self.stdout.write(self.style.SUCCESS(f'Updated {count} Admin users with is_staff=True'))

        # Set is_staff=False for non-Admin users (except superusers)
        non_admin_users = User.objects.exclude(role='Admin').filter(is_staff=True, is_superuser=False)
        count = non_admin_users.update(is_staff=False)
        self.stdout.write(self.style.SUCCESS(f'Updated {count} non-Admin users with is_staff=False'))

        # Verify
        admin_count = User.objects.filter(role='Admin', is_staff=True).count()
        self.stdout.write(self.style.SUCCESS(f'Total Admin users with is_staff=True: {admin_count}'))
