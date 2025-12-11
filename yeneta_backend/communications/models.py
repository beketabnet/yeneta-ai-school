from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator


class Conversation(models.Model):
    """Model for conversations between users."""
    
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Conversation {self.id}"
    
    @property
    def last_message(self):
        return self.messages.first()


class Message(models.Model):
    """Model for messages within conversations."""
    
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField(blank=True, default='')
    attachment = models.FileField(upload_to='message_attachments/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messages'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Message from {self.sender.username} at {self.created_at}"


class SharedFileNotification(models.Model):
    """Model for tracking shared file notifications to users."""
    
    shared_file = models.ForeignKey(
        'ai_tools.SharedFile',
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='file_notifications'
    )
    is_read = models.BooleanField(default=False)
    is_downloaded = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'shared_file_notifications'
        ordering = ['-created_at']
        unique_together = ['shared_file', 'recipient']
    
    def __str__(self):
        return f"Notification for {self.recipient.username} - {self.shared_file.title}"


class StudentAssignment(models.Model):
    """Model for student assignment submissions."""
    
    DOCUMENT_TYPES = [
        ('essay', 'Essay'),
        ('research_paper', 'Research Paper'),
        ('lab_report', 'Lab Report'),
        ('presentation', 'Presentation'),
        ('project', 'Project'),
        ('homework', 'Homework'),
        ('quiz', 'Quiz'),
        ('exam', 'Exam'),
        ('group_work', 'Group Work'),
        ('creative_writing', 'Creative Writing'),
        ('critical_analysis', 'Critical Analysis'),
        ('assignment', 'General Assignment'),
        ('other', 'Other'),
    ]
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submitted_assignments',
        limit_choices_to={'role': 'Student'}
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_assignments',
        limit_choices_to={'role': 'Teacher'}
    )
    assignment_topic = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    file = models.FileField(
        upload_to='student_assignments/%Y/%m/',
        validators=[FileExtensionValidator(
            allowed_extensions=['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'jpg', 'jpeg', 'png']
        )]
    )
    description = models.TextField(blank=True, default='')
    grade_level = models.CharField(max_length=50, blank=True)
    subject = models.CharField(max_length=100, blank=True)
    
    # Grading status
    is_graded = models.BooleanField(default=False)
    grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True, default='')
    
    # Authenticity Check
    authenticity_score = models.FloatField(null=True, blank=True)
    ai_likelihood = models.FloatField(null=True, blank=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'student_assignments'
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"{self.assignment_topic} - {self.student.username} to {self.teacher.username}"


class Notification(models.Model):
    """Model for notifications about course requests and enrollments."""

    NOTIFICATION_TYPES = [
        ('course_request_approved', 'Course Request Approved'),
        ('course_request_declined', 'Course Request Declined'),
        ('course_request_under_review', 'Course Request Under Review'),
        ('enrollment_request_approved', 'Enrollment Request Approved'),
        ('enrollment_request_declined', 'Enrollment Request Declined'),
        ('enrollment_request_under_review', 'Enrollment Request Under Review'),
        ('new_course_request', 'New Course Request'),
        ('new_enrollment_request', 'New Enrollment Request'),
        ('system_alert', 'System Alert'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    related_course_request = models.ForeignKey(
        'academics.TeacherCourseRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    related_enrollment_request = models.ForeignKey(
        'academics.StudentEnrollmentRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"
