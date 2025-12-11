from rest_framework import serializers
from .models import SmartAlert, StudentFeedback
from users.serializers import UserSerializer


class StudentFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for StudentFeedback model."""
    
    student = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = StudentFeedback
        fields = [
            'id', 'student', 'message_content', 'category', 'priority', 'status',
            'assigned_to', 'assigned_to_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def update(self, instance, validated_data):
        # Handle assigned_to_id separately
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        if assigned_to_id is not None:
            from users.models import User
            try:
                assigned_user = User.objects.get(id=assigned_to_id)
                instance.assigned_to = assigned_user
            except User.DoesNotExist:
                pass
        
        return super().update(instance, validated_data)


class SmartAlertSerializer(serializers.ModelSerializer):
    """Serializer for SmartAlert model."""
    
    student = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = SmartAlert
        fields = [
            'id', 'student', 'message_content', 'sentiment', 'status', 
            'priority', 'category', 'severity', 'analysis', 
            'recommended_actions', 'requires_immediate_attention', 
            'suggested_response', 'assigned_to', 'assigned_to_id',
            'action_taken', 'resolution_notes', 'source', 'context_data',
            'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def update(self, instance, validated_data):
        # Handle assigned_to_id separately
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        if assigned_to_id is not None:
            from users.models import User
            try:
                assigned_user = User.objects.get(id=assigned_to_id)
                instance.assigned_to = assigned_user
            except User.DoesNotExist:
                pass
        
        # Update resolved_at when status changes to Resolved
        if 'status' in validated_data and validated_data['status'] == 'Resolved':
            from django.utils import timezone
            instance.resolved_at = timezone.now()
        
        return super().update(instance, validated_data)
