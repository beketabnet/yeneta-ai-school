from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class SavedLessonPlan(models.Model):
    """
    Model for storing teacher-generated lesson plans.
    Supports save, export, and share functionality.
    """
    
    # Ownership and metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_lesson_plans',
        help_text="Teacher who created this lesson plan"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Basic lesson information
    title = models.CharField(max_length=255)
    grade = models.CharField(max_length=50)
    subject = models.CharField(max_length=100)
    topic = models.CharField(max_length=255)
    duration = models.IntegerField(
        validators=[MinValueValidator(15), MaxValueValidator(180)],
        help_text="Duration in minutes"
    )
    moe_standard_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Learning outcomes (UbD Stage 1)
    objectives = models.JSONField(default=list, help_text="List of learning objectives")
    essential_questions = models.JSONField(default=list, blank=True, null=True)
    enduring_understandings = models.JSONField(default=list, blank=True, null=True)
    moe_competencies = models.JSONField(default=list, blank=True, null=True)
    
    # Assessment plan (UbD Stage 2)
    assessment_plan = models.JSONField(blank=True, null=True, help_text="Formative checks, summative task, success criteria")
    
    # Resources
    materials = models.JSONField(default=list)
    teacher_preparation = models.JSONField(default=list, blank=True, null=True)
    resource_constraints = models.JSONField(blank=True, null=True)
    
    # 5E Instructional sequence
    five_e_sequence = models.JSONField(blank=True, null=True, help_text="5E phases with activities")
    
    # Legacy activities field for backward compatibility
    activities = models.JSONField(default=list, blank=True, null=True)
    
    # Differentiation
    differentiation_strategies = models.JSONField(default=list, blank=True, null=True)
    
    # Additional fields
    homework = models.TextField(blank=True, null=True)
    extensions = models.JSONField(default=list, blank=True, null=True)
    reflection_prompts = models.JSONField(default=list, blank=True, null=True)
    teacher_notes = models.TextField(blank=True, null=True)
    
    # Context metadata
    student_readiness = models.JSONField(blank=True, null=True)
    local_context = models.JSONField(blank=True, null=True)
    
    # RAG metadata
    rag_enabled = models.BooleanField(default=False)
    curriculum_sources = models.JSONField(default=list, blank=True, null=True)
    
    # Sharing and collaboration
    is_public = models.BooleanField(
        default=False,
        help_text="Whether this lesson plan is shared publicly with other teachers"
    )
    shared_with = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='shared_lesson_plans',
        blank=True,
        help_text="Specific teachers this plan is shared with"
    )
    
    # Usage tracking
    times_used = models.IntegerField(default=0)
    rating = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        help_text="Average rating from teachers who used this plan"
    )
    rating_count = models.IntegerField(default=0)
    
    # Tags for organization
    tags = models.JSONField(default=list, blank=True, null=True, help_text="Tags for categorization")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_by', '-created_at']),
            models.Index(fields=['grade', 'subject']),
            models.Index(fields=['is_public']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.grade} {self.subject}"
    
    def increment_usage(self):
        """Increment the usage counter"""
        self.times_used += 1
        self.save(update_fields=['times_used'])
    
    def add_rating(self, rating_value):
        """Add a new rating and update average"""
        if 0 <= rating_value <= 5:
            total_rating = self.rating * self.rating_count
            self.rating_count += 1
            self.rating = (total_rating + rating_value) / self.rating_count
            self.save(update_fields=['rating', 'rating_count'])
    
    def to_dict(self):
        """Convert to dictionary format matching frontend LessonPlan interface"""
        return {
            'id': self.id,
            'title': self.title,
            'grade': self.grade,
            'subject': self.subject,
            'topic': self.topic,
            'duration': self.duration,
            'moeStandardId': self.moe_standard_id,
            'objectives': self.objectives,
            'essentialQuestions': self.essential_questions,
            'enduring_understandings': self.enduring_understandings,
            'moeCompetencies': self.moe_competencies,
            'assessmentPlan': self.assessment_plan,
            'materials': self.materials,
            'teacherPreparation': self.teacher_preparation,
            'resourceConstraints': self.resource_constraints,
            'fiveESequence': self.five_e_sequence,
            'activities': self.activities,
            'differentiationStrategies': self.differentiation_strategies,
            'homework': self.homework,
            'extensions': self.extensions,
            'reflectionPrompts': self.reflection_prompts,
            'teacherNotes': self.teacher_notes,
            'studentReadiness': self.student_readiness,
            'localContext': self.local_context,
            'rag_enabled': self.rag_enabled,
            'curriculum_sources': self.curriculum_sources,
            'created_by': {
                'id': self.created_by.id,
                'username': self.created_by.username,
                'email': self.created_by.email,
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_public': self.is_public,
            'times_used': self.times_used,
            'rating': self.rating,
            'rating_count': self.rating_count,
            'tags': self.tags,
        }


class SavedLesson(models.Model):
    """
    Model for storing detailed generated lesson scripts.
    These are the full, scripted lessons generated from lesson plans.
    """
    
    # Ownership and metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_lessons',
        help_text="Teacher who generated this lesson"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Link to original plan (optional)
    lesson_plan = models.ForeignKey(
        SavedLessonPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_lessons',
        help_text="Original lesson plan this script was generated from"
    )
    
    # Basic info
    title = models.CharField(max_length=255)
    grade = models.CharField(max_length=50)
    subject = models.CharField(max_length=100)
    topic = models.CharField(max_length=255)
    
    # Content
    content = models.TextField(help_text="Full markdown content of the lesson script")
    
    # RAG metadata
    rag_enabled = models.BooleanField(default=False)
    curriculum_sources = models.JSONField(default=list, blank=True, null=True)
    
    # Sharing
    is_public = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_by', '-created_at']),
            models.Index(fields=['grade', 'subject']),
        ]
        
    def __str__(self):
        return f"Lesson Script: {self.title}"
        
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'grade': self.grade,
            'subject': self.subject,
            'topic': self.topic,
            'content': self.content,
            'rag_enabled': self.rag_enabled,
            'curriculum_sources': self.curriculum_sources,
            'created_by': {
                'id': self.created_by.id,
                'username': self.created_by.username,
                'email': self.created_by.email,
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_public': self.is_public,
        }


