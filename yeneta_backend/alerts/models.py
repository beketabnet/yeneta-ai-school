from django.db import models
from django.conf import settings


class StudentFeedback(models.Model):
    """Model for student feedback to administrators."""
    
    STATUS_CHOICES = [
        ('New', 'New'),
        ('In Review', 'In Review'),
        ('Acknowledged', 'Acknowledged'),
        ('Resolved', 'Resolved'),
        ('Dismissed', 'Dismissed'),
    ]
    
    CATEGORY_CHOICES = [
        ('General', 'General'),
        ('Academic', 'Academic'),
        ('Technical', 'Technical'),
        ('Behavioral', 'Behavioral'),
        ('Other', 'Other'),
    ]
    
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feedbacks',
        limit_choices_to={'role': 'Student'}
    )
    message_content = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='General')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='New')
    
    # Assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_feedbacks',
        limit_choices_to={'role__in': ['Admin', 'Teacher']}
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_feedbacks'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Feedback from {self.student.username} - {self.category}"


class SmartAlert(models.Model):
    """Model for smart alerts about student engagement."""
    
    SENTIMENT_CHOICES = [
        ('Positive', 'Positive'),
        ('Neutral', 'Neutral'),
        ('Negative', 'Negative'),
        ('Unknown', 'Unknown'),
    ]
    
    STATUS_CHOICES = [
        ('New', 'New'),
        ('In Progress', 'In Progress'),
        ('Reviewed', 'Reviewed'),
        ('Resolved', 'Resolved'),
        ('Dismissed', 'Dismissed'),
    ]
    
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]
    
    CATEGORY_CHOICES = [
        ('Engagement', 'Engagement'),
        ('Academic', 'Academic'),
        ('Behavioral', 'Behavioral'),
        ('Emotional', 'Emotional'),
        ('Attendance', 'Attendance'),
        ('Other', 'Other'),
    ]
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='alerts',
        limit_choices_to={'role': 'Student'}
    )
    message_content = models.TextField()
    sentiment = models.CharField(max_length=20, choices=SENTIMENT_CHOICES, default='Unknown')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='New')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='Engagement')
    
    # AI Analysis Results
    severity = models.CharField(max_length=20, blank=True, null=True, help_text='AI-determined severity')
    analysis = models.TextField(blank=True, null=True, help_text='AI analysis of the alert')
    recommended_actions = models.JSONField(default=list, blank=True, help_text='List of recommended actions')
    requires_immediate_attention = models.BooleanField(default=False)
    suggested_response = models.TextField(blank=True, null=True, help_text='Suggested response for teacher')
    
    # Action Tracking
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_alerts',
        limit_choices_to={'role__in': ['Admin', 'Teacher']}
    )
    action_taken = models.TextField(blank=True, null=True, help_text='Actions taken to address the alert')
    resolution_notes = models.TextField(blank=True, null=True, help_text='Notes on how the alert was resolved')
    
    # Metadata
    source = models.CharField(max_length=100, default='AI Tutor', help_text='Source of the alert')
    context_data = models.JSONField(default=dict, blank=True, help_text='Additional context data')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'smart_alerts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Alert for {self.student.username} - {self.sentiment}"
