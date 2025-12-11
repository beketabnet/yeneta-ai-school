"""
Management command to create test conversations between parents and teachers.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from communications.models import Conversation, Message

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates test conversations between parents and teachers'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating test conversations...')

        try:
            # Get users
            parent = User.objects.filter(role='Parent').first()
            teacher = User.objects.filter(role='Teacher').first()
            admin_user = User.objects.filter(role='Admin').first()

            if not parent:
                self.stdout.write(self.style.ERROR('No parent user found. Please create test users first.'))
                return

            if not teacher:
                self.stdout.write(self.style.ERROR('No teacher user found. Please create test users first.'))
                return

            # Check if conversation already exists between parent and teacher
            existing_conv = None
            for conv in Conversation.objects.all():
                participants = list(conv.participants.all())
                if parent in participants and teacher in participants:
                    existing_conv = conv
                    break

            if existing_conv:
                self.stdout.write(self.style.WARNING(f'Conversation between {parent.username} and {teacher.username} already exists'))
                conversation1 = existing_conv
                created1 = False
            else:
                # Create conversation between parent and teacher
                conversation1 = Conversation.objects.create()
                conversation1.participants.add(parent, teacher)
                created1 = True
                self.stdout.write(self.style.SUCCESS(f'Created conversation between {parent.username} and {teacher.username}'))

            if created1:
                # Add some test messages
                Message.objects.create(
                    conversation=conversation1,
                    sender=teacher,
                    content="Hello! I wanted to discuss your child's progress in class."
                )
                Message.objects.create(
                    conversation=conversation1,
                    sender=parent,
                    content="Thank you for reaching out! I'd love to hear about how they're doing."
                )
                Message.objects.create(
                    conversation=conversation1,
                    sender=teacher,
                    content="They're doing great! Very engaged in class activities."
                )
                self.stdout.write(self.style.SUCCESS('Added test messages to conversation'))

            # Create another conversation if admin exists
            if admin_user:
                # Check if conversation already exists between parent and admin
                existing_conv2 = None
                for conv in Conversation.objects.all():
                    participants = list(conv.participants.all())
                    if parent in participants and admin_user in participants:
                        existing_conv2 = conv
                        break

                if existing_conv2:
                    self.stdout.write(self.style.WARNING(f'Conversation between {parent.username} and {admin_user.username} already exists'))
                    created2 = False
                else:
                    conversation2 = Conversation.objects.create()
                    conversation2.participants.add(parent, admin_user)
                    created2 = True
                    self.stdout.write(self.style.SUCCESS(f'Created conversation between {parent.username} and {admin_user.username}'))

                    Message.objects.create(
                        conversation=conversation2,
                        sender=admin_user,
                        content="Welcome to Yeneta AI School! Feel free to reach out if you have any questions."
                    )
                    Message.objects.create(
                        conversation=conversation2,
                        sender=parent,
                        content="Thank you! Excited to be part of this community."
                    )
                    self.stdout.write(self.style.SUCCESS('Added test messages to second conversation'))

            self.stdout.write(self.style.SUCCESS('✅ Test conversations created successfully!'))
            self.stdout.write(self.style.SUCCESS(f'Parent: {parent.email}'))
            self.stdout.write(self.style.SUCCESS(f'Teacher: {teacher.email}'))
            if admin_user:
                self.stdout.write(self.style.SUCCESS(f'Admin: {admin_user.email}'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating conversations: {str(e)}'))