class LessonPlanRating(models.Model):
    """
    Individual ratings for lesson plans by teachers who used them.
    """
    lesson_plan = models.ForeignKey(
        SavedLessonPlan,
        on_delete=models.CASCADE,
        related_name='ratings'
    )
    rated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lesson_plan_ratings'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['lesson_plan', 'rated_by']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.rated_by.username} rated {self.lesson_plan.title}: {self.rating}/5"


class SavedRubric(models.Model):
    """
    Model for storing AI-generated assessment rubrics.
    Supports multiple rubric types and advanced features from research.
    """
    
    RUBRIC_TYPE_CHOICES = [
        ('analytic', 'Analytic Rubric'),
        ('holistic', 'Holistic Rubric'),
        ('single_point', 'Single-Point Rubric'),
        ('checklist', 'Checklist Rubric'),
    ]
    
    # Ownership and metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_rubrics',
        help_text="Teacher who created this rubric"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Basic rubric information
    title = models.CharField(max_length=255)
    topic = models.CharField(max_length=255)
    grade_level = models.CharField(max_length=50)
    subject = models.CharField(max_length=100, blank=True, null=True)
    rubric_type = models.CharField(
        max_length=20,
        choices=RUBRIC_TYPE_CHOICES,
        default='analytic',
        help_text="Type of rubric structure"
    )
    
    # Standards alignment
    moe_standard_id = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Ethiopian MoE Curriculum Standard ID"
    )
    learning_objectives = models.JSONField(
        default=list,
        blank=True,
        null=True,
        help_text="Learning objectives this rubric assesses"
    )
    
    # Rubric structure and content
    criteria = models.JSONField(
        default=list,
        help_text="List of assessment criteria with performance levels"
    )
    total_points = models.IntegerField(
        default=100,
        validators=[MinValueValidator(1)],
        help_text="Total possible points for this rubric"
    )
    
    # Advanced features
    weighting_enabled = models.BooleanField(
        default=False,
        help_text="Whether criteria have different weights"
    )
    multimodal_assessment = models.BooleanField(
        default=False,
        help_text="Whether rubric includes multimodal criteria (visual, audio, etc.)"
    )
    
    # Quality metadata
    alignment_validated = models.BooleanField(
        default=False,
        help_text="Whether criteria alignment with objectives was validated"
    )
    alignment_score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="AI-calculated alignment score (0-1)"
    )
    
    # Configuration options
    performance_levels = models.JSONField(
        default=list,
        help_text="Custom performance level labels (e.g., Advanced, Proficient)"
    )
    tone_preference = models.CharField(
        max_length=50,
        default='professional',
        help_text="Tone/language preference for descriptions"
    )
    
    # Usage and sharing
    is_public = models.BooleanField(
        default=False,
        help_text="Whether this rubric is shared publicly"
    )
    times_used = models.IntegerField(default=0)
    
    # Tags and categorization
    tags = models.JSONField(
        default=list,
        blank=True,
        null=True,
        help_text="Tags for organization"
    )
    
    # Notes
    teacher_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Private notes for the teacher"
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_by', '-created_at']),
            models.Index(fields=['grade_level', 'subject']),
            models.Index(fields=['rubric_type']),
            models.Index(fields=['is_public']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.grade_level} ({self.rubric_type})"
    
    def increment_usage(self):
        """Increment the usage counter"""
        self.times_used += 1
        self.save(update_fields=['times_used'])
    
    def to_dict(self):
        """Convert to dictionary format for API responses"""
        return {
            'id': self.id,
            'title': self.title,
            'topic': self.topic,
            'grade_level': self.grade_level,
            'subject': self.subject,
            'rubric_type': self.rubric_type,
            'moe_standard_id': self.moe_standard_id,
            'learning_objectives': self.learning_objectives,
            'criteria': self.criteria,
            'total_points': self.total_points,
            'weighting_enabled': self.weighting_enabled,
            'multimodal_assessment': self.multimodal_assessment,
            'alignment_validated': self.alignment_validated,
            'alignment_score': self.alignment_score,
            'performance_levels': self.performance_levels,
            'tone_preference': self.tone_preference,
            'is_public': self.is_public,
            'times_used': self.times_used,
            'tags': self.tags,
            'teacher_notes': self.teacher_notes,
            'created_by': {
                'id': self.created_by.id,
                'username': self.created_by.username,
                'email': self.created_by.email,
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }


class SharedFile(models.Model):
    """
    Model for tracking shared lesson plans and rubrics between users.
    Supports notifications and access control.
    """
    CONTENT_TYPE_CHOICES = [
        ('lesson_plan', 'Lesson Plan'),
        ('rubric', 'Rubric'),
        ('lesson', 'Lesson'),
    ]
    
    # Sharing metadata
    shared_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='files_shared',
        help_text="User who shared the file"
    )
    shared_with = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='files_received',
        help_text="User who received the file"
    )
    shared_at = models.DateTimeField(auto_now_add=True)
    
    # Content reference
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    lesson_plan = models.ForeignKey(
        'SavedLessonPlan',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='shares'
    )
    rubric = models.ForeignKey(
        'SavedRubric',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='shares'
    )
    lesson = models.ForeignKey(
        'SavedLesson',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='shares'
    )
    
    # Notification and access tracking
    is_viewed = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(null=True, blank=True)
    message = models.TextField(blank=True, help_text="Optional message from sender")
    
    class Meta:
        ordering = ['-shared_at']
        indexes = [
            models.Index(fields=['shared_with', 'is_viewed']),
            models.Index(fields=['shared_by', 'shared_at']),
        ]
    
    def __str__(self):
        if self.lesson_plan:
            content = self.lesson_plan.title
        elif self.rubric:
            content = self.rubric.title
        elif self.lesson:
            content = self.lesson.title
        else:
            content = "Unknown Content"
            
        return f"{self.shared_by.username} shared {content} with {self.shared_with.username}"
    
    def mark_as_viewed(self):
        """Mark the shared file as viewed"""
        if not self.is_viewed:
            from django.utils import timezone
            self.is_viewed = True
            self.viewed_at = timezone.now()
            self.save()
    
    def get_content(self):
        """Get the actual content object"""
        if self.lesson_plan:
            return self.lesson_plan
        elif self.rubric:
            return self.rubric
        elif self.lesson:
            return self.lesson
        return None
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        content = self.get_content()
        return {
            'id': self.id,
            'content_type': self.content_type,
            'content_id': content.id if content else None,
            'content_title': content.title if content else None,
            'content_data': content.to_dict() if content and hasattr(content, 'to_dict') else None,
            'shared_by': {
                'id': self.shared_by.id,
                'username': self.shared_by.username,
                'email': self.shared_by.email,
            },
            'shared_with': {
                'id': self.shared_with.id,
                'username': self.shared_with.username,
                'email': self.shared_with.email,
            },
            'shared_at': self.shared_at.isoformat(),
            'is_viewed': self.is_viewed,
            'viewed_at': self.viewed_at.isoformat() if self.viewed_at else None,
            'message': self.message,
        }


