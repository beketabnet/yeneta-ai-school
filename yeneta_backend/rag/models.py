from django.db import models
from django.conf import settings
import os
from datetime import datetime


def vector_store_upload_path(instance, filename):
    """Generate organized upload path for vector store files."""
    # Format: rag_documents/{Region}/Grade_{grade}/Stream_{stream}/Subject_{subject}/YYYY-MM-DD/filename
    date_folder = datetime.now().strftime('%Y-%m-%d')
    
    # Clean grade name (remove 'Grade ' prefix if present)
    grade_clean = instance.grade.replace('Grade ', '').replace(' ', '_')
    region_clean = instance.region.replace(' ', '_')
    
    # Build path based on whether stream is applicable
    if instance.stream and instance.stream != 'N/A':
        stream_clean = instance.stream.replace(' ', '_')
        path = os.path.join(
            'rag_documents',
            region_clean,
            f'Grade_{grade_clean}',
            f'Stream_{stream_clean}',
            f'Subject_{instance.subject}',
            date_folder,
            filename
        )
    else:
        path = os.path.join(
            'rag_documents',
            region_clean,
            f'Grade_{grade_clean}',
            f'Subject_{instance.subject}',
            date_folder,
            filename
        )
    
    return path


def exam_vector_store_upload_path(instance, filename):
    """Generate organized upload path for exam vector store files."""
    # Format: exam_documents/{Region}/{exam_type}/Stream_{stream}/Subject_{subject}/Year_{year}/filename
    date_folder = datetime.now().strftime('%Y-%m-%d')
    region_clean = instance.region.replace(' ', '_')
    
    # Build path based on exam type and stream
    if instance.stream and instance.stream != 'N/A':
        stream_clean = instance.stream.replace(' ', '_')
        if instance.exam_year:
            path = os.path.join(
                'exam_documents',
                region_clean,
                instance.exam_type,
                f'Stream_{stream_clean}',
                f'Subject_{instance.subject}',
                f'Year_{instance.exam_year}',
                date_folder,
                filename
            )
        else:
            path = os.path.join(
                'exam_documents',
                region_clean,
                instance.exam_type,
                f'Stream_{stream_clean}',
                f'Subject_{instance.subject}',
                date_folder,
                filename
            )
    else:
        if instance.exam_year:
            path = os.path.join(
                'exam_documents',
                region_clean,
                instance.exam_type,
                f'Subject_{instance.subject}',
                f'Year_{instance.exam_year}',
                date_folder,
                filename
            )
        else:
            path = os.path.join(
                'exam_documents',
                region_clean,
                instance.exam_type,
                f'Subject_{instance.subject}',
                date_folder,
                filename
            )
    
    return path


class VectorStore(models.Model):
    """Model for storing vector database information."""
    
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Processing', 'Processing'),
        ('Failed', 'Failed'),
    ]
    
    STREAM_CHOICES = [
        ('Natural Science', 'Natural Science'),
        ('Social Science', 'Social Science'),
        ('N/A', 'N/A'),
    ]

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
    
    file_name = models.CharField(max_length=255)
    file = models.FileField(upload_to=vector_store_upload_path, null=True, blank=True)
    grade = models.CharField(max_length=50)
    stream = models.CharField(max_length=50, choices=STREAM_CHOICES, default='N/A')
    subject = models.CharField(max_length=100)
    region = models.CharField(max_length=50, choices=REGION_CHOICES, default='Addis Ababa')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Processing')
    error_message = models.TextField(blank=True, null=True, help_text='Error message if processing failed')
    vector_store_path = models.CharField(max_length=500, blank=True, null=True, help_text='Path to ChromaDB vector store')
    chunk_count = models.IntegerField(default=0, help_text='Number of text chunks in vector store')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='vector_stores'
    )
    
    class Meta:
        db_table = 'rag_vector_stores'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.file_name} - {self.subject} ({self.status})"


class ExamVectorStore(models.Model):
    """Model for storing exam-specific vector database information (Matric/Model exams)."""
    
    EXAM_TYPE_CHOICES = [
        ('Matric', 'Matric Exam'),
        ('Model', 'Model Exam'),
    ]
    
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Processing', 'Processing'),
        ('Failed', 'Failed'),
    ]
    
    STREAM_CHOICES = [
        ('Natural Science', 'Natural Science'),
        ('Social Science', 'Social Science'),
        ('N/A', 'N/A'),
    ]

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
    
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPE_CHOICES, help_text='Type of exam (Matric or Model)')
    file_name = models.CharField(max_length=255)
    file = models.FileField(upload_to=exam_vector_store_upload_path, null=True, blank=True)
    subject = models.CharField(max_length=100, help_text='Subject of the exam')
    exam_year = models.CharField(max_length=20, blank=True, null=True, help_text='Year of exam (e.g., 2023, 2020-2023, or blank for all years)')
    stream = models.CharField(max_length=50, choices=STREAM_CHOICES, default='N/A', help_text='Academic stream for Grade 12')
    chapter = models.CharField(max_length=200, blank=True, null=True, help_text='Chapter or topic covered')
    region = models.CharField(max_length=50, choices=REGION_CHOICES, default='Addis Ababa')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Processing')
    error_message = models.TextField(blank=True, null=True, help_text='Error message if processing failed')
    vector_store_path = models.CharField(max_length=500, blank=True, null=True, help_text='Path to ChromaDB vector store')
    chunk_count = models.IntegerField(default=0, help_text='Number of text chunks in vector store')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='exam_vector_stores'
    )
    
    class Meta:
        db_table = 'rag_exam_vector_stores'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['exam_type', 'subject', 'exam_year']),
            models.Index(fields=['exam_type', 'subject']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        year_info = f" ({self.exam_year})" if self.exam_year else ""
        return f"{self.exam_type} - {self.subject}{year_info} ({self.status})"
