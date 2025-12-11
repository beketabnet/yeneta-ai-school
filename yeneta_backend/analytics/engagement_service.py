"""
Service layer for engagement monitoring
Handles business logic for tracking and analyzing student engagement
"""
import logging
from typing import Dict, List, Optional
from django.utils import timezone
from django.db.models import Avg, Sum, Count, Q
from datetime import datetime, timedelta
from .engagement_models import EngagementSession, EngagementSnapshot, EngagementSummary

logger = logging.getLogger(__name__)


class EngagementService:
    """Service for managing engagement monitoring data."""
    
    @staticmethod
    def start_session(student, subject: Optional[str] = None, activity_type: str = 'Other') -> EngagementSession:
        """
        Start a new engagement session for a student.
        
        Args:
            student: User object (student)
            subject: Optional subject being studied
            activity_type: Type of activity
        
        Returns:
            EngagementSession object
        """
        # End any active sessions for this student first
        EngagementService.end_active_sessions(student)
        
        session = EngagementSession.objects.create(
            student=student,
            subject=subject,
            activity_type=activity_type,
            is_active=True
        )
        
        logger.info(f"Started engagement session #{session.id} for {student.username}")
        return session
    
    @staticmethod
    def end_active_sessions(student) -> int:
        """
        End all active sessions for a student.
        
        Args:
            student: User object
        
        Returns:
            Number of sessions ended
        """
        active_sessions = EngagementSession.objects.filter(
            student=student,
            is_active=True
        )
        
        count = 0
        for session in active_sessions:
            session.end_session()
            count += 1
        
        if count > 0:
            logger.info(f"Ended {count} active session(s) for {student.username}")
        
        return count
    
    @staticmethod
    def record_snapshot(
        session: EngagementSession,
        expression: str,
        person_detected: bool,
        confidence: float = 0.0,
        detected_objects: List[str] = None
    ) -> EngagementSnapshot:
        """
        Record an engagement detection snapshot.
        
        Args:
            session: EngagementSession object
            expression: Detected expression
            person_detected: Whether person was detected
            confidence: Detection confidence
            detected_objects: List of detected objects
        
        Returns:
            EngagementSnapshot object
        """
        snapshot = EngagementSnapshot.objects.create(
            session=session,
            expression=expression,
            person_detected=person_detected,
            confidence=confidence,
            detected_objects=detected_objects or []
        )
        
        # Update session counters
        expression_field = f"{expression}_count"
        if hasattr(session, expression_field):
            setattr(session, expression_field, getattr(session, expression_field) + 1)
        
        if person_detected:
            session.person_detected_count += 1
        
        session.save()
        
        return snapshot
    
    @staticmethod
    def get_active_sessions() -> List[EngagementSession]:
        """Get all currently active engagement sessions."""
        return EngagementSession.objects.filter(is_active=True).select_related('student')
    
    @staticmethod
    def get_session_by_student(student) -> Optional[EngagementSession]:
        """Get active session for a specific student."""
        return EngagementSession.objects.filter(
            student=student,
            is_active=True
        ).first()
    
    @staticmethod
    def get_live_engagement_data() -> Dict:
        """
        Get real-time engagement data for all active students.
        
        Returns:
            Dict with engagement statistics
        """
        active_sessions = EngagementService.get_active_sessions()
        
        # Calculate expression distribution
        expression_counts = {
            'happy': 0,
            'neutral': 0,
            'sad': 0,
            'angry': 0,
            'fearful': 0,
            'disgusted': 0,
            'surprised': 0,
            'unknown': 0
        }
        
        attention_students = []
        total_students = active_sessions.count()
        
        for session in active_sessions:
            # Get most recent snapshot
            recent_snapshot = session.snapshots.first()
            if recent_snapshot:
                expression = recent_snapshot.expression
                expression_counts[expression] = expression_counts.get(expression, 0) + 1
                
                # Check if requires attention
                if expression in ['sad', 'angry', 'fearful', 'disgusted']:
                    attention_students.append({
                        'student_id': session.student.id,
                        'student_name': session.student.username,
                        'expression': expression,
                        'duration': (timezone.now() - session.started_at).total_seconds() / 60
                    })
        
        return {
            'total_active': total_students,
            'expression_distribution': expression_counts,
            'attention_required': attention_students,
            'timestamp': timezone.now().isoformat()
        }
    
    @staticmethod
    def get_session_statistics(session: EngagementSession) -> Dict:
        """
        Get detailed statistics for a session.
        
        Args:
            session: EngagementSession object
        
        Returns:
            Dict with session statistics
        """
        session.calculate_metrics()
        
        return {
            'session_id': session.id,
            'student': session.student.username,
            'duration_minutes': session.duration_seconds / 60 if session.duration_seconds else 0,
            'engagement_score': session.engagement_score,
            'dominant_expression': session.dominant_expression,
            'expression_distribution': {
                'happy': session.happy_count,
                'neutral': session.neutral_count,
                'sad': session.sad_count,
                'angry': session.angry_count,
                'fearful': session.fearful_count,
                'disgusted': session.disgusted_count,
                'surprised': session.surprised_count,
                'unknown': session.unknown_count
            },
            'attention_percentage': session.attention_percentage,
            'person_detected_percentage': session.person_detected_percentage
        }
    
    @staticmethod
    def generate_daily_summary(date: datetime.date = None) -> EngagementSummary:
        """
        Generate daily engagement summary.
        
        Args:
            date: Date to generate summary for (defaults to today)
        
        Returns:
            EngagementSummary object
        """
        if date is None:
            date = timezone.now().date()
        
        # Get all sessions for the date
        sessions = EngagementSession.objects.filter(
            started_at__date=date,
            is_active=False  # Only completed sessions
        )
        
        if not sessions.exists():
            logger.info(f"No sessions found for {date}")
            return None
        
        # Calculate aggregates
        total_sessions = sessions.count()
        total_students = sessions.values('student').distinct().count()
        total_duration = sessions.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
        avg_duration = total_duration // total_sessions if total_sessions > 0 else 0
        
        # Calculate expression percentages
        total_detections = sessions.aggregate(Sum('total_detections'))['total_detections__sum'] or 1
        
        expression_sums = {
            'happy': sessions.aggregate(Sum('happy_count'))['happy_count__sum'] or 0,
            'neutral': sessions.aggregate(Sum('neutral_count'))['neutral_count__sum'] or 0,
            'sad': sessions.aggregate(Sum('sad_count'))['sad_count__sum'] or 0,
            'angry': sessions.aggregate(Sum('angry_count'))['angry_count__sum'] or 0,
            'fearful': sessions.aggregate(Sum('fearful_count'))['fearful_count__sum'] or 0,
            'disgusted': sessions.aggregate(Sum('disgusted_count'))['disgusted_count__sum'] or 0,
            'surprised': sessions.aggregate(Sum('surprised_count'))['surprised_count__sum'] or 0,
            'unknown': sessions.aggregate(Sum('unknown_count'))['unknown_count__sum'] or 0,
        }
        
        # Calculate averages
        avg_engagement_score = sessions.aggregate(Avg('engagement_score'))['engagement_score__avg'] or 0
        avg_attention_percentage = sessions.aggregate(Avg('attention_percentage'))['attention_percentage__avg'] or 0
        
        # Create or update summary
        summary, created = EngagementSummary.objects.update_or_create(
            date=date,
            hour=None,  # Daily summary
            defaults={
                'total_sessions': total_sessions,
                'total_students': total_students,
                'total_duration_seconds': total_duration,
                'average_duration_seconds': avg_duration,
                'happy_percentage': (expression_sums['happy'] / total_detections) * 100,
                'neutral_percentage': (expression_sums['neutral'] / total_detections) * 100,
                'sad_percentage': (expression_sums['sad'] / total_detections) * 100,
                'angry_percentage': (expression_sums['angry'] / total_detections) * 100,
                'fearful_percentage': (expression_sums['fearful'] / total_detections) * 100,
                'disgusted_percentage': (expression_sums['disgusted'] / total_detections) * 100,
                'surprised_percentage': (expression_sums['surprised'] / total_detections) * 100,
                'unknown_percentage': (expression_sums['unknown'] / total_detections) * 100,
                'average_engagement_score': avg_engagement_score,
                'attention_required_percentage': avg_attention_percentage
            }
        )
        
        logger.info(f"{'Created' if created else 'Updated'} daily summary for {date}")
        return summary
    
    @staticmethod
    def get_student_engagement_history(student, days: int = 7) -> List[Dict]:
        """
        Get engagement history for a student.
        
        Args:
            student: User object
            days: Number of days to look back
        
        Returns:
            List of session summaries
        """
        start_date = timezone.now() - timedelta(days=days)
        sessions = EngagementSession.objects.filter(
            student=student,
            started_at__gte=start_date,
            is_active=False
        ).order_by('-started_at')
        
        history = []
        for session in sessions:
            history.append(EngagementService.get_session_statistics(session))
        
        return history
    
    @staticmethod
    def get_engagement_trends(days: int = 7) -> List[Dict]:
        """
        Get engagement trends over time.
        
        Args:
            days: Number of days to look back
        
        Returns:
            List of daily summaries
        """
        start_date = timezone.now().date() - timedelta(days=days)
        summaries = EngagementSummary.objects.filter(
            date__gte=start_date,
            hour__isnull=True  # Daily summaries only
        ).order_by('date')
        
        trends = []
        for summary in summaries:
            trends.append({
                'date': summary.date.isoformat(),
                'total_students': summary.total_students,
                'average_engagement_score': summary.average_engagement_score,
                'attention_required_percentage': summary.attention_required_percentage,
                'happy_percentage': summary.happy_percentage,
                'neutral_percentage': summary.neutral_percentage,
                'negative_percentage': (summary.sad_percentage + summary.angry_percentage + 
                                       summary.fearful_percentage + summary.disgusted_percentage)
            })
        
        return trends
