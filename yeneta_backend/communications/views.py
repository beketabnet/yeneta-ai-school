from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Conversation, Message, SharedFileNotification, StudentAssignment, Notification
from academics.models import StudentGrade
from .serializers import (
    ConversationSerializer, MessageSerializer,
    SharedFileNotificationSerializer, StudentAssignmentSerializer, StudentAssignmentListSerializer,
    NotificationSerializer
)
from users.models import User
import logging

logger = logging.getLogger(__name__)


class ConversationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing conversations."""
    
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create a new conversation or return existing one between participants."""
        participant_ids = request.data.get('participants', [])
        
        if not participant_ids:
            return Response(
                {'error': 'Participants list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Include current user in participants
        all_participant_ids = set(participant_ids + [request.user.id])
        
        # Check if conversation already exists with exactly these participants
        from django.db.models import Count, Q
        existing_conversation = None
        
        # Find conversations where current user is a participant
        potential_conversations = Conversation.objects.filter(
            participants=request.user
        ).annotate(
            participant_count=Count('participants')
        ).filter(
            participant_count=len(all_participant_ids)
        )
        
        # Check each conversation to see if it has exactly the same participants
        for conv in potential_conversations:
            conv_participant_ids = set(conv.participants.values_list('id', flat=True))
            if conv_participant_ids == all_participant_ids:
                existing_conversation = conv
                break
        
        if existing_conversation:
            # Return existing conversation
            logger.info(f"Returning existing conversation {existing_conversation.id}")
            serializer = self.get_serializer(existing_conversation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Create new conversation
        conversation = Conversation.objects.create()
        conversation.participants.set(all_participant_ids)
        logger.info(f"Created new conversation {conversation.id} with participants {all_participant_ids}")
        
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages in a conversation."""
        conversation = self.get_object()
        messages = Message.objects.filter(conversation=conversation).order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing messages."""
    
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Message.objects.filter(conversation__participants=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Override create to add logging for debugging."""
        logger.info(f"Message create request - User: {request.user.username}")
        logger.info(f"Data: conversation={request.data.get('conversation')}, content_length={len(request.data.get('content', ''))}")
        logger.info(f"Files: {list(request.FILES.keys())}")
        
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Save message with current user as sender."""
        serializer.save(sender=self.request.user)
        logger.info(f"Message created successfully: ID={serializer.instance.id}")


class SharedFileNotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing shared file notifications."""
    
    serializer_class = SharedFileNotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return notifications for current user."""
        return SharedFileNotification.objects.filter(recipient=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=True, methods=['post'])
    def mark_downloaded(self, request, pk=None):
        """Mark notification as downloaded."""
        notification = self.get_object()
        notification.is_downloaded = True
        notification.save()
        return Response({'status': 'marked as downloaded'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = SharedFileNotification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({'count': count})


class StudentAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing student assignments."""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return StudentAssignmentListSerializer
        return StudentAssignmentSerializer
    
    def get_queryset(self):
        """Return assignments based on user role."""
        user = self.request.user
        
        # Base queryset with related objects
        queryset = StudentAssignment.objects.select_related('student', 'teacher')
        
        if user.role == 'Student':
            return queryset.filter(student=user)
        elif user.role == 'Teacher':
            return queryset.filter(teacher=user)
        elif user.role == 'Admin':
            return queryset
        
        return StudentAssignment.objects.none()
    
    @action(detail=False, methods=['get'])
    def active_teachers(self, request):
        """Get list of active teachers for assignment submission."""
        teachers = User.objects.filter(role='Teacher', is_active=True)
        from users.serializers import UserSerializer
        serializer = UserSerializer(teachers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def assignment_topics(self, request):
        """Get list of unique assignment topics for Quick Grader dropdown."""
        teacher_id = request.query_params.get('teacher_id')
        
        queryset = StudentAssignment.objects.filter(teacher=request.user)
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        
        topics = queryset.values_list('assignment_topic', flat=True).distinct()
        return Response({'topics': list(topics)})
    
    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        """Grade an assignment."""
        assignment = self.get_object()
        
        if request.user.role != 'Teacher' or assignment.teacher != request.user:
            return Response(
                {'error': 'Only the assigned teacher can grade this assignment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        grade = request.data.get('grade')
        feedback = request.data.get('feedback', '')
        
        if grade is None:
            return Response(
                {'error': 'Grade is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        assignment.grade = grade
        assignment.feedback = feedback
        assignment.is_graded = True
        assignment.graded_at = timezone.now()
        assignment.save()
        
        # Sync to StudentGrade
        try:
            # Map document_type to assignment_type/exam_type
            assignment_type = 'Assignment'
            exam_type = None
            
            # Simple mapping based on document_type or default to Assignment
            if assignment.document_type == 'Exam':
                assignment_type = None
                exam_type = 'Final Exam' # Default assumption, or add field to StudentAssignment
            elif assignment.document_type == 'Quiz':
                assignment_type = None
                exam_type = 'Quiz'
            
            StudentGrade.objects.update_or_create(
                student=assignment.student,
                subject=assignment.subject,
                title=assignment.assignment_topic,
                defaults={
                    'grade_level': assignment.grade_level or 'N/A', # Use assignment grade level or fallback
                    'stream': getattr(assignment.student, 'stream', None), # Safely get stream or None
                    'assignment_type': assignment_type,
                    'exam_type': exam_type,
                    'score': float(grade),
                    'max_score': 100, # Default max score, should ideally be on assignment
                    'graded_by': request.user,
                    'graded_at': timezone.now(),
                    'feedback': feedback
                }
            )
        except Exception as e:
            logger.error(f"Failed to sync grade to StudentGrade: {e}")
        
        serializer = self.get_serializer(assignment)
        return Response(serializer.data)


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing notifications."""
    
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return notifications for current user."""
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({'count': count})
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get all unread notifications."""
        notifications = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).order_by('-created_at')
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)


class CommunicationContactsView(viewsets.ViewSet):
    """
    ViewSet for retrieving filtered contacts for "Start New Conversation".
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def get_contacts(self, request):
        """
        Get contacts categorized by role, filtered specifically for the current user.
        For Parents:
        - Students: Only their own children.
        - Teachers: Only teachers of their children's enrolled courses.
        - Admins: All active admins.
        - Parents: All other active parents.
        """
        user = request.user
        
        # Initialize containers
        students = User.objects.none()
        teachers = User.objects.none()
        admins = User.objects.none()
        parents = User.objects.none()
        
        if user.role == 'Parent':
            # 1. Students: Only own children
            # Note: We use 'children' related name if available, or filter directly
            # Model has: parent = models.ForeignKey(..., related_name='children')
            students = user.children.filter(role='Student', is_active=True)
            
            # 2. Teachers: Teachers of linked children's enrolled courses
            # Logic:
            # - Get children
            # - Get enrollments (StudentEnrollmentRequest with status='approved' OR Enrollment model)
            # The user request mentions "approved for enrollment".
            # We should check both Enrollment model (actual enrollments) and accepted requests if needed.
            # Usually Enrollment model is the source of truth for active enrollments.
            
            # Let's import Enrollment
            from academics.models import Enrollment
            
            # Get IDs of children
            child_ids = students.values_list('id', flat=True)
            
            # Get courses enrolled by these children
            # Enrollment has 'course' foreign key
            enrolled_course_ids = Enrollment.objects.filter(student_id__in=child_ids).values_list('course_id', flat=True)
            
            # Get teachers of these courses
            # Course has 'teacher' foreign key
            from academics.models import Course
            teacher_ids = Course.objects.filter(id__in=enrolled_course_ids).values_list('teacher_id', flat=True).distinct()
            
            teachers = User.objects.filter(id__in=teacher_ids, role='Teacher', is_active=True)
            
            # 3. Admins: All active admins
            admins = User.objects.filter(role='Admin', is_active=True)
            
            # 4. Parents: All other active parents
            parents = User.objects.filter(role='Parent', is_active=True).exclude(id=user.id)
            
        elif user.role == 'Student':
            from academics.models import Enrollment, Course
            from users.models import FamilyMembership
            
            # 1. Teachers: Only teachers of enrolled courses
            enrolled_course_ids = Enrollment.objects.filter(student=user).values_list('course_id', flat=True)
            teacher_ids = Course.objects.filter(id__in=enrolled_course_ids).values_list('teacher_id', flat=True).distinct()
            teachers = User.objects.filter(id__in=teacher_ids, role='Teacher', is_active=True)
            
            # 2. Family: Parents and Siblings
            # A. Parents
            parent_ids = set()
            if user.parent:
                parent_ids.add(user.parent.id)
            
            # B. Check Family memberships
            # Get families this student belongs to
            family_ids = FamilyMembership.objects.filter(user=user).values_list('family_id', flat=True)
            
            # Get other members of these families
            family_members = FamilyMembership.objects.filter(family_id__in=family_ids).exclude(user=user)
            
            # Separate into Parents and Siblings (Students)
            related_parent_ids = family_members.filter(role__in=['Parent', 'Guardian']).values_list('user_id', flat=True)
            parent_ids.update(related_parent_ids)
            
            parents = User.objects.filter(id__in=parent_ids, role='Parent', is_active=True)
            
            # C. Siblings (Students)
            sibling_ids = family_members.filter(role__in=['Student', 'Sibling']).values_list('user_id', flat=True)
            students = User.objects.filter(id__in=sibling_ids, role='Student', is_active=True)

            # 3. Admins: All active admins (for support)
            admins = User.objects.filter(role='Admin', is_active=True)

        elif user.role == 'Teacher':
            from academics.models import Course, Enrollment
            from users.models import FamilyMembership
            
            # 1. Students: Only students enrolled in courses taught by this teacher
            # Get courses taught by this teacher
            course_ids = Course.objects.filter(teacher=user).values_list('id', flat=True)
            
            # Get students enrolled in these courses
            student_ids = Enrollment.objects.filter(course_id__in=course_ids).values_list('student_id', flat=True).distinct()
            students = User.objects.filter(id__in=student_ids, role='Student', is_active=True)
            
            # 2. Parents: Parents of these students
            # A. Direct parent
            direct_parent_ids = students.values_list('parent_id', flat=True)
            
            # B. Family members (Parents/Guardians)
            family_ids = FamilyMembership.objects.filter(user__in=students).values_list('family_id', flat=True)
            family_parent_ids = FamilyMembership.objects.filter(
                family_id__in=family_ids, 
                role__in=['Parent', 'Guardian']
            ).values_list('user_id', flat=True)
            
            all_parent_ids = set(direct_parent_ids)
            all_parent_ids.update(family_parent_ids)
            # Remove None if any
            all_parent_ids.discard(None)
            
            parents = User.objects.filter(id__in=all_parent_ids, role='Parent', is_active=True)
            
            # 3. Teachers: All other teachers (colleagues)
            teachers = User.objects.filter(role='Teacher', is_active=True).exclude(id=user.id)
            
            # 4. Admins: All active admins
            admins = User.objects.filter(role='Admin', is_active=True)

        else:
            # Fallback for other roles (Admin)
            if user.role == 'Admin':
                # Admins see everyone usually
                students = User.objects.filter(role='Student', is_active=True)
                admins = User.objects.filter(role='Admin', is_active=True).exclude(id=user.id)
                parents = User.objects.filter(role='Parent', is_active=True)
                teachers = User.objects.filter(role='Teacher', is_active=True)

        # Serialize results
        # We need a simple serializer for User basic info
        from users.serializers import UserSerializer # Or a leaner one if available
        
        data = {
            'students': UserSerializer(students, many=True).data,
            'teachers': UserSerializer(teachers, many=True).data,
            'admins': UserSerializer(admins, many=True).data,
            'parents': UserSerializer(parents, many=True).data,
        }
        
        return Response(data)
