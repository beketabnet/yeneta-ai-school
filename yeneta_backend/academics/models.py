from django.db import models
from django.conf import settings


class Assignment(models.Model):
    """Model for assignments."""
    
    DOCUMENT_TYPES = [
        ('assignment', 'General Assignment'),
        ('essay', 'Essay / Written Assignment'),
        ('exam', 'Examination'),
        ('project', 'Project / Research Paper'),
        ('group_work', 'Group Work / Collaboration'),
        ('lab_report', 'Lab Report'),
        ('presentation', 'Presentation'),
        ('homework', 'Homework Assignment'),
        ('quiz', 'Quiz / Short Answer'),
        ('creative_writing', 'Creative Writing'),
        ('critical_analysis', 'Critical Analysis'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    rubric = models.TextField(blank=True)
    document_type = models.CharField(
        max_length=50,
        choices=DOCUMENT_TYPES,
        default='essay',
        help_text='Type of document for this assignment'
    )
    due_date = models.DateTimeField()
    course = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_assignments'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assignments'
        ordering = ['-due_date']
    
    def __str__(self):
        return self.title


class Submission(models.Model):
    """Model for assignment submissions."""
    
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    submitted_text = models.TextField()
    submitted_file = models.FileField(upload_to='submissions/', blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    grade = models.FloatField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    authenticity_score = models.FloatField(null=True, blank=True)
    ai_likelihood = models.FloatField(null=True, blank=True)
    
    class Meta:
        db_table = 'submissions'
        ordering = ['-submitted_at']
        unique_together = ['assignment', 'student']
    
    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}"


class PracticeQuestion(models.Model):
    """Model for practice questions."""
    
    subject = models.CharField(max_length=100)
    topic = models.CharField(max_length=200)
    question = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'practice_questions'
        ordering = ['subject', 'topic']
    
    def __str__(self):
        return f"{self.subject} - {self.topic}"


class Course(models.Model):
    """Model for courses."""
    
    title = models.CharField(max_length=255)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='taught_courses',
        limit_choices_to={'role': 'Teacher'}
    )
    grade_level = models.CharField(max_length=50)
    subject = models.CharField(max_length=100)
    stream = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'courses'
        ordering = ['title']
    
    def __str__(self):
        return self.title


class Enrollment(models.Model):
    """Model for student course enrollments."""
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role': 'Student'}
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'enrollments'
        unique_together = ['student', 'course']
        ordering = ['-enrolled_at']
    
    def __str__(self):
        return f"{self.student.username} - {self.course.title}"


class Unit(models.Model):
    """Model for course units."""
    
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='units'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    duration_days = models.IntegerField(null=True, blank=True, help_text="Expected duration of unit in days")
    learning_objectives = models.TextField(blank=True, help_text="Comma-separated list of learning objectives")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'units'
        ordering = ['course', 'order']
        indexes = [
            models.Index(fields=['course', 'order']),
        ]
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"


class GradeItem(models.Model):
    """Model for gradeable items (assignments, quizzes, exams)."""
    
    ITEM_TYPES = [
        ('Assignment', 'Assignment'),
        ('Quiz', 'Quiz'),
        ('Exam', 'Exam'),
        ('Project', 'Project'),
        ('Participation', 'Participation'),
    ]
    
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name='grade_items'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES)
    max_score = models.FloatField(default=100)
    weight = models.FloatField(default=1.0, help_text="Weight for weighted grading")
    due_date = models.DateTimeField(null=True, blank=True)
    release_date = models.DateTimeField(null=True, blank=True, help_text="When the assignment becomes available")
    instructions = models.TextField(blank=True, help_text="Detailed instructions for the assignment")
    rubric = models.TextField(blank=True, help_text="Grading rubric for this item")
    is_active = models.BooleanField(default=True, help_text="Whether this grade item is currently active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'grade_items'
        ordering = ['unit', 'due_date']
        indexes = [
            models.Index(fields=['unit', 'due_date']),
            models.Index(fields=['unit', 'item_type']),
        ]
    
    def __str__(self):
        return f"{self.unit.course.title} - {self.title}"


class MasterCourse(models.Model):
    """Model for the master catalog of courses managed by admins."""
    REGION_CHOICES = [
        ('Tigray', 'Tigray'),
        ('Afar', 'Afar'),
        ('Amhara', 'Amhara'),
        ('Oromia', 'Oromia'),
        ('Somali', 'Somali'),
        ('Benishangul-Gumuz', 'Benishangul-Gumuz'),
        ('SNNPR', 'SNNPR'),
        ('Gambella', 'Gambella'),
        ('Harari', 'Harari'),
        ('Sidama', 'Sidama'),
        ('South West Ethiopia Peoples', 'South West Ethiopia Peoples'),
        ('Central Ethiopia', 'Central Ethiopia'),
        ('Addis Ababa', 'Addis Ababa City Administration'),
        ('Dire Dawa', 'Dire Dawa City Administration'),
    ]

    name = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20)
    grade_level = models.CharField(max_length=10)
    stream = models.CharField(max_length=50, blank=True, null=True)
    region = models.CharField(max_length=50, choices=REGION_CHOICES, default='Addis Ababa')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'master_courses'
        ordering = ['name', 'grade_level']
        ordering = ['name', 'grade_level']
        unique_together = [['name', 'grade_level', 'stream', 'region'], ['code', 'region']]

    def __str__(self):
        stream_info = f" ({self.stream})" if self.stream else ""
        return f"{self.name} - Grade {self.grade_level}{stream_info} ({self.region})"


