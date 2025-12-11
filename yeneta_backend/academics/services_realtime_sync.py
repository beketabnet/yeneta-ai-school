"""
Real-time Synchronization Service
Handles real-time updates across all related features when grades are changed.
Triggers updates for Student Gradebook, Parent Dashboard, and Analytics.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import StudentGrade, Grade, Enrollment


class RealtimeSyncService:
    """Service for real-time synchronization of grade updates"""
    
    CACHE_KEYS = {
        'teacher_stats': 'teacher_stats_{teacher_id}',
        'student_grades': 'student_grades_{student_id}',
        'parent_stats': 'parent_stats_{parent_id}',
        'subject_average': 'subject_avg_{teacher_id}_{subject}',
        'class_analytics': 'class_analytics_{teacher_id}',
    }
    
    @staticmethod
    def invalidate_caches(student_id=None, teacher_id=None, parent_id=None, subject=None):
        """
        Invalidate relevant caches when grade data changes.
        
        Args:
            student_id: Student affected
            teacher_id: Teacher affected
            parent_id: Parent affected
            subject: Subject affected
        """
        cache_keys_to_clear = []
        
        if student_id:
            cache_keys_to_clear.append(RealtimeSyncService.CACHE_KEYS['student_grades'].format(student_id=student_id))
            if parent_id:
                cache_keys_to_clear.append(RealtimeSyncService.CACHE_KEYS['parent_stats'].format(parent_id=parent_id))
        
        if teacher_id:
            cache_keys_to_clear.append(RealtimeSyncService.CACHE_KEYS['teacher_stats'].format(teacher_id=teacher_id))
            if subject:
                cache_keys_to_clear.append(RealtimeSyncService.CACHE_KEYS['subject_average'].format(teacher_id=teacher_id, subject=subject))
            cache_keys_to_clear.append(RealtimeSyncService.CACHE_KEYS['class_analytics'].format(teacher_id=teacher_id))
        
        # Clear all matching keys
        for key in cache_keys_to_clear:
            cache.delete(key)
    
    @staticmethod
    def get_affected_parent_ids(student_id):
        """Get parent IDs affected by student grade changes"""
        from users.models import Family, FamilyMember
        
        parent_ids = []
        try:
            families = FamilyMember.objects.filter(
                family__students__id=student_id
            ).select_related('family__head_of_family')
            
            for member in families:
                if member.family.head_of_family:
                    parent_ids.append(member.family.head_of_family.id)
        except Exception:
            pass
        
        return parent_ids
    
    @staticmethod
    def sync_grade_update(grade_obj, action='update'):
        """
        Sync a grade update across all related features.
        
        Args:
            grade_obj: StudentGrade or Grade object
            action: 'create', 'update', or 'delete'
        """
        student_id = getattr(grade_obj, 'student_id', None)
        teacher_id = getattr(grade_obj, 'graded_by_id', None)
        subject = getattr(grade_obj, 'subject', None)
        
        if student_id and teacher_id:
            # Get parent IDs
            parent_ids = RealtimeSyncService.get_affected_parent_ids(student_id)
            
            # Invalidate caches
            RealtimeSyncService.invalidate_caches(
                student_id=student_id,
                teacher_id=teacher_id,
                parent_id=parent_ids[0] if parent_ids else None,
                subject=subject
            )
            
            # Trigger WebSocket broadcast if available
            try:
                from services.eventService import eventService, EVENTS
                
                eventService.emit(EVENTS.GRADE_UPDATED, {
                    'student_id': student_id,
                    'teacher_id': teacher_id,
                    'subject': subject,
                    'action': action,
                    'timestamp': str(grade_obj.created_at if hasattr(grade_obj, 'created_at') else None)
                })
            except Exception:
                # Event service not available in backend
                pass


# Signal handlers for automatic cache invalidation
@receiver(post_save, sender=StudentGrade)
def on_student_grade_save(sender, instance, created, **kwargs):
    """Handle StudentGrade save events"""
    action = 'create' if created else 'update'
    RealtimeSyncService.sync_grade_update(instance, action)


@receiver(post_delete, sender=StudentGrade)
def on_student_grade_delete(sender, instance, **kwargs):
    """Handle StudentGrade delete events"""
    RealtimeSyncService.sync_grade_update(instance, 'delete')


@receiver(post_save, sender=Grade)
def on_grade_save(sender, instance, created, **kwargs):
    """Handle Grade save events"""
    action = 'create' if created else 'update'
    RealtimeSyncService.sync_grade_update(instance, action)


@receiver(post_delete, sender=Grade)
def on_grade_delete(sender, instance, **kwargs):
    """Handle Grade delete events"""
    RealtimeSyncService.sync_grade_update(instance, 'delete')
