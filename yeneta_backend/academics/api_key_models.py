"""
API Key Management Models
Stores and manages API keys with usage tracking
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import json


class APIKeyProvider(models.Model):
    """Supported API providers"""
    PROVIDER_CHOICES = [
        ('openai', 'OpenAI'),
        ('gemini', 'Google Gemini'),
        ('serp', 'SERP API'),
    ]
    
    name = models.CharField(max_length=20, choices=PROVIDER_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    
    class Meta:
        verbose_name = "API Provider"
        verbose_name_plural = "API Providers"
    
    def __str__(self):
        return self.display_name


class APIKey(models.Model):
    """Stores API keys with usage tracking"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('rate_limited', 'Rate Limited'),
        ('expired', 'Expired'),
    ]
    
    provider = models.ForeignKey(APIKeyProvider, on_delete=models.CASCADE, related_name='keys')
    key_value = models.CharField(max_length=500)  # Encrypted in production
    model_name = models.CharField(max_length=100, help_text="e.g., gpt-4o, gemini-1.5-flash")
    
    # Rate limits
    max_tokens_per_minute = models.IntegerField(default=90000)
    max_tokens_per_day = models.IntegerField(default=2000000)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_active = models.BooleanField(default=True)
    
    # Usage tracking
    tokens_used_today = models.IntegerField(default=0)
    tokens_used_this_minute = models.IntegerField(default=0)
    last_reset_minute = models.DateTimeField(auto_now_add=True)
    last_reset_day = models.DateTimeField(auto_now_add=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='api_keys_created')
    
    class Meta:
        verbose_name = "API Key"
        verbose_name_plural = "API Keys"
        unique_together = ('provider', 'key_value')
    
    def __str__(self):
        return f"{self.provider.display_name} - {self.model_name} ({self.status})"
    
    def reset_minute_counter(self):
        """Reset minute counter if 60 seconds have passed"""
        now = timezone.now()
        if (now - self.last_reset_minute).total_seconds() >= 60:
            self.tokens_used_this_minute = 0
            self.last_reset_minute = now
            self.save()
    
    def reset_day_counter(self):
        """Reset day counter if 24 hours have passed"""
        now = timezone.now()
        if (now - self.last_reset_day).total_seconds() >= 86400:
            self.tokens_used_today = 0
            self.last_reset_day = now
            self.save()
    
    def add_token_usage(self, tokens: int):
        """Track token usage"""
        self.reset_minute_counter()
        self.reset_day_counter()
        
        self.tokens_used_this_minute += tokens
        self.tokens_used_today += tokens
        self.save()
    
    def get_usage_percentage_minute(self) -> float:
        """Get minute usage percentage"""
        if self.max_tokens_per_minute <= 0:
            return 0
        return (self.tokens_used_this_minute / self.max_tokens_per_minute) * 100
    
    def get_usage_percentage_day(self) -> float:
        """Get day usage percentage"""
        if self.max_tokens_per_day <= 0:
            return 0
        return (self.tokens_used_today / self.max_tokens_per_day) * 100
    
    def is_available(self, tokens_needed: int = 1000) -> bool:
        """Check if key is available for use"""
        if not self.is_active or self.status != 'active':
            return False
        
        self.reset_minute_counter()
        self.reset_day_counter()
        
        # Check minute limit
        if self.tokens_used_this_minute + tokens_needed > self.max_tokens_per_minute:
            return False
        
        # Check day limit
        if self.tokens_used_today + tokens_needed > self.max_tokens_per_day:
            return False
        
        return True
    
    def deactivate(self, reason: str = "Rate limit reached"):
        """Deactivate key"""
        self.is_active = False
        self.status = 'rate_limited'
        self.save()
        
        # Log the event
        APIKeyLog.objects.create(
            api_key=self,
            action='deactivated',
            reason=reason
        )
    
    def reactivate(self):
        """Reactivate key"""
        self.is_active = True
        self.status = 'active'
        self.tokens_used_today = 0
        self.tokens_used_this_minute = 0
        self.save()
        
        # Log the event
        APIKeyLog.objects.create(
            api_key=self,
            action='reactivated',
            reason='Manual reactivation'
        )


class APIKeyLog(models.Model):
    """Logs API key usage and events"""
    ACTION_CHOICES = [
        ('used', 'Used'),
        ('deactivated', 'Deactivated'),
        ('reactivated', 'Reactivated'),
        ('created', 'Created'),
        ('deleted', 'Deleted'),
        ('updated', 'Updated'),
    ]
    
    api_key = models.ForeignKey(APIKey, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    tokens_used = models.IntegerField(default=0)
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "API Key Log"
        verbose_name_plural = "API Key Logs"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.api_key} - {self.action} ({self.created_at})"
