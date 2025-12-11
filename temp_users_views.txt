from rest_framework import generics, status, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import Family, FamilyMembership
from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer, 
    UserProfileSerializer,
    ChildSummarySerializer,
    FamilySerializer,
    FamilyMembershipSerializer
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
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
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
        # Admins can see all users
        if self.request.user.role == 'Admin':
            return User.objects.all()
        # Teachers can see students, parents, and admins (for messaging)
        elif self.request.user.role == 'Teacher':
            return User.objects.filter(role__in=['Student', 'Parent', 'Admin'])
        # Parents can see teachers and admins (for messaging)
        elif self.request.user.role == 'Parent':
            return User.objects.filter(role__in=['Teacher', 'Admin'])
        # Others can only see themselves
        return User.objects.filter(id=self.request.user.id)


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
    """Link a student to the current parent user."""
    
    if request.user.role != 'Parent':
        return Response(
            {'error': 'Only parents can link children'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    child_id = request.data.get('child_id')
    if not child_id:
        return Response(
            {'error': 'child_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        child = User.objects.get(id=child_id, role='Student')
        child.parent = request.user
        child.save()
        return Response({'message': 'Child linked successfully'})
    except User.DoesNotExist:
        return Response(
            {'error': 'Student not found'}, 
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
    
    serializer = FamilySerializer(families, many=True)
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
        Q(name__icontains=query) |
        Q(members__user__username__icontains=query),
        members__is_active=True
    ).distinct()[:10]
    
    serializer = FamilySerializer(families, many=True)
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
