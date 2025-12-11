from django.contrib import admin
from .models import Conversation, Message, SharedFileNotification, StudentAssignment


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    ordering = ['-updated_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'conversation', 'created_at']
    list_filter = ['created_at', 'sender', 'sender__region']
    search_fields = ['content', 'sender__username']
    ordering = ['-created_at']


@admin.register(SharedFileNotification)
class SharedFileNotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'shared_file', 'is_read', 'is_downloaded', 'created_at']
    list_filter = ['is_read', 'is_downloaded', 'created_at']
    search_fields = ['recipient__username', 'shared_file__title']
    ordering = ['-created_at']


@admin.register(StudentAssignment)
class StudentAssignmentAdmin(admin.ModelAdmin):
    list_display = ['assignment_topic', 'student', 'teacher', 'document_type', 'is_graded', 'submitted_at']
    list_filter = ['document_type', 'is_graded', 'submitted_at', 'grade_level', 'subject', 'student__region', 'student__gender']
    search_fields = ['assignment_topic', 'student__username', 'teacher__username', 'description']
    ordering = ['-submitted_at']
