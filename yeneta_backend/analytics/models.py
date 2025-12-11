from django.db import models
from django.conf import settings

# Import engagement monitoring models
from .engagement_models import EngagementSession, EngagementSnapshot, EngagementSummary


class EngagementTrend(models.Model):
    """Model for tracking engagement trends over time."""
    
    date = models.DateField()
    active_users = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'engagement_trends'
        ordering = ['-date']
        unique_together = ['date']
    
    def __str__(self):
        return f"Engagement on {self.date}: {self.active_users} users"


class LearningOutcome(models.Model):
    """Model for tracking learning outcomes by subject."""
    
    subject = models.CharField(max_length=100)
    average_score = models.FloatField()
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'learning_outcomes'
        ordering = ['subject', '-date']
    
    def __str__(self):
        return f"{self.subject}: {self.average_score}%"