class TeacherCourseRequest(models.Model):
    """Model for teacher course assignment requests."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('declined', 'Declined'),
        ('under_review', 'Under Review'),
        ('course_ended', 'Course Ended'),
    ]

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='course_requests'
    )
    master_course = models.ForeignKey(
        MasterCourse,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='course_requests'
    )
    subject = models.CharField(max_length=100)
    grade_level = models.CharField(max_length=10)
    stream = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='reviewed_course_requests'
    )
    review_notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['teacher', 'subject', 'grade_level', 'stream']

    def __str__(self):
        stream_info = f" - {self.stream}" if self.stream else ""
        return f"{self.teacher.username}: {self.subject} - Grade {self.grade_level}{stream_info}"


class StudentEnrollmentRequest(models.Model):
    """Model for student course enrollment requests."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('declined', 'Declined'),
        ('under_review', 'Under Review'),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollment_requests'
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_enrollment_requests'
    )
    family = models.ForeignKey(
        'users.Family',
        on_delete=models.CASCADE,
        related_name='enrollment_requests',
        null=True,
        blank=True
    )
    subject = models.CharField(max_length=100)
    grade_level = models.CharField(max_length=10)
    stream = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='reviewed_enrollment_requests'
    )
    review_notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['student', 'teacher', 'subject', 'grade_level', 'stream']

    def __str__(self):
        stream_info = f" - {self.stream}" if self.stream else ""
        family_info = f" ({self.family.name})" if self.family else ""
        return f"{self.student.username} -> {self.teacher.username}: {self.subject} - Grade {self.grade_level}{stream_info}{family_info}"


class Grade(models.Model):
    """Model for individual student grades."""
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='grades',
        limit_choices_to={'role': 'Student'}
    )
    grade_item = models.ForeignKey(
        GradeItem,
        on_delete=models.CASCADE,
        related_name='grades'
    )
    score = models.FloatField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_items'
    )
    graded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'grades'
        unique_together = ['student', 'grade_item']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.username} - {self.grade_item.title}: {self.score}"
    
    @property
    def percentage(self):
        """Calculate percentage score."""
        if self.score is None:
            return None
        return (self.score / self.grade_item.max_score) * 100


