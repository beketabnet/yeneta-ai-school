"""
Alert Generation Service for Smart Alerts
Monitors student interactions and generates alerts based on patterns and triggers.
"""
import logging
from typing import Dict, List, Optional
from django.utils import timezone
from .models import SmartAlert

logger = logging.getLogger(__name__)


class AlertGenerator:
    """Service for generating smart alerts from student interactions."""
    
    # Keywords that might indicate issues
    NEGATIVE_KEYWORDS = [
        'confused', 'don\'t understand', 'difficult', 'hard', 'struggling',
        'frustrated', 'help', 'stuck', 'lost', 'worried', 'anxious',
        'scared', 'afraid', 'sad', 'depressed', 'lonely', 'bullied',
        'hate', 'quit', 'give up', 'can\'t do', 'impossible', 'too hard'
    ]
    
    POSITIVE_KEYWORDS = [
        'understand', 'got it', 'makes sense', 'clear', 'easy',
        'interesting', 'fun', 'enjoy', 'love', 'excited', 'happy',
        'confident', 'ready', 'prepared', 'thank you', 'helpful'
    ]
    
    EMOTIONAL_DISTRESS_KEYWORDS = [
        'depressed', 'suicide', 'kill myself', 'hurt myself', 'self-harm',
        'abuse', 'bullied', 'scared', 'afraid', 'threatened', 'unsafe'
    ]
    
    @staticmethod
    def analyze_message_sentiment(message: str) -> tuple[str, str, bool]:
        """
        Analyze message sentiment and determine if it requires attention.
        
        Returns:
            tuple: (sentiment, category, requires_immediate_attention)
        """
        message_lower = message.lower()
        
        # Check for emotional distress (highest priority)
        for keyword in AlertGenerator.EMOTIONAL_DISTRESS_KEYWORDS:
            if keyword in message_lower:
                return ('Negative', 'Emotional', True)
        
        # Count positive and negative indicators
        negative_count = sum(1 for keyword in AlertGenerator.NEGATIVE_KEYWORDS if keyword in message_lower)
        positive_count = sum(1 for keyword in AlertGenerator.POSITIVE_KEYWORDS if keyword in message_lower)
        
        # Determine sentiment
        if negative_count > positive_count and negative_count >= 2:
            category = 'Academic' if any(word in message_lower for word in ['understand', 'difficult', 'hard', 'confused']) else 'Behavioral'
            requires_attention = negative_count >= 3
            return ('Negative', category, requires_attention)
        elif positive_count > negative_count:
            return ('Positive', 'Engagement', False)
        else:
            return ('Neutral', 'Engagement', False)
    
    @staticmethod
    def should_generate_alert(
        student,
        message: str,
        context: Optional[Dict] = None
    ) -> bool:
        """
        Determine if an alert should be generated based on message content and context.
        
        Args:
            student: User object (student)
            message: Message content
            context: Optional context data (subject, topic, etc.)
        
        Returns:
            bool: True if alert should be generated
        """
        sentiment, category, requires_attention = AlertGenerator.analyze_message_sentiment(message)
        
        # Always generate alerts for negative sentiment or immediate attention
        if sentiment == 'Negative' or requires_attention:
            return True
        
        # Check for repeated struggles (if context provides history)
        if context and context.get('repeated_struggles'):
            return True
        
        # Check for low engagement patterns
        if context and context.get('low_engagement_score', 100) < 50:
            return True
        
        return False
    
    @staticmethod
    def generate_alert(
        student,
        message: str,
        source: str = 'AI Tutor',
        context: Optional[Dict] = None
    ) -> Optional[SmartAlert]:
        """
        Generate a smart alert for a student.
        
        Args:
            student: User object (student)
            message: Message content that triggered the alert
            source: Source of the alert (default: 'AI Tutor')
            context: Optional context data
        
        Returns:
            SmartAlert object if created, None otherwise
        """
        try:
            # Analyze the message
            sentiment, category, requires_attention = AlertGenerator.analyze_message_sentiment(message)
            
            # Determine priority based on sentiment and attention requirement
            if requires_attention:
                priority = 'Critical'
            elif sentiment == 'Negative':
                priority = 'High'
            elif sentiment == 'Neutral':
                priority = 'Medium'
            else:
                priority = 'Low'
            
            # Check if similar alert exists recently (avoid duplicates)
            recent_threshold = timezone.now() - timezone.timedelta(hours=1)
            recent_similar = SmartAlert.objects.filter(
                student=student,
                message_content__icontains=message[:50],  # Check first 50 chars
                created_at__gte=recent_threshold
            ).exists()
            
            if recent_similar:
                logger.info(f"Skipping duplicate alert for student {student.username}")
                return None
            
            # Create the alert
            alert = SmartAlert.objects.create(
                student=student,
                message_content=message[:1000],  # Limit message length
                sentiment=sentiment,
                status='New',
                priority=priority,
                category=category,
                requires_immediate_attention=requires_attention,
                source=source,
                context_data=context or {}
            )
            
            logger.info(f"Generated alert #{alert.id} for student {student.username}: {category} - {priority}")
            return alert
            
        except Exception as e:
            logger.error(f"Failed to generate alert: {e}")
            return None
    
    @staticmethod
    def generate_alert_from_tutor_interaction(
        student,
        student_message: str,
        tutor_response: str,
        subject: Optional[str] = None,
        topic: Optional[str] = None
    ) -> Optional[SmartAlert]:
        """
        Generate alert from AI Tutor interaction if needed.
        
        Args:
            student: User object (student)
            student_message: Student's message to the tutor
            tutor_response: Tutor's response
            subject: Optional subject
            topic: Optional topic
        
        Returns:
            SmartAlert object if created, None otherwise
        """
        context = {
            'subject': subject,
            'topic': topic,
            'tutor_response_length': len(tutor_response),
            'interaction_type': 'AI Tutor'
        }
        
        if AlertGenerator.should_generate_alert(student, student_message, context):
            return AlertGenerator.generate_alert(
                student=student,
                message=student_message,
                source='AI Tutor',
                context=context
            )
        
        return None
    
    @staticmethod
    def generate_alert_from_engagement(
        student,
        expression: str,
        duration_minutes: int,
        subject: Optional[str] = None
    ) -> Optional[SmartAlert]:
        """
        Generate alert from engagement monitoring data.
        
        Args:
            student: User object (student)
            expression: Detected expression (sad, angry, fearful, etc.)
            duration_minutes: Duration of the expression
            subject: Optional subject being studied
        
        Returns:
            SmartAlert object if created, None otherwise
        """
        # Only generate alerts for concerning expressions that persist
        concerning_expressions = ['sad', 'angry', 'fearful', 'disgusted']
        
        if expression not in concerning_expressions or duration_minutes < 5:
            return None
        
        message = f"Student showed {expression} expression for {duration_minutes} minutes during {subject or 'study session'}."
        
        context = {
            'expression': expression,
            'duration_minutes': duration_minutes,
            'subject': subject,
            'source_type': 'Engagement Monitor'
        }
        
        # Determine priority based on duration and expression
        if duration_minutes >= 15 or expression in ['fearful', 'disgusted']:
            priority = 'High'
            requires_attention = True
        else:
            priority = 'Medium'
            requires_attention = False
        
        try:
            alert = SmartAlert.objects.create(
                student=student,
                message_content=message,
                sentiment='Negative',
                status='New',
                priority=priority,
                category='Emotional',
                requires_immediate_attention=requires_attention,
                source='Engagement Monitor',
                context_data=context
            )
            
            logger.info(f"Generated engagement alert #{alert.id} for student {student.username}")
            return alert
            
        except Exception as e:
            logger.error(f"Failed to generate engagement alert: {e}")
            return None
    
    @staticmethod
    def generate_alert_from_performance(
        student,
        subject: str,
        recent_scores: List[float],
        threshold: float = 50.0
    ) -> Optional[SmartAlert]:
        """
        Generate alert from academic performance data.
        
        Args:
            student: User object (student)
            subject: Subject name
            recent_scores: List of recent scores (0-100)
            threshold: Score threshold below which to generate alert
        
        Returns:
            SmartAlert object if created, None otherwise
        """
        if not recent_scores:
            return None
        
        avg_score = sum(recent_scores) / len(recent_scores)
        
        if avg_score >= threshold:
            return None
        
        message = f"Student's average score in {subject} is {avg_score:.1f}% (based on {len(recent_scores)} recent assessments)."
        
        context = {
            'subject': subject,
            'average_score': avg_score,
            'recent_scores': recent_scores,
            'threshold': threshold,
            'source_type': 'Performance Monitor'
        }
        
        # Determine priority based on score
        if avg_score < 30:
            priority = 'Critical'
            requires_attention = True
        elif avg_score < 40:
            priority = 'High'
            requires_attention = True
        else:
            priority = 'Medium'
            requires_attention = False
        
        try:
            alert = SmartAlert.objects.create(
                student=student,
                message_content=message,
                sentiment='Negative',
                status='New',
                priority=priority,
                category='Academic',
                requires_immediate_attention=requires_attention,
                source='Performance Monitor',
                context_data=context
            )
            
            logger.info(f"Generated performance alert #{alert.id} for student {student.username}")
            return alert
            
        except Exception as e:
            logger.error(f"Failed to generate performance alert: {e}")
            return None


# Convenience function for easy import
def generate_alert_from_tutor(student, message: str, **kwargs):
    """Convenience function to generate alert from tutor interaction."""
    return AlertGenerator.generate_alert_from_tutor_interaction(student, message, '', **kwargs)
