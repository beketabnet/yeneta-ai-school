from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from academics.models import TeacherCourseRequest, StudentEnrollmentRequest

@receiver(post_save, sender=TeacherCourseRequest)
def course_request_handler(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    group_name = ''
    message = {}

    if created:
        group_name = 'admin_notifications'
        message = {
            'type': 'notification_message',
            'message': {
                'event': 'COURSE_REQUEST_CREATED',
                'data': {
                    'request_id': instance.id,
                    'teacher_name': f'{instance.teacher.first_name} {instance.teacher.last_name}',
                    'subject': instance.subject
                }
            }
        }
    else: # It's an update
        if instance.status == 'approved':
            group_name = f'user_{instance.teacher.id}_notifications'
            message = {
                'type': 'notification_message',
                'message': {
                    'event': 'COURSE_REQUEST_APPROVED',
                    'data': {'request_id': instance.id, 'status': instance.status}
                }
            }

    if group_name:
        async_to_sync(channel_layer.group_send)(group_name, message)

@receiver(post_save, sender=StudentEnrollmentRequest)
def enrollment_request_handler(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    group_name = ''
    message = {}

    if created:
        group_name = f'user_{instance.teacher.id}_notifications'
        message = {
            'type': 'notification_message',
            'message': {
                'event': 'ENROLLMENT_REQUEST_CREATED',
                'data': {
                    'request_id': instance.id,
                    'student_name': f'{instance.student.first_name} {instance.student.last_name}',
                    'subject': instance.subject
                }
            }
        }
    else: # It's an update
        if instance.status in ['approved', 'declined', 'under_review']:
            # Notify student
            student_group_name = f'user_{instance.student.id}_notifications'
            student_message = {
                'type': 'notification_message',
                'message': {
                    'event': f'ENROLLMENT_REQUEST_{instance.status.upper()}',
                    'data': {'request_id': instance.id, 'status': instance.status}
                }
            }
            async_to_sync(channel_layer.group_send)(student_group_name, student_message)

            # Notify parent if family is linked
            if instance.family:
                # Get all parent/guardian members of the family
                from users.models import FamilyMembership
                parent_members = FamilyMembership.objects.filter(
                    family=instance.family,
                    role__in=['Parent', 'Parent/Guardian', 'Guardian'],
                    is_active=True
                ).select_related('user')
                
                for parent_member in parent_members:
                    parent_group_name = f'user_{parent_member.user.id}_notifications'
                    parent_message = {
                        'type': 'notification_message',
                        'message': {
                            'event': 'ENROLLMENT_REQUEST_APPROVED_FOR_CHILD',
                            'data': {
                                'student_name': f'{instance.student.first_name} {instance.student.last_name}',
                                'subject': instance.subject
                            }
                        }
                    }
                    async_to_sync(channel_layer.group_send)(parent_group_name, parent_message)

    if group_name:
        async_to_sync(channel_layer.group_send)(group_name, message)
