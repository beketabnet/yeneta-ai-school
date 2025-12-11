from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Family, FamilyMembership, UserDocument

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name', 'role', 'grade_level', 
            'grade', 'is_active', 'last_login', 'parent', 'region', 'cv', 'account_status', 'student_identification_number',
            'date_joined', 'mobile_number', 'stream', 'gender', 'age'
        ]
        read_only_fields = ['id', 'last_login', 'account_status', 'student_identification_number', 'date_joined']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'role', 'grade_level', 'first_name', 'last_name', 'region', 'cv', 'mobile_number', 'stream', 'gender', 'age']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'region': {'required': True},
            'mobile_number': {'required': True},
        }
    
    def create(self, validated_data):
        role = validated_data.get('role', 'Student')
        is_staff = role == 'Admin'
        
        # Handle grade_level for multiple selections (store as string)
        grade_level = validated_data.get('grade_level', '')
        if isinstance(grade_level, list):
            grade_level = ','.join(grade_level)
            
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            role=role,
            grade_level=grade_level,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            region=validated_data.get('region', ''),
            cv=validated_data.get('cv', None),
            mobile_number=validated_data.get('mobile_number', ''),
            stream=validated_data.get('stream', ''),
            gender=validated_data.get('gender', 'Other'),
            age=validated_data.get('age', 18),
            is_staff=is_staff,
            account_status='Incomplete'
        )
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for user profile updates (including completion)."""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'role', 'grade_level', 'grade', 'first_name', 'last_name', 'region', 'cv']
        read_only_fields = ['id', 'email', 'role']
        
    def update(self, instance, validated_data):
        # Handle grade_level list to string conversion
        if 'grade_level' in validated_data and isinstance(validated_data['grade_level'], list):
            validated_data['grade_level'] = ','.join(validated_data['grade_level'])
            
        instance = super().update(instance, validated_data)
        
        # Auto-update status to Pending Review if profile is complete
        if instance.account_status == 'Incomplete':
            is_complete = True
            if not instance.region:
                is_complete = False
            if instance.role == 'Teacher' and not instance.cv:
                is_complete = False
            
            if is_complete:
                instance.account_status = 'Pending Review'
                instance.save()
                
        return instance


class ChildSummarySerializer(serializers.Serializer):
    """Serializer for child summary data for parents."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    grade = serializers.CharField()
    overall_progress = serializers.FloatField()
    upcoming_assignments = serializers.ListField()
    recent_alerts_count = serializers.IntegerField()


class FamilySerializer(serializers.ModelSerializer):
    """Serializer for Family model."""

    class Meta:
        model = Family
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class FamilyDetailedSerializer(serializers.ModelSerializer):
    """Serializer for Family model with member details."""
    
    member_count = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    
    class Meta:
        model = Family
        fields = ['id', 'name', 'member_count', 'members', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        """Get count of active family members."""
        return obj.members.filter(is_active=True).count()
    
    def get_members(self, obj):
        """Get active family members with their details."""
        memberships = obj.members.filter(is_active=True)
        return [
            {
                'id': m.id,
                'user_detail': {
                    'id': m.user.id,
                    'username': m.user.username,
                    'first_name': m.user.first_name,
                    'last_name': m.user.last_name,
                },
                'role': m.role
            }
            for m in memberships
        ]


class FamilyMembershipSerializer(serializers.ModelSerializer):
    """Serializer for FamilyMembership model."""

    user = UserSerializer(read_only=True)
    family = FamilySerializer(read_only=True)

    class Meta:
        model = FamilyMembership
        fields = ['id', 'family', 'user', 'role', 'is_active', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class UserDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDocument
        fields = ['id', 'user', 'file', 'document_type', 'uploaded_at', 'description']
        read_only_fields = ['user', 'uploaded_at']
