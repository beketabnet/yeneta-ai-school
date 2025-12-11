"""
Management command to create test smart alerts for demonstration and testing.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from alerts.models import SmartAlert
from users.models import User


class Command(BaseCommand):
    help = 'Create test smart alerts for demonstration'

    def handle(self, *args, **options):
        self.stdout.write('Creating test smart alerts...')
        
        # Get or create test users
        try:
            student = User.objects.get(email='student@yeneta.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('Student user not found. Please create test users first.'))
            return
        
        # Sample alerts with different priorities and categories
        test_alerts = [
            {
                'student': student,
                'message_content': "I don't understand this math problem at all. I've been trying for hours and I'm so frustrated.",
                'sentiment': 'Negative',
                'status': 'New',
                'priority': 'High',
                'category': 'Academic',
                'requires_immediate_attention': False,
                'source': 'AI Tutor',
                'context_data': {'subject': 'Mathematics', 'topic': 'Algebra'}
            },
            {
                'student': student,
                'message_content': "I'm feeling really sad today. Nobody wants to work with me on group projects.",
                'sentiment': 'Negative',
                'status': 'New',
                'priority': 'Critical',
                'category': 'Emotional',
                'requires_immediate_attention': True,
                'source': 'AI Tutor',
                'context_data': {'subject': 'General', 'topic': 'Social Issues'}
            },
            {
                'student': student,
                'message_content': "Thank you so much! That explanation really helped me understand the concept better.",
                'sentiment': 'Positive',
                'status': 'Reviewed',
                'priority': 'Low',
                'category': 'Engagement',
                'requires_immediate_attention': False,
                'source': 'AI Tutor',
                'context_data': {'subject': 'Science', 'topic': 'Physics'}
            },
            {
                'student': student,
                'message_content': "I'm confused about the homework assignment. What are we supposed to do?",
                'sentiment': 'Neutral',
                'status': 'New',
                'priority': 'Medium',
                'category': 'Academic',
                'requires_immediate_attention': False,
                'source': 'AI Tutor',
                'context_data': {'subject': 'English', 'topic': 'Assignment'}
            },
            {
                'student': student,
                'message_content': "I keep getting distracted during class. I can't focus on anything.",
                'sentiment': 'Negative',
                'status': 'In Progress',
                'priority': 'High',
                'category': 'Behavioral',
                'requires_immediate_attention': False,
                'source': 'Engagement Monitor',
                'context_data': {'expression': 'distracted', 'duration_minutes': 25}
            },
        ]
        
        created_count = 0
        for alert_data in test_alerts:
            # Check if similar alert already exists
            existing = SmartAlert.objects.filter(
                student=alert_data['student'],
                message_content=alert_data['message_content']
            ).first()
            
            if not existing:
                SmartAlert.objects.create(**alert_data)
                created_count += 1
                self.stdout.write(f"  Created alert: {alert_data['category']} - {alert_data['priority']}")
            else:
                self.stdout.write(f"  Skipped duplicate: {alert_data['category']}")
        
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created {created_count} test alerts!'))
        self.stdout.write(f'Total alerts in database: {SmartAlert.objects.count()}')
