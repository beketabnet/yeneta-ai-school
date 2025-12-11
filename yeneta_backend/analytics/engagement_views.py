"""
API views for engagement monitoring
"""
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
import logging

from .engagement_models import EngagementSession, EngagementSnapshot, EngagementSummary
from .engagement_serializers import (
    EngagementSessionSerializer,
    EngagementSessionListSerializer,
    EngagementSnapshotSerializer,
    EngagementSummarySerializer
)
from .engagement_service import EngagementService

logger = logging.getLogger(__name__)


class EngagementSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing engagement sessions."""
    
    queryset = EngagementSession.objects.all()
    serializer_class = EngagementSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EngagementSessionListSerializer
        return EngagementSessionSerializer
    
    def get_queryset(self):
        queryset = EngagementSession.objects.select_related('student')
        
        # Filter by role
        if self.request.user.role == 'Student':
            queryset = queryset.filter(student=self.request.user)
        elif self.request.user.role == 'Parent':
            queryset = queryset.filter(student__parent=self.request.user)
        # Admin and Teacher can see all
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by student
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(started_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(started_at__lte=end_date)
        
        return queryset.order_by('-started_at')
    
    @action(detail=False, methods=['post'])
    def start_session(self, request):
        """Start a new engagement session."""
        subject = request.data.get('subject')
        activity_type = request.data.get('activity_type', 'Other')
        
        # For students, use their own account
        if request.user.role == 'Student':
            student = request.user
        else:
            # For testing, allow specifying student_id
            student_id = request.data.get('student_id')
            if not student_id:
                return Response(
                    {'error': 'student_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            from users.models import User
            try:
                student = User.objects.get(id=student_id, role='Student')
            except User.DoesNotExist:
                return Response(
                    {'error': 'Student not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        session = EngagementService.start_session(student, subject, activity_type)
        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        """End an engagement session."""
        session = self.get_object()
        
        if not session.is_active:
            return Response(
                {'error': 'Session is already ended'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.end_session()
        serializer = self.get_serializer(session)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def record_snapshot(self, request, pk=None):
        """Record an engagement snapshot for this session."""
        session = self.get_object()
        
        if not session.is_active:
            return Response(
                {'error': 'Cannot record snapshot for inactive session'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expression = request.data.get('expression', 'unknown')
        person_detected = request.data.get('person_detected', False)
        confidence = request.data.get('confidence', 0.0)
        detected_objects = request.data.get('detected_objects', [])
        
        snapshot = EngagementService.record_snapshot(
            session, expression, person_detected, confidence, detected_objects
        )
        
        snapshot_serializer = EngagementSnapshotSerializer(snapshot)
        return Response(snapshot_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get detailed statistics for a session."""
        session = self.get_object()
        stats = EngagementService.get_session_statistics(session)
        return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def live_engagement_view(request):
    """Get real-time engagement data for all active students."""
    data = EngagementService.get_live_engagement_data()
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def engagement_trends_view_enhanced(request):
    """Get engagement trends over time."""
    days = int(request.query_params.get('days', 7))
    trends = EngagementService.get_engagement_trends(days)
    return Response(trends)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_engagement_history_view(request):
    """Get engagement history for a specific student."""
    student_id = request.query_params.get('student_id')
    days = int(request.query_params.get('days', 7))
    
    if not student_id:
        # If no student_id provided and user is a student, use their own ID
        if request.user.role == 'Student':
            student_id = request.user.id
        else:
            return Response(
                {'error': 'student_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    from users.models import User
    try:
        student = User.objects.get(id=student_id, role='Student')
    except User.DoesNotExist:
        return Response(
            {'error': 'Student not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    if request.user.role == 'Student' and request.user.id != student.id:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    elif request.user.role == 'Parent' and student.parent_id != request.user.id:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    history = EngagementService.get_student_engagement_history(student, days)
    return Response(history)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_daily_summary_view(request):
    """Generate daily engagement summary (admin only)."""
    if request.user.role not in ['Admin', 'Teacher']:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    date_str = request.data.get('date')
    if date_str:
        from datetime import datetime
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
    else:
        date = timezone.now().date()
    
    summary = EngagementService.generate_daily_summary(date)
    
    if summary:
        serializer = EngagementSummarySerializer(summary)
        return Response(serializer.data)
    else:
        return Response(
            {'message': 'No sessions found for the specified date'},
            status=status.HTTP_404_NOT_FOUND
        )


class EngagementSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing engagement summaries."""
    
    queryset = EngagementSummary.objects.all()
    serializer_class = EngagementSummarySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = EngagementSummary.objects.all()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Filter by hour (for hourly summaries)
        hour = self.request.query_params.get('hour')
        if hour is not None:
            queryset = queryset.filter(hour=hour)
        else:
            # Default to daily summaries only
            queryset = queryset.filter(hour__isnull=True)
        
        return queryset.order_by('-date', '-hour')
