from django.db import models
from django.conf import settings
from .models import Course

class OnlineQuiz(models.Model):
    """Model for online quizzes and exams."""
    
    QUIZ_TYPES = [
        ('Quiz', 'Quiz'),
        ('Mid Exam', 'Mid Exam'),
        ('Final Exam', 'Final Exam'),
    ]
    
    DIFFICULTY_LEVELS = [
        ('Easy', 'Easy'),
        ('Medium', 'Medium'),
        ('Difficult', 'Difficult'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    quiz_type = models.CharField(max_length=20, choices=QUIZ_TYPES, default='Quiz')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='quizzes', null=True, blank=True)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_quizzes',
        limit_choices_to={'role': 'Teacher'}
    )
    
    # Sharing
    shared_with = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='shared_quizzes',
        blank=True,
        limit_choices_to={'role': 'Student'},
        help_text="Students who have been explicitly valid to take this quiz"
    )
    
    # Configuration
    subject = models.CharField(max_length=100)
    grade_level = models.CharField(max_length=10)
    stream = models.CharField(max_length=50, blank=True, null=True)
    chapter = models.CharField(max_length=100, blank=True)
    topic = models.CharField(max_length=200, blank=True)
    
    # Settings
    duration_minutes = models.IntegerField(default=30, help_text="Duration in minutes")
    is_published = models.BooleanField(default=False)
    allow_retake = models.BooleanField(default=False)
    show_results_immediately = models.BooleanField(default=True)
    
    # AI Generation Settings
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_LEVELS, default='Medium')
    use_rag = models.BooleanField(default=False, help_text="Whether RAG was used for generation")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'online_quizzes'
        ordering = ['-created_at']
        verbose_name = 'Online Quiz'
        verbose_name_plural = 'Online Quizzes'
        
    def __str__(self):
        return f"{self.title} ({self.subject} - Grade {self.grade_level})"


class Question(models.Model):
    """Model for quiz questions."""
    
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'), # Explain/Define
        ('essay', 'Essay'),
        ('work_out', 'Work Out'), # Mathematical
    ]
    
    quiz = models.ForeignKey(OnlineQuiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    points = models.FloatField(default=1.0)
    time_limit = models.IntegerField(null=True, blank=True, help_text="Time limit in seconds for this question")
    
    # For Multiple Choice
    options = models.JSONField(default=list, blank=True, help_text="List of options for multiple choice")
    correct_answer = models.TextField(help_text="Correct answer text or option index")
    
    explanation = models.TextField(blank=True, help_text="Explanation for the correct answer")
    hint = models.TextField(blank=True)
    
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'quiz_questions'
        ordering = ['order']
        
    def __str__(self):
        return f"{self.quiz.title} - Q{self.order}: {self.text[:50]}..."


class QuizAttempt(models.Model):
    """Model for a student's attempt at a quiz."""
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quiz_attempts',
        limit_choices_to={'role': 'Student'}
    )
    quiz = models.ForeignKey(OnlineQuiz, on_delete=models.CASCADE, related_name='attempts')
    
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    
    score = models.FloatField(null=True, blank=True)
    max_score = models.FloatField(default=0)
    
    is_completed = models.BooleanField(default=False)
    
    # AI Grading
    ai_feedback = models.TextField(blank=True)
    
    # Resume Functionality
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    pause_count = models.IntegerField(default=0)
    last_paused_at = models.DateTimeField(null=True, blank=True)
    current_question_index = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'quiz_attempts'
        ordering = ['-start_time']
        
    def __str__(self):
        return f"{self.student.username} - {self.quiz.title}"


class QuestionResponse(models.Model):
    """Model for a student's response to a specific question."""
    
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='responses')
    
    response_text = models.TextField()
    is_correct = models.BooleanField(null=True, blank=True)
    score = models.FloatField(default=0)
    feedback = models.TextField(blank=True)
    
    class Meta:
        db_table = 'question_responses'
        unique_together = ['attempt', 'question']
        
    def __str__(self):
        return f"{self.attempt.student.username} - Q{self.question.order}"
