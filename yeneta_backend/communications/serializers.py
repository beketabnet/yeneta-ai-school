from rest_framework import serializers
from .models import Conversation, Message, SharedFileNotification, StudentAssignment, Notification
from users.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""
    
    sender = UserSerializer(read_only=True)
    content = serializers.CharField(required=False, allow_blank=True, default='')
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'attachment', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']
    
    def validate(self, data):
        """Ensure at least content or attachment is provided."""
        content = data.get('content', '').strip()
        attachment = data.get('attachment')
        
        if not content and not attachment:
            raise serializers.ValidationError(
                "Either content or attachment must be provided."
            )
        
        return data


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for Conversation model."""
    
    participants = UserSerializer(many=True, read_only=True)
    last_message = MessageSerializer(read_only=True)
    
    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'last_message', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SharedFileNotificationSerializer(serializers.ModelSerializer):
    """Serializer for SharedFileNotification model."""
    
    shared_file = serializers.SerializerMethodField()
    recipient = UserSerializer(read_only=True)
    
    class Meta:
        model = SharedFileNotification
        fields = ['id', 'shared_file', 'recipient', 'is_read', 'is_downloaded', 'created_at', 'read_at']
        read_only_fields = ['id', 'created_at']
    
    def get_shared_file(self, obj):
        """Get shared file details."""
        from ai_tools.serializers import SharedFileSerializer
        return SharedFileSerializer(obj.shared_file).data


class StudentAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for StudentAssignment model."""
    
    student = UserSerializer(read_only=True)
    teacher = UserSerializer(read_only=True)
    teacher_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = StudentAssignment
        fields = [
            'id', 'student', 'teacher', 'teacher_id', 'assignment_topic', 'document_type',
            'file', 'description', 'grade_level', 'subject',
            'is_graded', 'grade', 'feedback', 'submitted_at', 'graded_at'
        ]
        read_only_fields = ['id', 'student', 'is_graded', 'grade', 'feedback', 'submitted_at', 'graded_at']
    
    def create(self, validated_data):
        """Create assignment with student from request user."""
        teacher_id = validated_data.pop('teacher_id')
        validated_data['teacher_id'] = teacher_id
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)


class StudentAssignmentListSerializer(serializers.ModelSerializer):
    """Serializer for listing assignments with full student/teacher objects."""
    
    student = UserSerializer(read_only=True)
    teacher = UserSerializer(read_only=True)
    
    class Meta:
        model = StudentAssignment
        fields = [
            'id', 'student', 'teacher', 'assignment_topic', 'document_type',
            'file', 'description', 'grade_level', 'subject',
            'is_graded', 'grade', 'feedback', 'submitted_at', 'graded_at'
        ]


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    
    recipient = UserSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'notification_type', 'title', 'message',
            'is_read', 'read_at', 'related_course_request', 'related_enrollment_request',
            'created_at'
        ]
        read_only_fields = ['id', 'recipient', 'created_at']
