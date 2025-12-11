from django.contrib import admin
from .models import EngagementTrend, LearningOutcome


@admin.register(EngagementTrend)
class EngagementTrendAdmin(admin.ModelAdmin):
    list_display = ['date', 'active_users', 'created_at']
    list_filter = ['date', 'created_at']
    ordering = ['-date']


@admin.register(LearningOutcome)
class LearningOutcomeAdmin(admin.ModelAdmin):
    list_display = ['subject', 'average_score', 'date', 'created_at']
    list_filter = ['subject', 'date', 'created_at']
    search_fields = ['subject']
    ordering = ['subject', '-date']
