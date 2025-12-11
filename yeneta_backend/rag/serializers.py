from rest_framework import serializers
from .models import VectorStore, ExamVectorStore
import os


class VectorStoreSerializer(serializers.ModelSerializer):
    """Serializer for VectorStore model."""
    
    file = serializers.FileField(required=True, write_only=False)
    
    class Meta:
        model = VectorStore
        fields = ['id', 'file_name', 'file', 'grade', 'stream', 'subject', 'region', 'status', 'error_message', 'chunk_count', 'created_at']
        read_only_fields = ['id', 'file_name', 'status', 'error_message', 'chunk_count', 'created_at']
    
    def validate_file(self, value):
        """Validate uploaded file."""
        # Check file extension
        valid_extensions = ['.pdf', '.docx', '.txt', '.doc']
        ext = os.path.splitext(value.name)[1].lower()
        
        if ext not in valid_extensions:
            raise serializers.ValidationError(
                f"Unsupported file type. Allowed types: {', '.join(valid_extensions)}"
            )
        
        # Check file size (max 210MB)
        max_size = 210 * 1024 * 1024  # 210MB in bytes
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File size exceeds maximum allowed size of 210MB. Your file is {value.size / (1024*1024):.2f}MB"
            )
        
        return value
    
    def validate(self, data):
        """Validate the entire data."""
        # Ensure stream is set correctly based on grade
        grade = data.get('grade', '')
        stream = data.get('stream', 'N/A')
        
        if grade in ['Grade 11', 'Grade 12']:
            if stream == 'N/A':
                raise serializers.ValidationError({
                    'stream': 'Stream is required for Grade 11 and Grade 12'
                })
        else:
            # Force N/A for other grades
            data['stream'] = 'N/A'
        
        return data
    
    def create(self, validated_data):
        """Create vector store instance."""
        # Extract filename from uploaded file
        uploaded_file = validated_data.get('file')
        if uploaded_file:
            validated_data['file_name'] = uploaded_file.name
        
        # Status will be set to Processing by default in model
        # created_by will be set in the view's perform_create method
        return super().create(validated_data)


class ExamVectorStoreSerializer(serializers.ModelSerializer):
    """Serializer for ExamVectorStore model (Matric/Model exams)."""
    
    file = serializers.FileField(required=True, write_only=False)
    
    class Meta:
        model = ExamVectorStore
        fields = [
            'id', 'exam_type', 'file_name', 'file', 'subject', 
            'exam_year', 'stream', 'chapter', 'region', 'status', 'error_message',
            'vector_store_path', 'chunk_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'file_name', 'status', 'error_message', 'vector_store_path', 'chunk_count', 'created_at', 'updated_at']
    
    def validate_file(self, value):
        """Validate uploaded file."""
        # Check file extension
        valid_extensions = ['.pdf', '.docx', '.txt', '.doc']
        ext = os.path.splitext(value.name)[1].lower()
        
        if ext not in valid_extensions:
            raise serializers.ValidationError(
                f"Unsupported file type. Allowed types: {', '.join(valid_extensions)}"
            )
        
        # Check file size (max 210MB)
        max_size = 210 * 1024 * 1024  # 210MB in bytes
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File size exceeds maximum allowed size of 210MB. Your file is {value.size / (1024*1024):.2f}MB"
            )
        
        return value
    
    def validate_exam_year(self, value):
        """Validate exam year format."""
        if not value:
            return value
        
        # Allow single year (e.g., "2023") or year range (e.g., "2020-2023")
        import re
        single_year_pattern = r'^\d{4}$'
        range_pattern = r'^\d{4}-\d{4}$'
        
        if not (re.match(single_year_pattern, value) or re.match(range_pattern, value)):
            raise serializers.ValidationError(
                "Exam year must be a single year (e.g., '2023') or a year range (e.g., '2020-2023')"
            )
        
        return value
    
    def create(self, validated_data):
        """Create exam vector store instance."""
        # Extract filename from uploaded file
        uploaded_file = validated_data.get('file')
        if uploaded_file:
            validated_data['file_name'] = uploaded_file.name
        
        # Status will be set to Processing by default in model
        # created_by will be set in the view's perform_create method
        return super().create(validated_data)
