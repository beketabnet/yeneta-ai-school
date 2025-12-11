"""
Management command to test the complete course approval and enrollment workflow.
Usage: python manage.py test_course_workflow
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User, Family, FamilyMembership
from academics.models import TeacherCourseRequest, StudentEnrollmentRequest
from communications.models import Notification


class Command(BaseCommand):
    help = 'Test the complete course approval and enrollment workflow'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting course workflow test...'))

        try:
            # Get or create test users
            teacher = User.objects.filter(role='Teacher').first()
            if not teacher:
                self.stdout.write(self.style.ERROR('No teacher found. Please create a teacher user first.'))
                return

            student = User.objects.filter(role='Student').first()
            if not student:
                self.stdout.write(self.style.ERROR('No student found. Please create a student user first.'))
                return

            admin = User.objects.filter(role='Admin').first()
            if not admin:
                self.stdout.write(self.style.ERROR('No admin found. Please create an admin user first.'))
                return

            parent = User.objects.filter(role='Parent').first()
            if not parent:
                self.stdout.write(self.style.ERROR('No parent found. Please create a parent user first.'))
                return

            # Step 1: Teacher submits course request
            self.stdout.write(self.style.SUCCESS('\n=== STEP 1: Teacher submits course request ==='))
            course_request, created = TeacherCourseRequest.objects.get_or_create(
                teacher=teacher,
                subject='Mathematics',
                grade_level='10',
                stream=None,
                defaults={
                    'status': 'pending',
                    'requested_at': timezone.now()
                }
            )
            if created:
                self.stdout.write(f'✓ Created course request: {course_request}')
                # Create notification for admin
                Notification.objects.create(
                    recipient=admin,
                    notification_type='new_course_request',
                    title='New Course Request',
                    message=f'{teacher.first_name} {teacher.last_name} has submitted a request to teach {course_request.subject} in Grade {course_request.grade_level}.',
                    related_course_request=course_request
                )
                self.stdout.write(f'✓ Admin notified about new course request')
            else:
                self.stdout.write(f'Course request already exists: {course_request}')

            # Step 2: Admin approves course request
            self.stdout.write(self.style.SUCCESS('\n=== STEP 2: Admin approves course request ==='))
            course_request.status = 'approved'
            course_request.reviewed_by = admin
            course_request.reviewed_at = timezone.now()
            course_request.review_notes = 'Approved for teaching mathematics.'
            course_request.save()
            self.stdout.write(f'✓ Course request approved')

            # Notify teacher
            Notification.objects.create(
                recipient=teacher,
                notification_type='course_request_approved',
                title='Course Request Approved',
                message=f'Your request to teach {course_request.subject} in Grade {course_request.grade_level} has been approved.',
                related_course_request=course_request
            )
            self.stdout.write(f'✓ Teacher notified about approval')

            # Step 3: Student sees available courses and requests enrollment
            self.stdout.write(self.style.SUCCESS('\n=== STEP 3: Student requests enrollment ==='))

            # Get or create family
            family, created = Family.objects.get_or_create(
                name='Test Family',
                defaults={'created_at': timezone.now()}
            )
            if created:
                self.stdout.write(f'✓ Created family: {family.name}')
            else:
                self.stdout.write(f'Using existing family: {family.name}')

            # Add student to family
            FamilyMembership.objects.get_or_create(
                family=family,
                user=student,
                defaults={'role': 'Student', 'is_active': True}
            )

            # Add parent to family
            FamilyMembership.objects.get_or_create(
                family=family,
                user=parent,
                defaults={'role': 'Parent', 'is_active': True}
            )

            # Create enrollment request
            enrollment_request, created = StudentEnrollmentRequest.objects.get_or_create(
                student=student,
                teacher=teacher,
                subject=course_request.subject,
                grade_level=course_request.grade_level,
                stream=course_request.stream,
                family=family,
                defaults={
                    'status': 'pending',
                    'requested_at': timezone.now()
                }
            )
            if created:
                self.stdout.write(f'✓ Created enrollment request: {enrollment_request}')
                # Notify teacher
                Notification.objects.create(
                    recipient=teacher,
                    notification_type='new_enrollment_request',
                    title='New Enrollment Request',
                    message=f'{student.first_name} {student.last_name} has submitted an enrollment request for {course_request.subject}.',
                    related_enrollment_request=enrollment_request
                )
                self.stdout.write(f'✓ Teacher notified about enrollment request')
            else:
                self.stdout.write(f'Enrollment request already exists: {enrollment_request}')

            # Step 4: Teacher approves enrollment
            self.stdout.write(self.style.SUCCESS('\n=== STEP 4: Teacher approves enrollment ==='))
            enrollment_request.status = 'approved'
            enrollment_request.reviewed_by = teacher
            enrollment_request.reviewed_at = timezone.now()
            enrollment_request.review_notes = 'Approved for enrollment.'
            enrollment_request.save()
            self.stdout.write(f'✓ Enrollment request approved')

            # Notify student
            Notification.objects.create(
                recipient=student,
                notification_type='enrollment_request_approved',
                title='Enrollment Approved',
                message=f'Your enrollment request for {enrollment_request.subject} with {teacher.first_name} {teacher.last_name} has been approved.',
                related_enrollment_request=enrollment_request
            )
            self.stdout.write(f'✓ Student notified about approval')

            # Notify parent
            Notification.objects.create(
                recipient=parent,
                notification_type='enrollment_request_approved',
                title='Family Enrollment Notification',
                message=f'{student.first_name} {student.last_name} has been enrolled in {enrollment_request.subject}.',
                related_enrollment_request=enrollment_request
            )
            self.stdout.write(f'✓ Parent notified about student enrollment')

            # Notify admin
            admin_users = User.objects.filter(role='Admin', is_active=True)
            for admin_user in admin_users:
                Notification.objects.create(
                    recipient=admin_user,
                    notification_type='enrollment_request_approved',
                    title='Student Enrollment Approved',
                    message=f'{student.first_name} {student.last_name} has been approved for enrollment in {enrollment_request.subject} by {teacher.first_name} {teacher.last_name}.',
                    related_enrollment_request=enrollment_request
                )
            self.stdout.write(f'✓ Admin(s) notified about student enrollment')

            # Summary
            self.stdout.write(self.style.SUCCESS('\n=== WORKFLOW TEST COMPLETE ==='))
            self.stdout.write(f'Teacher: {teacher.first_name} {teacher.last_name}')
            self.stdout.write(f'Student: {student.first_name} {student.last_name}')
            self.stdout.write(f'Subject: {course_request.subject}')
            self.stdout.write(f'Grade Level: {course_request.grade_level}')
            self.stdout.write(f'Family: {family.name}')
            self.stdout.write(f'Course Request Status: {course_request.status}')
            self.stdout.write(f'Enrollment Request Status: {enrollment_request.status}')

            # Count notifications
            admin_notifs = Notification.objects.filter(recipient=admin).count()
            teacher_notifs = Notification.objects.filter(recipient=teacher).count()
            student_notifs = Notification.objects.filter(recipient=student).count()
            parent_notifs = Notification.objects.filter(recipient=parent).count()

            self.stdout.write(self.style.SUCCESS(f'\nNotifications sent:'))
            self.stdout.write(f'  Admin: {admin_notifs}')
            self.stdout.write(f'  Teacher: {teacher_notifs}')
            self.stdout.write(f'  Student: {student_notifs}')
            self.stdout.write(f'  Parent: {parent_notifs}')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
            import traceback
            traceback.print_exc()
