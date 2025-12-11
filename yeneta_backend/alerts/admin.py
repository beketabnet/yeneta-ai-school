from django.contrib import admin
from .models import SmartAlert


@admin.register(SmartAlert)
class SmartAlertAdmin(admin.ModelAdmin):
    list_display = ['student', 'sentiment', 'status', 'created_at']
    list_filter = ['sentiment', 'status', 'created_at']
    search_fields = ['student__username', 'message_content']
    ordering = ['-created_at']
