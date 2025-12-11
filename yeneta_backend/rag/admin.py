from django.contrib import admin
from .models import VectorStore, ExamVectorStore


@admin.register(VectorStore)
class VectorStoreAdmin(admin.ModelAdmin):
    """Admin interface for VectorStore model."""
    
    list_display = ['file_name', 'subject', 'grade', 'stream', 'region', 'status', 'created_at', 'created_by']
    list_filter = ['status', 'grade', 'stream', 'region', 'subject', 'created_at']
    search_fields = ['file_name', 'subject']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(ExamVectorStore)
class ExamVectorStoreAdmin(admin.ModelAdmin):
    """Admin interface for ExamVectorStore model."""
    
    list_display = ['file_name', 'exam_type', 'subject', 'exam_year', 'stream', 'chapter', 'region', 'status', 'created_at', 'created_by']
    list_filter = ['exam_type', 'status', 'stream', 'region', 'subject', 'exam_year', 'created_at']
    search_fields = ['file_name', 'subject', 'chapter', 'exam_year']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
