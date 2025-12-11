from rest_framework import serializers
from .models import SavedLessonPlan, LessonPlanRating, SavedRubric, SharedFile, TutorConfiguration, SavedLesson
from users.models import User


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for lesson plan display"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class LessonPlanRatingSerializer(serializers.ModelSerializer):
    """Serializer for lesson plan ratings"""
    rated_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = LessonPlanRating
        fields = ['id', 'lesson_plan', 'rated_by', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']


class SavedLessonPlanSerializer(serializers.ModelSerializer):
    """Serializer for saved lesson plans"""
    created_by = UserBasicSerializer(read_only=True)
    shared_with = UserBasicSerializer(many=True, read_only=True)
    shared_with_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = SavedLessonPlan
        fields = [
            'id', 'created_by', 'created_at', 'updated_at',
            'title', 'grade', 'subject', 'topic', 'duration', 'moe_standard_id',
            'objectives', 'essential_questions', 'enduring_understandings', 'moe_competencies',
            'assessment_plan', 'materials', 'teacher_preparation', 'resource_constraints',
            'five_e_sequence', 'activities', 'differentiation_strategies',
            'homework', 'extensions', 'reflection_prompts', 'teacher_notes',
            'student_readiness', 'local_context',
            'rag_enabled', 'curriculum_sources',
            'is_public', 'shared_with', 'shared_with_ids',
            'times_used', 'rating', 'rating_count', 'tags'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'times_used', 'rating', 'rating_count']
    
    def to_representation(self, instance):
        """Convert snake_case to camelCase for frontend compatibility"""
        data = super().to_representation(instance)
        
        # Transform snake_case keys to camelCase
        camel_case_data = {
            'id': data['id'],
            'created_by': data['created_by'],
            'created_at': data['created_at'],
            'updated_at': data['updated_at'],
            'title': data['title'],
            'grade': data['grade'],
            'subject': data['subject'],
            'topic': data['topic'],
            'duration': data['duration'],
            'moeStandardId': data.get('moe_standard_id'),
            'objectives': data.get('objectives', []),
            'essentialQuestions': data.get('essential_questions'),
            'enduring_understandings': data.get('enduring_understandings'),
            'moeCompetencies': data.get('moe_competencies'),
            'assessmentPlan': data.get('assessment_plan'),
            'materials': data.get('materials', []),
            'teacherPreparation': data.get('teacher_preparation'),
            'resourceConstraints': data.get('resource_constraints'),
            'fiveESequence': data.get('five_e_sequence'),
            'activities': data.get('activities'),
            'differentiationStrategies': data.get('differentiation_strategies'),
            'homework': data.get('homework'),
            'extensions': data.get('extensions'),
            'reflectionPrompts': data.get('reflection_prompts'),
            'teacherNotes': data.get('teacher_notes'),
            'studentReadiness': data.get('student_readiness'),
            'localContext': data.get('local_context'),
            'rag_enabled': data.get('rag_enabled'),
            'curriculum_sources': data.get('curriculum_sources'),
            'is_public': data.get('is_public'),
            'shared_with': data.get('shared_with'),
            'times_used': data.get('times_used'),
            'rating': data.get('rating'),
            'rating_count': data.get('rating_count'),
            'tags': data.get('tags'),
            # Add grade_level for backward compatibility with viewer
            'grade_level': data['grade'],
        }
        
        return camel_case_data
    
    def create(self, validated_data):
        shared_with_ids = validated_data.pop('shared_with_ids', [])
        lesson_plan = SavedLessonPlan.objects.create(**validated_data)
        
        if shared_with_ids:
            shared_users = User.objects.filter(id__in=shared_with_ids, role='Teacher')
            lesson_plan.shared_with.set(shared_users)
        
        return lesson_plan
    
    def update(self, instance, validated_data):
        shared_with_ids = validated_data.pop('shared_with_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if shared_with_ids is not None:
            shared_users = User.objects.filter(id__in=shared_with_ids, role='Teacher')
            instance.shared_with.set(shared_users)
        
        return instance


class SavedLessonPlanListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing lesson plans"""
    created_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = SavedLessonPlan
        fields = [
            'id', 'title', 'grade', 'subject', 'topic', 'duration',
            'created_by', 'created_at', 'updated_at',
            'is_public', 'times_used', 'rating', 'rating_count', 'tags'
        ]
    
    def to_representation(self, instance):
        """Convert snake_case to camelCase for frontend compatibility"""
        data = super().to_representation(instance)
        
        # Transform snake_case keys to camelCase (for list view fields)
        camel_case_data = {
            'id': data['id'],
            'title': data['title'],
            'grade': data['grade'],
            'subject': data['subject'],
            'topic': data['topic'],
            'duration': data['duration'],
            'created_by': data['created_by'],
            'created_at': data['created_at'],
            'updated_at': data['updated_at'],
            'is_public': data.get('is_public'),
            'times_used': data.get('times_used'),
            'rating': data.get('rating'),
            'rating_count': data.get('rating_count'),
            'tags': data.get('tags'),
            # Add grade_level for backward compatibility
            'grade_level': data['grade'],
        }
        
        return camel_case_data


class SavedRubricSerializer(serializers.ModelSerializer):
    """Serializer for saved rubrics with full details"""
    created_by = UserBasicSerializer(read_only=True)
    content = serializers.SerializerMethodField()
    document_type = serializers.SerializerMethodField()
    
    class Meta:
        model = SavedRubric
        fields = [
            'id', 'created_by', 'created_at', 'updated_at',
            'title', 'topic', 'grade_level', 'subject', 'rubric_type',
            'moe_standard_id', 'learning_objectives',
            'criteria', 'total_points', 'content', 'document_type',
            'weighting_enabled', 'multimodal_assessment',
            'alignment_validated', 'alignment_score',
            'performance_levels', 'tone_preference',
            'is_public', 'times_used', 'tags', 'teacher_notes'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'times_used', 'alignment_score']
    
    def get_content(self, obj):
        """Format criteria as readable text content"""
        if not obj.criteria:
            return None
        
        lines = []
        lines.append(f"Rubric: {obj.title}")
        lines.append(f"Type: {obj.get_rubric_type_display()}")
        lines.append(f"Total Points: {obj.total_points}")
        lines.append("\n" + "="*50 + "\n")
        
        for idx, criterion in enumerate(obj.criteria, 1):
            criterion_name = criterion.get('name', f'Criterion {idx}')
            points = criterion.get('points', 0)
            lines.append(f"{idx}. {criterion_name} ({points} points)")
            
            description = criterion.get('description', '')
            if description:
                lines.append(f"   Description: {description}")
            
            levels = criterion.get('levels', [])
            if levels:
                lines.append("   Performance Levels:")
                for level in levels:
                    level_name = level.get('name', '')
                    level_desc = level.get('description', '')
                    level_points = level.get('points', 0)
                    lines.append(f"   - {level_name} ({level_points} pts): {level_desc}")
            
            lines.append("")  # Empty line between criteria
        
        return "\n".join(lines)
    
    def get_document_type(self, obj):
        """Map rubric type or topic to document type"""
        # Try to infer from topic or use rubric_type
        topic_lower = obj.topic.lower() if obj.topic else ''
        
        if 'essay' in topic_lower:
            return 'essay'
        elif 'research' in topic_lower or 'paper' in topic_lower:
            return 'research_paper'
        elif 'lab' in topic_lower or 'experiment' in topic_lower:
            return 'lab_report'
        elif 'presentation' in topic_lower:
            return 'presentation'
        elif 'project' in topic_lower:
            return 'project'
        else:
            return 'other'


class SavedRubricListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing rubrics"""
    created_by = UserBasicSerializer(read_only=True)
    content = serializers.SerializerMethodField()
    document_type = serializers.SerializerMethodField()
    
    class Meta:
        model = SavedRubric
        fields = [
            'id', 'title', 'topic', 'grade_level', 'subject', 'rubric_type',
            'created_by', 'created_at', 'updated_at',
            'is_public', 'times_used', 'tags',
            'criteria', 'total_points', 'alignment_validated', 'alignment_score',
            'content', 'document_type'
        ]
    
    def get_content(self, obj):
        """Format criteria as readable text content"""
        if not obj.criteria:
            return None
        
        lines = []
        lines.append(f"Rubric: {obj.title}")
        lines.append(f"Type: {obj.get_rubric_type_display()}")
        lines.append(f"Total Points: {obj.total_points}")
        lines.append("\n" + "="*50 + "\n")
        
        for idx, criterion in enumerate(obj.criteria, 1):
            criterion_name = criterion.get('name', f'Criterion {idx}')
            points = criterion.get('points', 0)
            lines.append(f"{idx}. {criterion_name} ({points} points)")
            
            description = criterion.get('description', '')
            if description:
                lines.append(f"   Description: {description}")
            
            levels = criterion.get('levels', [])
            if levels:
                lines.append("   Performance Levels:")
                for level in levels:
                    level_name = level.get('name', '')
                    level_desc = level.get('description', '')
                    level_points = level.get('points', 0)
                    lines.append(f"   - {level_name} ({level_points} pts): {level_desc}")
            
            lines.append("")  # Empty line between criteria
        
        return "\n".join(lines)
    
    def get_document_type(self, obj):
        """Map rubric type or topic to document type"""
        topic_lower = obj.topic.lower() if obj.topic else ''
        
        if 'essay' in topic_lower:
            return 'essay'
        elif 'research' in topic_lower or 'paper' in topic_lower:
            return 'research_paper'
        elif 'lab' in topic_lower or 'experiment' in topic_lower:
            return 'lab_report'
        elif 'presentation' in topic_lower:
            return 'presentation'
        elif 'project' in topic_lower:
            return 'project'
        else:
            return 'other'


class SharedFileSerializer(serializers.ModelSerializer):
    """Serializer for shared files"""
    shared_by = UserBasicSerializer(read_only=True)
    shared_with = UserBasicSerializer(read_only=True)
    content_title = serializers.SerializerMethodField()
    content_data = serializers.SerializerMethodField()
    
    class Meta:
        model = SharedFile
        fields = [
            'id', 'content_type', 'content_title', 'content_data',
            'shared_by', 'shared_with', 'shared_at',
            'is_viewed', 'viewed_at', 'message',
            'lesson_plan', 'rubric', 'lesson'
        ]
        read_only_fields = ['id', 'shared_by', 'shared_at', 'is_viewed', 'viewed_at']
    
    def get_content_title(self, obj):
        content = obj.get_content()
        return content.title if content else None
    
    def get_content_data(self, obj):
        content = obj.get_content()
        if content and hasattr(content, 'to_dict'):
            return content.to_dict()
        return None


class TutorConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for tutor configuration preferences"""
    
    class Meta:
        model = TutorConfiguration
        fields = [
            'id', 'use_ethiopian_curriculum', 'grade', 'stream', 'subject',
            'chapter_input', 'chapter_number', 'chapter_title', 'chapter_topics',
            'chapter_summary', 'learning_objectives', 'created_at', 'updated_at', 'last_used_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_used_at',
                          'chapter_number', 'chapter_title', 'chapter_topics', 'chapter_summary', 'learning_objectives']
    
    def create(self, validated_data):
        """Create or update configuration for the current user"""
        user = self.context['request'].user
        config, created = TutorConfiguration.objects.update_or_create(
            user=user,
            defaults=validated_data
        )
        return config
    
    def update(self, instance, validated_data):
        """Update configuration and extract chapter metadata if chapter_input changed"""
        chapter_input = validated_data.get('chapter_input', instance.chapter_input)
        
        # If chapter_input changed and we have grade/subject, extract chapter metadata
        if chapter_input and chapter_input != instance.chapter_input:
            grade = validated_data.get('grade', instance.grade)
            subject = validated_data.get('subject', instance.subject)
            
            if grade and subject:
                # Extract chapter metadata (will be done in view)
                pass
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class SavedLessonSerializer(serializers.ModelSerializer):
    """Serializer for saved generated lessons"""
    created_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = SavedLesson
        fields = [
            'id', 'created_by', 'created_at', 'updated_at',
            'title', 'grade', 'subject', 'topic',
            'content', 'rag_enabled', 'curriculum_sources',
            'is_public', 'lesson_plan'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
