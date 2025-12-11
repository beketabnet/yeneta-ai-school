from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from .models import SmartAlert, StudentFeedback
from .serializers import SmartAlertSerializer, StudentFeedbackSerializer


class SmartAlertViewSet(viewsets.ModelViewSet):
    """ViewSet for managing smart alerts."""
    
    queryset = SmartAlert.objects.all()
    serializer_class = SmartAlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = SmartAlert.objects.select_related('student', 'assigned_to')
        
        # Filter by role
        if self.request.user.role in ['Admin', 'Teacher']:
            queryset = queryset.all()
        elif self.request.user.role == 'Parent':
            queryset = queryset.filter(student__parent=self.request.user)
        else:  # Students
            queryset = queryset.filter(student=self.request.user)
        
        # Apply query parameters for filtering
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        priority_filter = self.request.query_params.get('priority')
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        category_filter = self.request.query_params.get('category')
        if category_filter:
            queryset = queryset.filter(category=category_filter)
        
        sentiment_filter = self.request.query_params.get('sentiment')
        if sentiment_filter:
            queryset = queryset.filter(sentiment=sentiment_filter)
        
        assigned_to_me = self.request.query_params.get('assigned_to_me')
        if assigned_to_me == 'true':
            queryset = queryset.filter(assigned_to=self.request.user)
        
        requires_attention = self.request.query_params.get('requires_attention')
        if requires_attention == 'true':
            queryset = queryset.filter(requires_immediate_attention=True)
        
        return queryset

    @action(detail=False, methods=['post'])
    def report_engagement(self, request):
        """Report engagement issue from frontend monitoring."""
        if request.user.role != 'Student':
            return Response(
                {'error': 'Only students can report engagement issues'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        expression = request.data.get('expression')
        duration = request.data.get('duration')
        subject = request.data.get('subject')
        
        if not expression or duration is None:
            return Response(
                {'error': 'expression and duration are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            from .alert_generator import AlertGenerator
            alert = AlertGenerator.generate_alert_from_engagement(
                student=request.user,
                expression=expression,
                duration_minutes=int(duration),
                subject=subject
            )
            
            if alert:
                serializer = self.get_serializer(alert)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {'message': 'No alert generated (thresholds not met)'},
                    status=status.HTTP_200_OK
                )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        """Analyze an alert using AI."""
        alert = self.get_object()
        
        # Only allow analysis if sentiment is Unknown or if re-analysis is requested
        if alert.sentiment != 'Unknown' and not request.data.get('force_reanalysis'):
            return Response(
                {'error': 'Alert has already been analyzed. Use force_reanalysis=true to re-analyze.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Import here to avoid circular imports
        from ai_tools.llm import llm_router, LLMRequest, TaskType, TaskComplexity, UserRole
        import json
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Prepare prompt for LLM
        prompt = f"""Analyze the following student alert:

Student: {alert.student.username}
Message: {alert.message_content}
Category: {alert.category}
Source: {alert.source}

Provide a JSON response with:
{{
    "sentiment": "Positive/Neutral/Negative",
    "severity": "Low/Medium/High/Critical",
    "analysis": "Brief analysis of the situation",
    "recommendedActions": ["action 1", "action 2"],
    "requiresImmediateAttention": false,
    "suggestedResponse": "Suggested response for teacher/admin"
}}

Be sensitive, professional, and provide actionable recommendations."""
        
        system_prompt = "You are an expert educational psychologist analyzing student alerts. Provide thoughtful, actionable recommendations."
        
        llm_request = LLMRequest(
            prompt=prompt,
            user_id=request.user.id,
            user_role=UserRole(request.user.role),
            task_type=TaskType.ALERT_ANALYSIS,
            complexity=TaskComplexity.ADVANCED,
            system_prompt=system_prompt,
            temperature=0.4,
            max_tokens=1000,
        )
        
        try:
            response = llm_router.process_request(llm_request)
            
            if not response.success:
                return Response(
                    {'error': response.error_message},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Parse AI response
            try:
                # Clean JSON response
                import re
                content = response.content
                content = re.sub(r'```(?:json)?', '', content)
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    content = json_match.group(0)
                
                analysis_result = json.loads(content)
                
                # Update alert with analysis results
                alert.sentiment = analysis_result.get('sentiment', 'Neutral')
                alert.severity = analysis_result.get('severity', 'Medium')
                alert.analysis = analysis_result.get('analysis', '')
                alert.recommended_actions = analysis_result.get('recommendedActions', [])
                alert.requires_immediate_attention = analysis_result.get('requiresImmediateAttention', False)
                alert.suggested_response = analysis_result.get('suggestedResponse', '')
                
                # Auto-set priority based on severity
                severity_to_priority = {
                    'Low': 'Low',
                    'Medium': 'Medium',
                    'High': 'High',
                    'Critical': 'Critical'
                }
                alert.priority = severity_to_priority.get(alert.severity, 'Medium')
                
                # Update status if it's still New
                if alert.status == 'New':
                    alert.status = 'Reviewed'
                
                alert.save()
                
                serializer = self.get_serializer(alert)
                return Response(serializer.data)
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response: {e}")
                # Fallback: just mark as analyzed with basic info
                alert.sentiment = 'Neutral'
                alert.analysis = response.content
                alert.status = 'Reviewed'
                alert.save()
                
                serializer = self.get_serializer(alert)
                return Response(serializer.data)
        
        except Exception as e:
            logger.error(f"Alert analysis error: {e}")
            return Response(
                {'error': 'Failed to analyze alert'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign an alert to a teacher or admin."""
        alert = self.get_object()
        assigned_to_id = request.data.get('assigned_to_id')
        
        if not assigned_to_id:
            return Response(
                {'error': 'assigned_to_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from users.models import User
        try:
            assigned_user = User.objects.get(id=assigned_to_id, role__in=['Admin', 'Teacher'])
            alert.assigned_to = assigned_user
            if alert.status == 'New':
                alert.status = 'In Progress'
            alert.save()
            
            serializer = self.get_serializer(alert)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found or not authorized to be assigned'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update alert status."""
        alert = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in dict(SmartAlert.STATUS_CHOICES):
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(dict(SmartAlert.STATUS_CHOICES).keys())}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        alert.status = new_status
        
        # Set resolved_at when status changes to Resolved
        if new_status == 'Resolved' and not alert.resolved_at:
            alert.resolved_at = timezone.now()
        
        # Optionally update resolution notes
        resolution_notes = request.data.get('resolution_notes')
        if resolution_notes:
            alert.resolution_notes = resolution_notes
        
        action_taken = request.data.get('action_taken')
        if action_taken:
            alert.action_taken = action_taken
        
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get alert statistics."""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_status': dict(queryset.values_list('status').annotate(count=Count('id'))),
            'by_priority': dict(queryset.values_list('priority').annotate(count=Count('id'))),
            'by_sentiment': dict(queryset.values_list('sentiment').annotate(count=Count('id'))),
            'by_category': dict(queryset.values_list('category').annotate(count=Count('id'))),
            'requires_attention': queryset.filter(requires_immediate_attention=True).count(),
            'unassigned': queryset.filter(assigned_to__isnull=True).count(),
            'assigned_to_me': queryset.filter(assigned_to=request.user).count() if request.user.role in ['Admin', 'Teacher'] else 0,
        }
        
        return Response(stats)


class StudentFeedbackViewSet(viewsets.ModelViewSet):
    """ViewSet for managing student feedback."""
    
    queryset = StudentFeedback.objects.all()
    serializer_class = StudentFeedbackSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = StudentFeedback.objects.select_related('student', 'assigned_to')
        
        # Filter by role
        if self.request.user.role in ['Admin', 'Teacher']:
            queryset = queryset.all()
        else:  # Students
            queryset = queryset.filter(student=self.request.user)
        
        # Apply query parameters for filtering
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        priority_filter = self.request.query_params.get('priority')
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        category_filter = self.request.query_params.get('category')
        if category_filter:
            queryset = queryset.filter(category=category_filter)
        
        assigned_to_me = self.request.query_params.get('assigned_to_me')
        if assigned_to_me == 'true':
            queryset = queryset.filter(assigned_to=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the student to the current user when creating feedback."""
        serializer.save(student=self.request.user)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign feedback to a teacher or admin."""
        feedback = self.get_object()
        assigned_to_id = request.data.get('assigned_to_id')
        
        if not assigned_to_id:
            return Response(
                {'error': 'assigned_to_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from users.models import User
        try:
            assigned_user = User.objects.get(id=assigned_to_id, role__in=['Admin', 'Teacher'])
            feedback.assigned_to = assigned_user
            if feedback.status == 'New':
                feedback.status = 'In Review'
            feedback.save()
            
            serializer = self.get_serializer(feedback)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found or not authorized to be assigned'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get feedback statistics."""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_status': dict(queryset.values_list('status').annotate(count=Count('id')).values_list('status', 'count')),
            'by_priority': dict(queryset.values_list('priority').annotate(count=Count('id')).values_list('priority', 'count')),
            'by_category': dict(queryset.values_list('category').annotate(count=Count('id')).values_list('category', 'count')),
            'unassigned': queryset.filter(assigned_to__isnull=True).count(),
            'assigned_to_me': queryset.filter(assigned_to=request.user).count() if request.user.role in ['Admin', 'Teacher'] else 0,
        }
        
        return Response(stats)
