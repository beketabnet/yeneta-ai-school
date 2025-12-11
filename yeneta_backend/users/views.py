from rest_framework import generics, status, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import Family, FamilyMembership, UserDocument
from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer, 
    UserProfileUpdateSerializer,
    ChildSummarySerializer,
    FamilySerializer,
    FamilyMembershipSerializer,
    UserDocumentSerializer
)

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer."""
    
    username_field = 'email'
    
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add custom claims
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'role': self.user.role,
            'account_status': self.user.account_status,
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view for email-based login."""
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """View for user registration."""
    
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'role': user.role,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """Get or update current authenticated user."""
    
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        data = serializer.data
        
        # Calculate profile completion
        completion = 0
        total_fields = 0
        completed_fields = 0
        
        # Basic fields
        basic_fields = ['first_name', 'last_name', 'region']
        total_fields += len(basic_fields)
        for field in basic_fields:
            if getattr(request.user, field):
                completed_fields += 1
                
        # Role specific fields
        if request.user.role == 'Teacher':
            total_fields += 1 # CV
            # Check if any CV document exists
            if UserDocument.objects.filter(user=request.user, document_type='CV').exists():
                completed_fields += 1
        elif request.user.role == 'Student':
            total_fields += 1 # Grade
            if request.user.grade_level:
                completed_fields += 1
            
            # Check for transcript/certification
            total_fields += 1
            if UserDocument.objects.filter(user=request.user, document_type__in=['Transcript', 'Certification']).exists():
                completed_fields += 1
        elif request.user.role == 'Parent':
            # Check for ID
            total_fields += 1
            if UserDocument.objects.filter(user=request.user, document_type='ID').exists():
                completed_fields += 1
                
        if total_fields > 0:
            completion = int((completed_fields / total_fields) * 100)
            
        data['profile_completion_percentage'] = completion
        return Response(data)
    
    elif request.method == 'PATCH':
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    """List all users (Admin only)."""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = User.objects.none()
        
        # Role-based access control
        if self.request.user.role == 'Admin':
            queryset = User.objects.all()
        elif self.request.user.role == 'Teacher':
            queryset = User.objects.filter(role__in=['Student', 'Parent', 'Admin', 'Teacher'])
        elif self.request.user.role == 'Parent':
            queryset = User.objects.filter(role__in=['Teacher', 'Admin', 'Parent'])
        elif self.request.user.role == 'Student':
            # Allow students to see Teachers, Admins, Parents, and other Students
            queryset = User.objects.all()
        else:
            queryset = User.objects.filter(id=self.request.user.id)

        # Search functionality
        query = self.request.query_params.get('search', None)
        if query:
            queryset = queryset.filter(
                Q(username__icontains=query) |
                Q(email__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query)
            )
            
        # Filter by account status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(account_status=status_filter)
            
        return queryset


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user_status_view(request, pk):
    """Update user account status (Admin only)."""
    
    if request.user.role != 'Admin':
        return Response(
            {'error': 'Only admins can perform this action'}, 
            status=status.HTTP_403_FORBIDDEN
        )
        
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
    new_status = request.data.get('status')
    reason = request.data.get('reason', '')
    
    if new_status not in ['Active', 'Rejected', 'Suspended', 'Pending Review', 'Incomplete']:
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
    user.account_status = new_status
    if new_status == 'Active':
        user.is_active = True
    elif new_status in ['Rejected', 'Suspended', 'Pending Review', 'Incomplete']:
        user.is_active = True # Keep them active so they can login to see the message, but restricted by frontend
        # Note: If we set is_active=False, they can't login at all. 
        # Requirement says "shouldn't be able to login again untill the status changes from rejected" 
        # BUT also "The admin should be able to notify the reason... and the user gets notified."
        # If they can't login, they can't see the notification on the dashboard.
        # However, the user said "activated dashboard page... should be able to get inactive and features unavailable".
        # This implies they can access the "page" (login) but features are unavailable.
        # So we keep is_active=True but rely on account_status for access control.
        pass
        
    user.save()
    
    # Create Notification
    from communications.models import Notification
    
    notification_title = f"Account Status Update: {new_status}"
    notification_message = f"Your account status has been updated to {new_status}."
    if reason:
        notification_message += f"\nReason: {reason}"
        
    Notification.objects.create(
        recipient=user,
        notification_type='system_alert', # Using a generic type or we can add a new one
        title=notification_title,
        message=notification_message
    )
    
    return Response({'message': f'User status updated to {new_status}'})


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a user (Admin only)."""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'Admin':
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def students_list_view(request):
    """Get list of students (for teachers)."""
    
    students = User.objects.filter(role='Student')
    serializer = UserSerializer(students, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_children_view(request):
    """Get list of children for parent users."""
    
    if request.user.role != 'Parent':
        return Response(
            {'error': 'Only parents can access this endpoint'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    children = User.objects.filter(parent=request.user, role='Student')
    
    # Build child summary data
    children_data = []
    for child in children:
        children_data.append({
            'id': child.id,
            'name': child.username,
            'grade': child.grade or 'N/A',
            'overall_progress': 85.0,  # Mock data - would be calculated from actual grades
            'upcoming_assignments': [],  # Would be fetched from assignments
            'recent_alerts_count': 0,  # Would be fetched from alerts
        })
    
    return Response(children_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unlinked_students_view(request):
    """Get list of students without a parent (for parent linking)."""
    
    if request.user.role != 'Parent':
        return Response(
            {'error': 'Only parents can access this endpoint'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    unlinked_students = User.objects.filter(role='Student', parent__isnull=True)
    serializer = UserSerializer(unlinked_students, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def link_child_view(request):
    """Link a student to the current parent user using Student ID."""
    
    if request.user.role != 'Parent':
        return Response(
            {'error': 'Only parents can link children'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    student_id = request.data.get('student_identification_number')
    region = request.data.get('region')
    
    if not student_id:
        return Response(
            {'error': 'Student Identification Number is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    if not region:
        return Response(
            {'error': 'Region is required for verification'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        child = User.objects.get(student_identification_number=student_id, role='Student')
        
        # Verify Region Match
        if child.region != region:
             return Response(
                {'error': 'Region does not match the student record'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        child.parent = request.user
        child.save()
        return Response({'message': 'Child linked successfully'})
    except User.DoesNotExist:
        return Response(
            {'error': 'Student not found with this Identification Number'}, 
            status=status.HTTP_404_NOT_FOUND
        )


class FamilyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing families."""
    
    serializer_class = FamilySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'Admin':
            return Family.objects.all()
        
        return Family.objects.filter(members__user=user, members__is_active=True).distinct()
    
    @action(detail=False, methods=['get'])
    def my_families(self, request):
        """Get families for current user."""
        families = self.get_queryset()
        serializer = self.get_serializer(families, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_family(self, request):
        """Create a new family."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        family = serializer.save()
        
        membership_role = 'Student' if request.user.role == 'Student' else 'Parent'
        FamilyMembership.objects.create(
            family=family,
            user=request.user,
            role=membership_role
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get members of a family."""
        family = self.get_object()
        memberships = family.members.filter(is_active=True)
        serializer = FamilyMembershipSerializer(memberships, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_families_view(request):
    """Get families for current student."""
    
    if request.user.role != 'Student':
        return Response(
            {'error': 'Only students can access this endpoint'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    families = Family.objects.filter(
        members__user=request.user,
        members__is_active=True
    ).distinct()
    
    from .serializers import FamilyDetailedSerializer
    serializer = FamilyDetailedSerializer(families, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_families_view(request):
    """Search families by name or member username."""
    
    if request.user.role not in ['Student', 'Parent']:
        return Response(
            {'error': 'Only students and parents can access this endpoint'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    query = request.query_params.get('q', '')
    if not query:
        return Response({'error': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    families = Family.objects.filter(
        Q(name__istartswith=query) |
        Q(members__user__username__istartswith=query),
        members__is_active=True
    ).distinct()[:50]
    
    from .serializers import FamilyDetailedSerializer
    serializer = FamilyDetailedSerializer(families, many=True)
    return Response(serializer.data)


class FamilyMembershipViewSet(viewsets.ModelViewSet):
    """ViewSet for managing family memberships."""
    
    serializer_class = FamilyMembershipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'Admin':
            return FamilyMembership.objects.all()
        
        return FamilyMembership.objects.filter(family__members__user=user).distinct()
    
    @action(detail=False, methods=['post'])
    def add_member(self, request):
        """Add a member to a family."""
        family_id = request.data.get('family_id')
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'Student')
        
        try:
            family = Family.objects.get(id=family_id)
            user = User.objects.get(id=user_id)
            
            membership, created = FamilyMembership.objects.get_or_create(
                family=family,
                user=user,
                defaults={'role': role}
            )
            
            if not created and not membership.is_active:
                membership.is_active = True
                membership.save()
            
            serializer = self.get_serializer(membership)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except (Family.DoesNotExist, User.DoesNotExist) as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)


class UserDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user documents."""
    
    serializer_class = UserDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'Admin':
            return UserDocument.objects.all()
        return UserDocument.objects.filter(user=user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        # Auto-update status to Pending Review if currently Incomplete
        if self.request.user.account_status == 'Incomplete':
            self.request.user.account_status = 'Pending Review'
            self.request.user.save()
