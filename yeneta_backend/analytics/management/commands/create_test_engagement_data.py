"""
Management command to create test engagement data for demonstration
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from analytics.engagement_models import EngagementSession, EngagementSnapshot
from analytics.engagement_service import EngagementService
from users.models import User


class Command(BaseCommand):
    help = 'Create test engagement data for demonstration'

    def handle(self, *args, **options):
        self.stdout.write('Creating test engagement data...')
        
        # Get test student
        try:
            student = User.objects.get(email='student@yeneta.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('Student user not found. Please create test users first.'))
            return
        
        # Create completed sessions from past 7 days
        expressions = ['happy', 'neutral', 'sad', 'angry', 'fearful', 'disgusted', 'surprised']
        subjects = ['Mathematics', 'Science', 'English', 'History']
        activities = ['AI Tutor', 'Practice Labs', 'Reading', 'Assignment']
        
        sessions_created = 0
        
        for day in range(7):
            # Create 1-3 sessions per day
            num_sessions = random.randint(1, 3)
            date = timezone.now() - timedelta(days=day)
            
            for _ in range(num_sessions):
                # Create session
                session_start = date - timedelta(hours=random.randint(8, 20))
                duration_minutes = random.randint(10, 60)
                
                session = EngagementSession.objects.create(
                    student=student,
                    started_at=session_start,
                    ended_at=session_start + timedelta(minutes=duration_minutes),
                    duration_seconds=duration_minutes * 60,
                    subject=random.choice(subjects),
                    activity_type=random.choice(activities),
                    is_active=False
                )
                
                # Create snapshots for the session
                num_snapshots = duration_minutes // 5  # One snapshot every 5 minutes
                
                for i in range(num_snapshots):
                    snapshot_time = session_start + timedelta(minutes=i * 5)
                    expression = random.choice(expressions)
                    person_detected = random.random() > 0.1  # 90% person detected
                    
                    # Weight expressions based on time of day
                    hour = snapshot_time.hour
                    if hour < 10 or hour > 20:  # Early morning or late night
                        expression = random.choice(['neutral', 'sad', 'fearful'])
                    elif 10 <= hour <= 14:  # Mid-day
                        expression = random.choice(['happy', 'neutral', 'surprised'])
                    
                    EngagementSnapshot.objects.create(
                        session=session,
                        timestamp=snapshot_time,
                        expression=expression,
                        person_detected=person_detected,
                        confidence=random.uniform(0.7, 0.95) if person_detected else 0.0
                    )
                    
                    # Update session counters
                    expression_field = f"{expression}_count"
                    if hasattr(session, expression_field):
                        setattr(session, expression_field, getattr(session, expression_field) + 1)
                    
                    if person_detected:
                        session.person_detected_count += 1
                
                # Calculate metrics
                session.calculate_metrics()
                sessions_created += 1
                
                self.stdout.write(f"  Created session: {session.subject} - {duration_minutes}min - Score: {session.engagement_score:.1f}")
        
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created {sessions_created} test sessions!'))
        
        # Generate daily summaries
        self.stdout.write('\nGenerating daily summaries...')
        for day in range(7):
            date = (timezone.now() - timedelta(days=day)).date()
            summary = EngagementService.generate_daily_summary(date)
            if summary:
                self.stdout.write(f"  Summary for {date}: {summary.total_sessions} sessions, avg score: {summary.average_engagement_score:.1f}")
        
        self.stdout.write(self.style.SUCCESS('\nTest engagement data created successfully!'))
