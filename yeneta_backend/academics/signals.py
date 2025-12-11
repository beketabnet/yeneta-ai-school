from django.db.models.signals import post_save
from django.dispatch import receiver
from communications.models import StudentAssignment
from academics.models import StudentGrade

@receiver(post_save, sender=StudentAssignment)
def sync_assignment_grade(sender, instance, created, **kwargs):
    """
    Signal receiver to create or update a StudentGrade record whenever
    a StudentAssignment is graded.
    """
    # Only proceed if the assignment is graded and has a grade value
    if instance.is_graded and instance.grade is not None:
        try:
            # Map document_type to assignment_type or exam_type
            assignment_type = 'assignment' # Default
            exam_type = None
            
            # Simple mapping logic - can be expanded
            if instance.document_type in ['quiz', 'exam']:
                # If it's a quiz or exam, checks if it maps to exam_type
                if instance.document_type == 'quiz':
                    assignment_type = 'quiz'
                elif instance.document_type == 'exam':
                    # Assuming it maps to a generic exam or specific one if we had info
                    exam_type = 'Final Exam' # Fallback, or maybe just assignment_type='Exam'
                    assignment_type = None
            else:
                # Map other types directly if they exist in choices, else default to 'assignment'
                # StudentAssignment types: essay, research_paper, lab_report, presentation, project, homework
                # StudentGrade types: quiz, assignment, homework, project, lab_report, presentation, group_work, essay...
                
                # Direct string match for common types
                common_types = ['homework', 'project', 'lab_report', 'presentation', 'essay']
                if instance.document_type in common_types:
                    assignment_type = instance.document_type
            
            # Check if a grade already exists for this specific assignment
            # We use the assignment topic as the title
            grade, created = StudentGrade.objects.update_or_create(
                student=instance.student,
                subject=instance.subject,
                title=instance.assignment_topic, # Using topic as unique identifier logic combined with student/subject
                defaults={
                    'grade_level': instance.grade_level,
                    'assignment_type': assignment_type,
                    'exam_type': exam_type,
                    'score': float(instance.grade),
                    'max_score': 100, # Defaulting to 100 as StudentAssignment mostly assumes out of 100 or percentage
                    'feedback': instance.feedback,
                    'graded_by': instance.teacher,
                    'graded_at': instance.graded_at,
                    'stream': '' # StudentAssignment doesn't have stream, maybe fetch from enrollment if needed, but leaving blank is safer than guessing
                }
            )
            
            print(f"Synced grade for {instance.student.username} - {instance.assignment_topic}: {grade.score}")
            
        except Exception as e:
            print(f"Error syncing grade for assignment {instance.id}: {str(e)}")
