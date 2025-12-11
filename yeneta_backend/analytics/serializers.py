from rest_framework import serializers
from .models import EngagementTrend, LearningOutcome


class EngagementTrendSerializer(serializers.ModelSerializer):
    """Serializer for EngagementTrend model."""
    
    class Meta:
        model = EngagementTrend
        fields = ['id', 'date', 'active_users', 'created_at']
        read_only_fields = ['id', 'created_at']


class LearningOutcomeSerializer(serializers.ModelSerializer):
    """Serializer for LearningOutcome model."""
    
    class Meta:
        model = LearningOutcome
        fields = ['id', 'subject', 'average_score', 'date', 'created_at']
        read_only_fields = ['id', 'created_at']
