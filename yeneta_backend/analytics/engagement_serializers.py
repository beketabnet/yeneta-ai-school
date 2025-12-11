"""
Serializers for engagement monitoring models
"""
from rest_framework import serializers
from .engagement_models import EngagementSession, EngagementSnapshot, EngagementSummary
from users.serializers import UserSerializer


class EngagementSnapshotSerializer(serializers.ModelSerializer):
    """Serializer for EngagementSnapshot model."""
    
    class Meta:
        model = EngagementSnapshot
        fields = ['id', 'timestamp', 'expression', 'person_detected', 'confidence', 'detected_objects']
        read_only_fields = ['id', 'timestamp']


class EngagementSessionSerializer(serializers.ModelSerializer):
    """Serializer for EngagementSession model."""
    
    student = UserSerializer(read_only=True)
    student_id = serializers.IntegerField(write_only=True, required=False)
    snapshots = EngagementSnapshotSerializer(many=True, read_only=True)
    
    class Meta:
        model = EngagementSession
        fields = [
            'id', 'student', 'student_id', 'started_at', 'ended_at', 'duration_seconds',
            'subject', 'activity_type', 'total_detections', 'person_detected_count',
            'person_detected_percentage', 'happy_count', 'neutral_count', 'sad_count',
            'angry_count', 'fearful_count', 'disgusted_count', 'surprised_count',
            'unknown_count', 'dominant_expression', 'attention_required_count',
            'attention_percentage', 'engagement_score', 'is_active', 'snapshots',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'started_at', 'ended_at', 'duration_seconds', 'total_detections',
            'person_detected_count', 'person_detected_percentage', 'happy_count',
            'neutral_count', 'sad_count', 'angry_count', 'fearful_count',
            'disgusted_count', 'surprised_count', 'unknown_count', 'dominant_expression',
            'attention_required_count', 'attention_percentage', 'engagement_score',
            'created_at', 'updated_at'
        ]


class EngagementSessionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing sessions without snapshots."""
    
    student = UserSerializer(read_only=True)
    
    class Meta:
        model = EngagementSession
        fields = [
            'id', 'student', 'started_at', 'ended_at', 'duration_seconds',
            'subject', 'activity_type', 'dominant_expression', 'engagement_score',
            'attention_percentage', 'is_active'
        ]


class EngagementSummarySerializer(serializers.ModelSerializer):
    """Serializer for EngagementSummary model."""
    
    class Meta:
        model = EngagementSummary
        fields = [
            'id', 'date', 'hour', 'total_sessions', 'total_students',
            'total_duration_seconds', 'average_duration_seconds',
            'happy_percentage', 'neutral_percentage', 'sad_percentage',
            'angry_percentage', 'fearful_percentage', 'disgusted_percentage',
            'surprised_percentage', 'unknown_percentage',
            'average_engagement_score', 'attention_required_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