class StudentGrade(models.Model):
    """Model for storing student grades by assignment type and exam type."""
    
    ASSIGNMENT_TYPES = [
        ('quiz', 'Quiz'),
        ('assignment', 'Assignment'),
        ('homework', 'Homework'),
        ('project', 'Project'),
        ('lab_report', 'Lab Report'),
        ('presentation', 'Presentation'),
        ('group_work', 'Group Work'),
        ('essay', 'Essay'),
        ('critical_analysis', 'Critical Analysis'),
        ('creative_writing', 'Creative Writing'),
    ]
    
    EXAM_TYPES = [
        ('Quiz', 'Quiz'),
        ('Mid Exam', 'Mid Exam'),
        ('Final Exam', 'Final Exam'),
    ]
    
    GRADE_CATEGORIES = [
        ('Assignment', 'Assignment'),
        ('Exam', 'Exam'),
        ('Participation', 'Participation'),
        ('Project', 'Project'),
        ('Other', 'Other'),
    ]
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_grades',
        limit_choices_to={'role': 'Student'}
    )
    subject = models.CharField(max_length=100)
    grade_level = models.CharField(max_length=10)
    stream = models.CharField(max_length=50, blank=True, null=True)
    title = models.CharField(max_length=200, blank=True, null=True, help_text="Title of the assignment or quiz")
    assignment_type = models.CharField(
        max_length=50,
        choices=ASSIGNMENT_TYPES,
        null=True,
        blank=True
    )
    exam_type = models.CharField(
        max_length=50,
        choices=EXAM_TYPES,
        null=True,
        blank=True
    )
    category = models.CharField(
        max_length=50,
        choices=GRADE_CATEGORIES,
        default='Other',
        help_text='Category of the grade for better organization'
    )
    score = models.FloatField()
    max_score = models.FloatField(default=100)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_student_grades'
    )
    graded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_grades'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'subject', 'grade_level', 'stream']),
            models.Index(fields=['student', 'assignment_type']),
            models.Index(fields=['student', 'exam_type']),
            models.Index(fields=['graded_by', 'subject']),
        ]
    
    def __str__(self):
        grade_type = self.assignment_type or self.exam_type or 'Unknown'
        return f"{self.student.username} - {self.subject} ({grade_type}): {self.score}/{self.max_score}"
    
    @property
    def percentage(self):
        """Calculate percentage score."""
        if self.score is None:
            return None
        return (self.score / self.max_score) * 100 if self.max_score > 0 else 0


# Import Quiz Models
from .models_quiz import OnlineQuiz, Question, QuizAttempt, QuestionResponse


class AssignmentType(models.Model):
    """Model for dynamic Assignment Types."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'assignment_types'
        ordering = ['name']

    def __str__(self):
        return self.name


class ExamType(models.Model):
    """Model for dynamic Exam Types."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'exam_types'
        ordering = ['name']

    def __str__(self):
        return self.name


class Region(models.Model):
    """Model for Regions and City Administrations."""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True, help_text="Short code for the region (e.g., AA, OR)")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'regions'
        ordering = ['name']

    def __str__(self):
        return self.name


class GradeLevel(models.Model):
    """Model for Grade Levels (KG, Grade 1, etc.)."""
    name = models.CharField(max_length=50, unique=True)
    order = models.IntegerField(default=0, help_text="Ordering for display")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'grade_levels'
        ordering = ['order']

    def __str__(self):
        return self.name


class Stream(models.Model):
    """Model for Streams (Natural Science, Social Science)."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'streams'
        ordering = ['name']

    def __str__(self):
        return self.name


class Subject(models.Model):
    """Model for Subjects."""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, blank=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'subjects'
        ordering = ['name']

    def __str__(self):
        return self.name


class Curriculum(models.Model):
    """
    Model defining the curriculum structure.
    Links Region, Grade, Stream, and Subject.
    """
    LANGUAGE_CHOICES = [
        ('English', 'English'),
        ('Amharic', 'Amharic'),
        ('Afan Oromo', 'Afan Oromo'),
        ('Tigrinya', 'Tigrinya'),
        ('Somali', 'Somali'),
    ]

    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='curriculums')
    grade_level = models.ForeignKey(GradeLevel, on_delete=models.CASCADE, related_name='curriculums')
    stream = models.ForeignKey(Stream, on_delete=models.CASCADE, null=True, blank=True, related_name='curriculums')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='curriculums')
    language = models.CharField(max_length=50, choices=LANGUAGE_CHOICES, default='English')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'curriculums'
        unique_together = ['region', 'grade_level', 'stream', 'subject', 'language']
        ordering = ['region', 'grade_level__order', 'subject__name']

    def __str__(self):
        stream_str = f" - {self.stream.name}" if self.stream else ""
        return f"{self.region.name} - {self.grade_level.name}{stream_str} - {self.subject.name} ({self.language})"

