from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Set passwords for existing test users and accounts'

    def handle(self, *args, **options):
        accounts = [
            {'email': 'admin@yeneta.com', 'password': 'admin123', 'description': 'Administrator'},
            {'email': 'teacher@yeneta.com', 'password': 'teacher123', 'description': 'Teacher Smith'},
            {'email': 'student@yeneta.com', 'password': 'student123', 'description': 'John Student'},
            {'email': 'student2@yeneta.com', 'password': 'student123', 'description': 'Jane Student'},
            {'email': 'parent@yeneta.com', 'password': 'parent123', 'description': 'Parent Johnson'},
            {'email': 'admin@yeneta.ai', 'password': 'admin123', 'description': 'Admin (yeneta.ai)'},
            {'email': 'parent@yeneta.ai', 'password': 'parent123', 'description': 'Parent (yeneta.ai)'},
            {'email': 'newteacher@yeneta.com', 'password': 'teacher123', 'description': 'New Teacher'},
            {'email': 'abinetalemu2018@gmail.com', 'password': 'abinet123', 'description': 'Abinet'},
            {'email': 'admin_test@example.com', 'password': 'admin123', 'description': 'Admin Test'},
            {'email': 'teacher_test@example.com', 'password': 'teacher123', 'description': 'Teacher Test'},
        ]

        success_count = 0
        failed_count = 0

        for account in accounts:
            email = account['email']
            password = account['password']
            description = account['description']

            try:
                user = User.objects.get(email=email)
                user.set_password(password)
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'[OK] Password set for {description} ({email})'
                    )
                )
                success_count += 1
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(
                        f'[NOT FOUND] User not found: {description} ({email})'
                    )
                )
                failed_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'[ERROR] Error setting password for {description} ({email}): {str(e)}'
                    )
                )
                failed_count += 1

        self.stdout.write('\n' + '='*60)
        self.stdout.write(
            self.style.SUCCESS(
                f'Passwords set for {success_count} accounts'
            )
        )
        if failed_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    f'Failed/not found: {failed_count} accounts'
                )
            )
        self.stdout.write('='*60)
