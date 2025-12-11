"""
Enhanced models for Live Engagement Monitoring
Tracks real-time student engagement data from webcam monitoring
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class EngagementSession(models.Model):
    """Model for tracking individual student engagement sessions."""
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='engagement_sessions',
        limit_choices_to={'role': 'Student'}
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0, help_text='Total session duration in seconds')
    
    # Session context
    subject = models.CharField(max_length=100, blank=True, null=True)
    activity_type = models.CharField(
        max_length=50,
        choices=[
            ('AI Tutor', 'AI Tutor'),
            ('Practice Labs', 'Practice Labs'),
            ('Reading', 'Reading'),
            ('Assignment', 'Assignment'),
            ('Other', 'Other')
        ],
        default='Other'
    )
    
    # Aggregated metrics
    total_detections = models.IntegerField(default=0)
    person_detected_count = models.IntegerField(default=0)
    person_detected_percentage = models.FloatField(default=0.0)
    
    # Expression distribution (stored as counts)
    happy_count = models.IntegerField(default=0)
    neutral_count = models.IntegerField(default=0)
    sad_count = models.IntegerField(default=0)
    angry_count = models.IntegerField(default=0)
    fearful_count = models.IntegerField(default=0)
    disgusted_count = models.IntegerField(default=0)
    surprised_count = models.IntegerField(default=0)
    unknown_count = models.IntegerField(default=0)
    
    # Dominant expression
    dominant_expression = models.CharField(max_length=20, default='unknown')
    
    # Attention metrics
    attention_required_count = models.IntegerField(default=0, help_text='Count of concerning expressions')
    attention_percentage = models.FloatField(default=0.0)
    
    # Overall engagement score (0-100)
    engagement_score = models.FloatField(default=0.0)
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'engagement_sessions'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['student', '-started_at']),
            models.Index(fields=['is_active']),
            models.Index(fields=['-started_at']),
        ]
    
    def __str__(self):
        return f"{self.student.username} - {self.started_at.strftime('%Y-%m-%d %H:%M')}"
    
    def calculate_metrics(self):
        """Calculate aggregated metrics from expression counts."""
        total = (self.happy_count + self.neutral_count + self.sad_count + 
                self.angry_count + self.fearful_count + self.disgusted_count + 
                self.surprised_count + self.unknown_count)
        
        if total > 0:
            # Calculate person detected percentage
            self.person_detected_percentage = (self.person_detected_count / total) * 100
            
            # Find dominant expression
            expressions = {
                'happy': self.happy_count,
                'neutral': self.neutral_count,
                'sad': self.sad_count,
                'angry': self.angry_count,
                'fearful': self.fearful_count,
                'disgusted': self.disgusted_count,
                'surprised': self.surprised_count,
                'unknown': self.unknown_count
            }
            self.dominant_expression = max(expressions, key=expressions.get)
            
            # Calculate attention metrics
            self.attention_required_count = (self.sad_count + self.angry_count + 
                                            self.fearful_count + self.disgusted_count)
            self.attention_percentage = (self.attention_required_count / total) * 100
            
            # Calculate engagement score (0-100)
            # Higher score = more positive engagement
            positive_weight = (self.happy_count * 1.0 + self.surprised_count * 0.8 + 
                             self.neutral_count * 0.6)
            negative_weight = (self.sad_count * 0.3 + self.angry_count * 0.2 + 
                             self.fearful_count * 0.2 + self.disgusted_count * 0.2)
            
            self.engagement_score = min(100, max(0, (positive_weight / total) * 100 - 
                                                    (negative_weight / total) * 20))
        
        self.total_detections = total
        self.save()
    
    def end_session(self):
        """End the session and calculate final metrics."""
        if not self.ended_at:
            self.ended_at = timezone.now()
            self.duration_seconds = int((self.ended_at - self.started_at).total_seconds())
            self.is_active = False
            self.calculate_metrics()
            self.save()


class EngagementSnapshot(models.Model):
    """Model for storing individual engagement detection snapshots."""
    
    session = models.ForeignKey(
        EngagementSession,
        on_delete=models.CASCADE,
        related_name='snapshots'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    expression = models.CharField(
        max_length=20,
        choices=[
            ('happy', 'Happy'),
            ('neutral', 'Neutral'),
            ('sad', 'Sad'),
            ('angry', 'Angry'),
            ('fearful', 'Fearful'),
            ('disgusted', 'Disgusted'),
            ('surprised', 'Surprised'),
            ('unknown', 'Unknown')
        ]
    )
    person_detected = models.BooleanField(default=False)
    confidence = models.FloatField(default=0.0, help_text='Detection confidence 0-1')
    
    # Optional: Store detected objects for context
    detected_objects = models.JSONField(default=list, blank=True)
    
    class Meta:
        db_table = 'engagement_snapshots'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['session', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.session.student.username} - {self.expression} at {self.timestamp}"


class EngagementSummary(models.Model):
    """Model for daily/hourly engagement summaries for analytics."""
    
    date = models.DateField()
    hour = models.IntegerField(null=True, blank=True, help_text='Hour of day (0-23) for hourly summaries')
    
    # Aggregated metrics across all students
    total_sessions = models.IntegerField(default=0)
    total_students = models.IntegerField(default=0)
    total_duration_seconds = models.IntegerField(default=0)
    average_duration_seconds = models.IntegerField(default=0)
    
    # Expression distribution
    happy_percentage = models.FloatField(default=0.0)
    neutral_percentage = models.FloatField(default=0.0)
    sad_percentage = models.FloatField(default=0.0)
    angry_percentage = models.FloatField(default=0.0)
    fearful_percentage = models.FloatField(default=0.0)
    disgusted_percentage = models.FloatField(default=0.0)
    surprised_percentage = models.FloatField(default=0.0)
    unknown_percentage = models.FloatField(default=0.0)
    
    # Overall metrics
    average_engagement_score = models.FloatField(default=0.0)
    attention_required_percentage = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'engagement_summaries'
        ordering = ['-date', '-hour']
        unique_together = ['date', 'hour']
        indexes = [
            models.Index(fields=['-date']),
        ]
    
    def __str__(self):
        if self.hour is not None:
            return f"Summary for {self.date} {self.hour}:00"
        return f"Summary for {self.date}"