class TutorConfiguration(models.Model):
    """
    Model for saving student's AI Tutor curriculum configuration preferences.
    Stores grade, stream, subject, and chapter selections for personalized tutoring.
    """
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tutor_configuration',
        help_text="Student user who owns this configuration"
    )
    
    # Curriculum configuration
    use_ethiopian_curriculum = models.BooleanField(
        default=True,
        help_text="Whether to use Ethiopian curriculum for tutoring"
    )
    grade = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Selected grade level (e.g., 'Grade 7', 'Grade 11')"
    )
    stream = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Selected stream for Grades 11-12 (e.g., 'Natural Science', 'Social Science')"
    )
    subject = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Selected subject (e.g., 'Mathematics', 'Physics')"
    )
    chapter_input = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Chapter/Unit/Lesson input (e.g., 'Chapter 3: Photosynthesis')"
    )
    
    # Extracted chapter metadata (populated when chapter is saved)
    chapter_number = models.IntegerField(
        null=True,
        blank=True,
        help_text="Normalized chapter number extracted from chapter_input"
    )
    chapter_title = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Extracted chapter title"
    )
    chapter_topics = models.JSONField(
        default=list,
        blank=True,
        null=True,
        help_text="List of topics extracted from the chapter content"
    )
    chapter_summary = models.TextField(
        blank=True,
        null=True,
        help_text="Brief summary of chapter content for welcome message"
    )
    learning_objectives = models.JSONField(
        default=list,
        blank=True,
        null=True,
        help_text="Learning objectives extracted from the chapter content"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time this configuration was used for tutoring"
    )
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['grade', 'subject']),
        ]
        verbose_name = "Tutor Configuration"
        verbose_name_plural = "Tutor Configurations"
    
    def __str__(self):
        config_parts = []
        if self.grade:
            config_parts.append(self.grade)
        if self.stream:
            config_parts.append(self.stream)
        if self.subject:
            config_parts.append(self.subject)
        if self.chapter_input:
            config_parts.append(f"Ch: {self.chapter_input}")
        config_str = " - ".join(config_parts) if config_parts else "Default"
        return f"{self.user.username}: {config_str}"
    
    def update_usage(self):
        """Update the last_used_at timestamp"""
        from django.utils import timezone
        self.last_used_at = timezone.now()
        self.save(update_fields=['last_used_at'])
    
    def to_dict(self):
        """Convert to dictionary format for API responses"""
        return {
            'id': self.id,
            'use_ethiopian_curriculum': self.use_ethiopian_curriculum,
            'grade': self.grade,
            'stream': self.stream,
            'subject': self.subject,
            'chapter_input': self.chapter_input,
            'chapter_number': self.chapter_number,
            'chapter_title': self.chapter_title,
            'chapter_topics': self.chapter_topics or [],
            'chapter_summary': self.chapter_summary,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
        }
