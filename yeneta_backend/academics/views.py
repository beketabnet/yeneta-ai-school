from django.utils import timezone
from django.db.models import Avg, Q, F, ExpressionWrapper, FloatField
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Assignment, Submission, PracticeQuestion, Course, Enrollment, Unit, GradeItem, Grade, TeacherCourseRequest, StudentEnrollmentRequest, StudentGrade, MasterCourse, Region, GradeLevel, Stream, Subject, Curriculum
from .serializers import (
    AssignmentSerializer, SubmissionSerializer, PracticeQuestionSerializer,
    CourseSerializer, CourseWithGradesSerializer, GradeItemSerializer, GradeSerializer,
    TeacherCourseRequestSerializer, StudentEnrollmentRequestSerializer, StudentGradeSerializer,
    MasterCourseSerializer, RegionSerializer, GradeLevelSerializer, StreamSerializer, SubjectSerializer, CurriculumSerializer
)
from rest_framework.exceptions import ValidationError as DRFValidationError
from communications.models import Notification
from .services import GradeAggregationService
from .services_grade_entry import TeacherSubjectGradesService


class MasterCourseViewSet(viewsets.ModelViewSet):
    """ViewSet for managing master courses."""
    queryset = MasterCourse.objects.all()
    serializer_class = MasterCourseSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        Admins can do everything. Others can only list/retrieve active courses.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only Admins can modify
            # We'll check role in the view or use a custom permission
            return [IsAuthenticated()] 
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'Admin':
            return MasterCourse.objects.all()
        # Teachers and others only see active courses
        return MasterCourse.objects.filter(is_active=True)

    def perform_create(self, serializer):
        if self.request.user.role != 'Admin':
            raise DRFValidationError("Only admins can create courses.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != 'Admin':
            raise DRFValidationError("Only admins can update courses.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'Admin':
            raise DRFValidationError("Only admins can delete courses.")
        instance.delete()


class TeacherCourseRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing teacher course requests."""

    serializer_class = TeacherCourseRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        status_filter = self.request.query_params.get('status')

        if user.role == 'Admin':
            queryset = TeacherCourseRequest.objects.all()
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            return queryset

        elif user.role == 'Teacher':
            queryset = TeacherCourseRequest.objects.filter(teacher=user)
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            return queryset
            
        return TeacherCourseRequest.objects.none()

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)
        
        course_request = serializer.instance
        from users.models import User
        admins = User.objects.filter(role='Admin', is_active=True)
        
        for admin in admins:
            Notification.objects.create(
                recipient=admin,
                notification_type='new_course_request',
                title=f'New Course Request',
                message=f'{self.request.user.first_name} {self.request.user.last_name} has submitted a request to teach {course_request.subject} in Grade {course_request.grade_level}.',
                related_course_request=course_request
            )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a course request."""
        if request.user.role != 'Admin':
            return Response({'error': 'Only admins can approve requests'}, status=status.HTTP_403_FORBIDDEN)

        course_request = self.get_object()
        course_request.status = 'approved'
        course_request.reviewed_by = request.user
        course_request.reviewed_at = timezone.now()
        course_request.review_notes = request.data.get('review_notes', '')
        course_request.save()
        
        Notification.objects.create(
            recipient=course_request.teacher,
            notification_type='course_request_approved',
            title=f'Course Request Approved',
            message=f'Your request to teach {course_request.subject} in Grade {course_request.grade_level} has been approved.',
            related_course_request=course_request
        )

        serializer = self.get_serializer(course_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline a course request."""
        if request.user.role != 'Admin':
            return Response({'error': 'Only admins can decline requests'}, status=status.HTTP_403_FORBIDDEN)

        course_request = self.get_object()
        course_request.status = 'declined'
        course_request.reviewed_by = request.user
        course_request.reviewed_at = timezone.now()
        course_request.review_notes = request.data.get('review_notes', '')
        course_request.save()
        
        Notification.objects.create(
            recipient=course_request.teacher,
            notification_type='course_request_declined',
            title=f'Course Request Declined',
            message=f'Your request to teach {course_request.subject} in Grade {course_request.grade_level} has been declined. Review notes: {course_request.review_notes or "None provided"}',
            related_course_request=course_request
        )

        serializer = self.get_serializer(course_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def under_review(self, request, pk=None):
        """Put a course request under review."""
        if request.user.role != 'Admin':
            return Response({'error': 'Only admins can set requests under review'}, status=status.HTTP_403_FORBIDDEN)

        course_request = self.get_object()
        course_request.status = 'under_review'
        course_request.reviewed_by = request.user
        course_request.reviewed_at = timezone.now()
        course_request.review_notes = request.data.get('review_notes', '')
        course_request.save()
        
        Notification.objects.create(
            recipient=course_request.teacher,
            notification_type='course_request_under_review',
            title=f'Course Request Under Review',
            message=f'Your request to teach {course_request.subject} in Grade {course_request.grade_level} is now under review.',
            related_course_request=course_request
        )

        serializer = self.get_serializer(course_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def end_course(self, request, pk=None):
        """Mark a course as ended (admin only)."""
        if request.user.role != 'Admin':
            return Response({'error': 'Only admins can end courses'}, status=status.HTTP_403_FORBIDDEN)

        course_request = self.get_object()
        course_request.status = 'course_ended'
        course_request.reviewed_by = request.user
        course_request.reviewed_at = timezone.now()
        course_request.review_notes = request.data.get('review_notes', '')
        course_request.save()
        
        Notification.objects.create(
            recipient=course_request.teacher,
            notification_type='course_ended',
            title=f'Course Ended',
            message=f'Your course {course_request.subject} in Grade {course_request.grade_level} has been marked as ended.',
            related_course_request=course_request
        )

        serializer = self.get_serializer(course_request)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_courses_view(request):
    """Get available courses for student enrollment."""
    if request.user.role != 'Student':
        return Response({'error': 'Only students can view available courses'}, status=status.HTTP_403_FORBIDDEN)

    # Get approved teacher course requests
    approved_requests = TeacherCourseRequest.objects.filter(status='approved')

    courses = []
    for req in approved_requests:
        courses.append({
            'id': req.id,
            'subject': req.subject,
            'grade_level': req.grade_level,
            'stream': req.stream,
            'teacher': {
                'id': req.teacher.id,
                'username': req.teacher.username,
                'first_name': req.teacher.first_name,
                'last_name': req.teacher.last_name,
                'full_name': req.teacher.get_full_name()
            }
        })

    # Apply filters
    grade_level = request.query_params.get('grade_level')
    subject = request.query_params.get('subject')
    teacher = request.query_params.get('teacher')
    stream = request.query_params.get('stream')

    if grade_level:
        courses = [c for c in courses if c['grade_level'] == grade_level]
    if subject:
        courses = [c for c in courses if subject.lower() in c['subject'].lower()]
    if teacher:
        courses = [c for c in courses if teacher.lower() in f"{c['teacher']['first_name']} {c['teacher']['last_name']}".lower()]
    if stream:
        courses = [c for c in courses if c['stream'] and stream.lower() in c['stream'].lower()]

    return Response(courses)


class StudentEnrollmentRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing student enrollment requests."""

    serializer_class = StudentEnrollmentRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'Admin':
            return StudentEnrollmentRequest.objects.all()
        elif user.role == 'Teacher':
            return StudentEnrollmentRequest.objects.filter(teacher=user)
        elif user.role == 'Student':
            return StudentEnrollmentRequest.objects.filter(student=user)
        return StudentEnrollmentRequest.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Override create to handle course field and provide better error messages."""
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"DEBUG: Error creating enrollment request: {str(e)}")
            print(f"DEBUG: Request data: {request.data}")
            raise

    def perform_create(self, serializer):
        student = self.request.user
        
        # Handle both 'teacher' and 'course'/'course_id' (TeacherCourseRequest ID) fields
        teacher_id = self.request.data.get('teacher')
        course_id = self.request.data.get('course') or self.request.data.get('course_id')
        
        subject = self.request.data.get('subject', '')
        grade_level = self.request.data.get('grade_level', '')
        stream = self.request.data.get('stream', '')
        
        if course_id:
            # If course ID is provided, it's a TeacherCourseRequest ID
            try:
                course_request = TeacherCourseRequest.objects.get(id=course_id)
                teacher_id = course_request.teacher.id
                subject = course_request.subject
                grade_level = course_request.grade_level
                stream = course_request.stream
            except TeacherCourseRequest.DoesNotExist:
                raise serializers.ValidationError({'course': 'Course not found or is not approved'})
        
        # Ensure teacher_id is provided
        if not teacher_id:
            raise serializers.ValidationError({'teacher': 'Teacher is required for enrollment request'})
        
        family_id = self.request.data.get('family')
        
        serializer.save(
            student=student,
            teacher_id=teacher_id,
            subject=subject,
            grade_level=grade_level,
            stream=stream,
            family_id=family_id
        )
        
        enrollment_request = serializer.instance
        Notification.objects.create(
            recipient_id=teacher_id,
            notification_type='new_enrollment_request',
            title=f'New Enrollment Request',
            message=f'{student.first_name} {student.last_name} has submitted an enrollment request for {subject}.',
            related_enrollment_request=enrollment_request
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve an enrollment request."""
        enrollment_request = self.get_object()

        # Permission check: Admin or assigned Teacher
        if request.user.role != 'Admin' and request.user != enrollment_request.teacher:
            return Response({'error': 'Only the assigned teacher or an admin can approve enrollment requests'}, status=status.HTTP_403_FORBIDDEN)

        # Precedence check: Teacher cannot override Admin
        if request.user.role == 'Teacher' and enrollment_request.reviewed_by and enrollment_request.reviewed_by.role == 'Admin':
             return Response({'error': 'Cannot override a decision made by an Administrator'}, status=status.HTTP_403_FORBIDDEN)

        enrollment_request.status = 'approved'
        enrollment_request.reviewed_by = request.user
        enrollment_request.reviewed_at = timezone.now()
        enrollment_request.review_notes = request.data.get('review_notes', '')
        enrollment_request.save()
        
        Notification.objects.create(
            recipient=enrollment_request.student,
            notification_type='enrollment_request_approved',
            title=f'Enrollment Approved',
            message=f'Your enrollment request for {enrollment_request.subject} with {enrollment_request.teacher.first_name} {enrollment_request.teacher.last_name} has been approved.',
            related_enrollment_request=enrollment_request
        )
        
        if enrollment_request.family:
            from users.models import FamilyMembership
            # Get all active parents in the family
            parents = FamilyMembership.objects.filter(
                family=enrollment_request.family,
                role='Parent',
                is_active=True
            ).select_related('user')
            
            for membership in parents:
                Notification.objects.create(
                    recipient=membership.user,
                    notification_type='enrollment_request_approved',
                    title=f'Family Enrollment Notification',
                    message=f'{enrollment_request.student.first_name} {enrollment_request.student.last_name} has been enrolled in {enrollment_request.subject}.',
                    related_enrollment_request=enrollment_request
                )
        
        from users.models import User
        admins = User.objects.filter(role='Admin', is_active=True)
        for admin in admins:
            Notification.objects.create(
                recipient=admin,
                notification_type='enrollment_request_approved',
                title=f'Student Enrollment Approved',
                message=f'{enrollment_request.student.first_name} {enrollment_request.student.last_name} has been approved for enrollment in {enrollment_request.subject} by {enrollment_request.teacher.first_name} {enrollment_request.teacher.last_name}.',
                related_enrollment_request=enrollment_request
            )

        # Get or create the course first
        # Now including stream to ensure unique courses for different streams
        course, _ = Course.objects.get_or_create(
            teacher=enrollment_request.teacher,
            subject=enrollment_request.subject,
            grade_level=enrollment_request.grade_level,
            stream=enrollment_request.stream,
            defaults={'title': f"{enrollment_request.subject} - Grade {enrollment_request.grade_level}" + (f" ({enrollment_request.stream})" if enrollment_request.stream else "")}
        )
        
        # Create actual enrollment
        Enrollment.objects.get_or_create(
            student=enrollment_request.student,
            course=course,
            defaults={'enrolled_at': timezone.now()}
        )

        serializer = self.get_serializer(enrollment_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline an enrollment request."""
        enrollment_request = self.get_object()

        # Permission check: Admin or assigned Teacher
        if request.user.role != 'Admin' and request.user != enrollment_request.teacher:
            return Response({'error': 'Only the assigned teacher or an admin can decline enrollment requests'}, status=status.HTTP_403_FORBIDDEN)

        # Precedence check: Teacher cannot override Admin
        if request.user.role == 'Teacher' and enrollment_request.reviewed_by and enrollment_request.reviewed_by.role == 'Admin':
             return Response({'error': 'Cannot override a decision made by an Administrator'}, status=status.HTTP_403_FORBIDDEN)

        enrollment_request.status = 'declined'
        enrollment_request.reviewed_by = request.user
        enrollment_request.reviewed_at = timezone.now()
        enrollment_request.review_notes = request.data.get('review_notes', '')
        enrollment_request.save()
        
        # Notify student
        Notification.objects.create(
            recipient=enrollment_request.student,
            notification_type='enrollment_request_declined',
            title=f'Enrollment Declined',
            message=f'Your enrollment request for {enrollment_request.subject} with {enrollment_request.teacher.first_name} {enrollment_request.teacher.last_name} has been declined.',
            related_enrollment_request=enrollment_request
        )

        serializer = self.get_serializer(enrollment_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def under_review(self, request, pk=None):
        """Put an enrollment request under review."""
        enrollment_request = self.get_object()

        # Permission check: Admin or assigned Teacher
        if request.user.role != 'Admin' and request.user != enrollment_request.teacher:
            return Response({'error': 'Only the assigned teacher or an admin can set enrollment requests under review'}, status=status.HTTP_403_FORBIDDEN)

        # Precedence check: Teacher cannot override Admin
        if request.user.role == 'Teacher' and enrollment_request.reviewed_by and enrollment_request.reviewed_by.role == 'Admin':
             return Response({'error': 'Cannot override a decision made by an Administrator'}, status=status.HTTP_403_FORBIDDEN)

        enrollment_request.status = 'under_review'
        enrollment_request.reviewed_by = request.user
        enrollment_request.reviewed_at = timezone.now()
        enrollment_request.review_notes = request.data.get('review_notes', '')
        enrollment_request.save()
        
        # Notify student
        Notification.objects.create(
            recipient=enrollment_request.student,
            notification_type='enrollment_request_under_review',
            title=f'Enrollment Under Review',
            message=f'Your enrollment request for {enrollment_request.subject} with {enrollment_request.teacher.first_name} {enrollment_request.teacher.last_name} is now under review.',
            related_enrollment_request=enrollment_request
        )

        serializer = self.get_serializer(enrollment_request)
        return Response(serializer.data)


class AssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing assignments."""
    
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter assignments by document type if provided."""
        queryset = Assignment.objects.all()
        document_type = self.request.query_params.get('document_type', None)
        
        if document_type:
            queryset = queryset.filter(document_type=document_type)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """Get all submissions for an assignment."""
        assignment = self.get_object()
        submissions = Submission.objects.filter(assignment=assignment)
        serializer = SubmissionSerializer(submissions, many=True)
        return Response(serializer.data)


class SubmissionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing submissions."""
    
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role in ['Admin', 'Teacher']:
            return Submission.objects.all()
        return Submission.objects.filter(student=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_grades_view(request):
    """Get grades for the current student from the central StudentGrade registry."""
    
    if request.user.role != 'Student':
        return Response(
            {'error': 'Only students can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from .models import StudentGrade
    
    # Get student's grades
    grades = StudentGrade.objects.filter(
        student=request.user
    ).select_related('graded_by')
    
    # Group by subject
    courses_dict = {}
    
    for grade in grades:
        # Create course key
        subject = grade.subject or 'General'
        # Use graded_by as teacher if available, otherwise 'Unknown'
        teacher_name = grade.graded_by.get_full_name() if grade.graded_by else 'Unknown'
        teacher_id = grade.graded_by.id if grade.graded_by else 0
        
        # We might have multiple teachers for the same subject, but usually one per course.
        # For simplicity and backward compatibility, we'll group by subject and teacher.
        course_key = f"{subject}_{teacher_id}"
        
        if course_key not in courses_dict:
            courses_dict[course_key] = {
                'id': course_key,
                'title': f"{subject} - {grade.grade_level or 'Grade'}",
                'teacher_name': teacher_name,
                'units': {},
                'grades': []
            }
        
        # Add to grades list for overall calculation
        courses_dict[course_key]['grades'].append(grade.percentage)
        
        # Determine unit key (category)
        # Priority: Exam Type -> Assignment Type -> 'Other'
        if grade.exam_type:
            unit_key = grade.exam_type
        elif grade.assignment_type:
            unit_key = grade.assignment_type
        else:
            unit_key = 'Other'
            
        if unit_key not in courses_dict[course_key]['units']:
            courses_dict[course_key]['units'][unit_key] = {
                'id': f"u_{course_key}_{unit_key.replace(' ', '_')}",
                'title': f"{unit_key}s", # e.g. "Quizzes", "Assignments"
                'items': []
            }
        
        # Add grade item
        courses_dict[course_key]['units'][unit_key]['items'].append({
            'id': grade.id,
            'title': grade.title,
            'score': grade.score,
            'max_score': grade.max_score,
            'type': unit_key,
            'feedback': grade.feedback,
            'graded_at': grade.graded_at
        })
    
    # Calculate overall grades and unit grades
    courses = []
    for course_data in courses_dict.values():
        if course_data['grades']:
            course_data['overall_grade'] = sum(course_data['grades']) / len(course_data['grades'])
        else:
            course_data['overall_grade'] = 0
        
        # Convert units dict to list and calculate unit grades
        units_list = []
        for unit_data in course_data['units'].values():
            if unit_data['items']:
                # Calculate average percentage for the unit
                unit_percentages = [(item['score'] / item['max_score']) * 100 for item in unit_data['items'] if item['max_score'] > 0]
                if unit_percentages:
                    unit_data['unit_grade'] = sum(unit_percentages) / len(unit_percentages)
                else:
                    unit_data['unit_grade'] = 0
            else:
                unit_data['unit_grade'] = 0
            units_list.append(unit_data)
        
        course_data['units'] = units_list
        del course_data['grades']  # Remove temporary grades list
        courses.append(course_data)
    
    return Response(courses)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def child_summary_view(request, child_id):
    """Get summary for a specific child (for parents)."""
    
    if request.user.role != 'Parent':
        return Response(
            {'error': 'Only parents can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        child = request.user.children.get(id=child_id, is_active=True)
    except User.DoesNotExist:
        return Response(
            {'error': 'Child not found or not linked to this parent'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # 1. Calculate Overall Progress (Average of all grades)
    from django.db.models import ExpressionWrapper, F, FloatField
    grades = StudentGrade.objects.filter(student=child)
    # Calculate overall progress (average of all grades)
    # percentage is a property, so we need to calculate it in the query
    overall_progress_agg = grades.annotate(
        grade_percentage=ExpressionWrapper(
            F('score') * 100.0 / F('max_score'),
            output_field=FloatField()
        )
    ).aggregate(avg_percentage=Avg('grade_percentage'))
    
    overall_progress = overall_progress_agg['avg_percentage'] or 0.0
    overall_progress = round(overall_progress, 1)
    # 2. Get Upcoming Assignments
    # Fetch assignments from enrolled courses that are due in the future
    from datetime import datetime
    from django.utils import timezone
    
    # Get enrolled subjects
    enrolled_subjects = StudentEnrollmentRequest.objects.filter(
        student=child,
        status='approved'
    ).values_list('subject', flat=True)
    
    # Get assignments for these subjects due in the future
    upcoming_assignments_qs = Assignment.objects.filter(
        course__in=enrolled_subjects,
        due_date__gte=timezone.now()
    ).order_by('due_date')[:5] # Limit to 5
    
    # Serialize assignments
    upcoming_assignments = []
    for assignment in upcoming_assignments_qs:
        upcoming_assignments.append({
            'id': assignment.id,
            'title': assignment.title,
            'description': assignment.description,
            'due_date': assignment.due_date.isoformat(),
            'subject': assignment.course.subject if assignment.course else 'General'
        })
        
    # 3. Recent Alerts Count (Mock for now, or use Notification/SmartAlert)
    # Assuming Notification model has 'is_read'
    recent_alerts_count = Notification.objects.filter(
        recipient=child,
        is_read=False
    ).count()

    # 4. Progress Trend (Last 6 months)
    from django.db.models.functions import TruncMonth
    
    # Get grades aggregated by month
    monthly_grades = grades.annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        averageScore=Avg(
            ExpressionWrapper(
                F('score') * 100.0 / F('max_score'),
                output_field=FloatField()
            )
        )
    ).order_by('month')
    
    # Format for frontend
    progress_trend = []
    for entry in monthly_grades:
        if entry['month']:
            progress_trend.append({
                'month': entry['month'].strftime('%b'),
                'averageScore': round(entry['averageScore'], 1)
            })
            
    # If no trend data, provide empty or last known
    if not progress_trend and overall_progress > 0:
        progress_trend.append({
            'month': timezone.now().strftime('%b'),
            'averageScore': round(overall_progress, 1)
        })

    summary = {
        'id': child.id,
        'name': f"{child.first_name} {child.last_name}" if child.first_name else child.username,
        'grade': child.grade_level or 'N/A',
        'overall_progress': round(overall_progress, 1),
        'upcoming_assignments': upcoming_assignments,
        'recent_alerts_count': recent_alerts_count,
        'progressTrend': progress_trend
    }
    
    return Response(summary)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_linked_students_view(request):
    """Get students linked to the current parent with approved enrollments."""
    if request.user.role != 'Parent':
        return Response(
            {'error': 'Only parents can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get all children directly linked to the parent
    children = request.user.children.filter(is_active=True)
    
    from users.serializers import UserSerializer
    serializer = UserSerializer(children, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_child_grades_view(request):
    """Get grades for a specific child of the current parent."""
    if request.user.role != 'Parent':
        return Response(
            {'error': 'Only parents can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )

    student_id = request.query_params.get('student_id')
    if not student_id:
        return Response(
            {'error': 'student_id query parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        student_id = int(student_id)
    except (ValueError, TypeError):
        return Response(
            {'error': 'student_id must be an integer'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        child = request.user.children.get(id=student_id, is_active=True)
    except User.DoesNotExist:
        return Response(
            {'error': 'Student not found or not linked to this parent'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Use StudentGrade model for more accurate grades
    grades = StudentGrade.objects.filter(student=child)
    
    # Group by subject
    courses_dict = {}
    
    for grade in grades:
        # Create unique key
        course_key = f"{grade.subject}_{grade.grade_level}_{grade.stream or ''}"
        
        if course_key not in courses_dict:
            courses_dict[course_key] = {
                'id': course_key,
                'title': f"{grade.subject} - {grade.grade_level}",
                'subject': grade.subject,
                'grade_level': grade.grade_level,
                'stream': grade.stream,
                'teacher_name': grade.graded_by.username if grade.graded_by else 'Unknown', # Could be improved by fetching enrollment
                'units': {},
                'grades': []
            }
            
        if grade.percentage is not None:
            courses_dict[course_key]['grades'].append(grade.percentage)
            
            # Create unit based on type
            unit_key = grade.assignment_type or grade.exam_type or 'Other'
            if unit_key not in courses_dict[course_key]['units']:
                courses_dict[course_key]['units'][unit_key] = {
                    'id': f"u_{course_key}_{unit_key}",
                    'title': f"{unit_key}s",
                    'items': []
                }
                
            courses_dict[course_key]['units'][unit_key]['items'].append({
                'id': grade.id,
                'title': f"{unit_key} - {grade.created_at.strftime('%Y-%m-%d')}",
                'score': grade.percentage,
                'max_score': 100,
                'type': unit_key
            })

    courses = []
    for course_data in courses_dict.values():
        if course_data['grades']:
            course_data['overall_grade'] = sum(course_data['grades']) / len(course_data['grades'])
        else:
            course_data['overall_grade'] = 0

        units_list = []
        for unit_data in course_data['units'].values():
            if unit_data['items']:
                unit_grades = [item['score'] for item in unit_data['items']]
                unit_data['unit_grade'] = sum(unit_grades) / len(unit_grades)
            else:
                unit_data['unit_grade'] = 0
            units_list.append(unit_data)

        course_data['units'] = units_list
        del course_data['grades']
        courses.append(course_data)

    return Response(courses)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def practice_questions_view(request):
    """Get practice questions filtered by subject."""
    
    subject = request.query_params.get('subject', '')
    questions = PracticeQuestion.objects.filter(subject__icontains=subject)
    serializer = PracticeQuestionSerializer(questions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_parents_view(request):
    """Get parents/guardians linked to the current student."""
    if request.user.role != 'Student':
        return Response(
            {'error': 'Only students can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get direct parent
    parents = []
    if request.user.parent:
        parents.append(request.user.parent)
        
    # Also check family memberships if needed (omitted for brevity as direct parent is main link)
    
    parent_list = []
    for parent in parents:
        parent_list.append({
            'id': parent.id,
            'username': parent.username,
            'first_name': parent.first_name,
            'last_name': parent.last_name,
            'email': parent.email,
            'family_id': 0, # Placeholder
            'family_name': 'Direct Parent'
        })
    
    return Response(parent_list)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_enrollment_requests_view(request):
    """Get enrollment requests for the current student."""
    if request.user.role != 'Student':
        return Response(
            {'error': 'Only students can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    requests_qs = StudentEnrollmentRequest.objects.filter(student=request.user).select_related('teacher', 'family')
    serializer = StudentEnrollmentRequestSerializer(requests_qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_enrolled_subjects_view(request):
    """Get subjects enrolled by families that the parent is part of or by their children directly."""
    if request.user.role != 'Parent':
        return Response(
            {'error': 'Only parents can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from users.models import FamilyMembership
    from django.db.models import Q
    
    # Get all families the parent is part of
    family_ids = FamilyMembership.objects.filter(
        user=request.user,
        role='Parent',
        is_active=True
    ).values_list('family_id', flat=True)
    
    # Get all approved enrollment requests for these families OR for the parent's children
    enrollments = StudentEnrollmentRequest.objects.filter(
        Q(family_id__in=family_ids) | Q(student__parent=request.user),
        status='approved'
    ).select_related('student', 'teacher', 'family').distinct()
    
    # Group by family and student
    result = {}
    for enrollment in enrollments:
        if enrollment.family:
            family_key = f"family_{enrollment.family.id}"
            family_id = enrollment.family.id
            family_name = enrollment.family.name
        else:
            family_key = "family_direct"
            family_id = 0
            family_name = "Direct Enrollments"

        if family_key not in result:
            result[family_key] = {
                'family_id': family_id,
                'family_name': family_name,
                'students': {}
            }
        
        student_key = f"student_{enrollment.student.id}"
        if student_key not in result[family_key]['students']:
            # Build student name with fallbacks
            first_name = enrollment.student.first_name
            last_name = enrollment.student.last_name
            username = enrollment.student.username

            if first_name and last_name:
                student_name = f"{first_name} {last_name}"
            elif first_name:
                student_name = first_name
            elif last_name:
                student_name = last_name
            else:
                student_name = username or 'Unknown Student'

            result[family_key]['students'][student_key] = {
                'student_id': enrollment.student.id,
                'student_name': student_name,
                'subjects': []
            }
        
        result[family_key]['students'][student_key]['subjects'].append({
            'id': enrollment.id,
            'subject': enrollment.subject,
            'grade_level': enrollment.grade_level,
            'stream': enrollment.stream,
            'teacher': {
                'id': enrollment.teacher.id,
                'first_name': enrollment.teacher.first_name,
                'last_name': enrollment.teacher.last_name,
                'username': enrollment.teacher.username,
                'full_name': enrollment.teacher.get_full_name()
            },
            'enrolled_date': enrollment.requested_at
        })
    
    # Convert to list format
    families_list = []
    for family_data in result.values():
        students_list = list(family_data['students'].values())
        
        # Calculate grades for each student's subjects
        for student in students_list:
            for subject in student['subjects']:
                # Fetch grades for this student and subject
                grades = StudentGrade.objects.filter(
                    student_id=student['student_id'],
                    subject=subject['subject'],
                    grade_level=subject['grade_level']
                ).order_by('created_at')
                
                if subject['stream']:
                    grades = grades.filter(stream=subject['stream'])
                
                # Calculate averages
                # Assignment Score (Category 'Assignment')
                assignment_avg = grades.filter(assignment_type='Assignment').aggregate(Avg('score'))['score__avg']
                
                # Quiz Score (Assignment Type or Exam Type 'Quiz')
                quiz_avg = grades.filter(Q(assignment_type='Quiz') | Q(exam_type='Quiz')).aggregate(Avg('score'))['score__avg']
                
                # Mid Exam Score
                mid_exam_avg = grades.filter(exam_type='Mid Exam').aggregate(Avg('score'))['score__avg']
                
                # Final Exam Score
                final_exam_avg = grades.filter(exam_type='Final Exam').aggregate(Avg('score'))['score__avg']
                
                # Add to subject data
                if assignment_avg is not None:
                    subject['assignment_score'] = round(assignment_avg, 2)
                if quiz_avg is not None:
                    subject['quiz_score'] = round(quiz_avg, 2)
                if mid_exam_avg is not None:
                    subject['mid_exam_score'] = round(mid_exam_avg, 2)
                if final_exam_avg is not None:
                    subject['final_exam_score'] = round(final_exam_avg, 2)

                # Calculate Trend
                scores = [g.percentage for g in grades if g.percentage is not None]
                trend = 'stable'
                trend_value = 0
                
                if len(scores) >= 2:
                    recent_count = min(3, len(scores) // 2 + 1)
                    recent_scores = scores[-recent_count:]
                    previous_scores = scores[:-recent_count]
                    
                    if previous_scores:
                        recent_avg = sum(recent_scores) / len(recent_scores)
                        previous_avg = sum(previous_scores) / len(previous_scores)
                        
                        diff = recent_avg - previous_avg
                        if diff > 2:
                            trend = 'improving'
                            trend_value = round(diff, 1)
                        elif diff < -2:
                            trend = 'declining'
                            trend_value = round(abs(diff), 1)
                    else:
                         if scores[-1] > scores[0] + 2:
                             trend = 'improving'
                             trend_value = round(scores[-1] - scores[0], 1)
                         elif scores[-1] < scores[0] - 2:
                             trend = 'declining'
                             trend_value = round(abs(scores[-1] - scores[0]), 1)
                
                subject['trend'] = trend
                subject['trend_value'] = trend_value

        family_data['students'] = students_list
        families_list.append(family_data)
    
    return Response(families_list)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def approved_courses_with_grades_view(request):
    """Get approved enrollment courses with grades and assignments for the current student."""

    if request.user.role != 'Student':
        return Response(
            {'error': 'Only students can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get approved enrollment requests for the student
    approved_enrollments = StudentEnrollmentRequest.objects.filter(
        student=request.user,
        status='approved'
    ).select_related('teacher')

    # Get student's grades from StudentGrade model
    student_grades = StudentGrade.objects.filter(
        student=request.user
    ).select_related('graded_by')

    # Group by course (teacher + subject + grade_level + stream)
    courses_dict = {}

    for enrollment in approved_enrollments:
        # Skip enrollments with missing grade_level
        if not enrollment.grade_level:
            continue
            
        # Unique key including teacher ID to separate same subject with different teachers
        course_key = f"{enrollment.teacher.id}_{enrollment.subject}_{enrollment.grade_level}_{enrollment.stream or ''}"

        if course_key not in courses_dict:
            # Fix "Grade Grade" issue
            grade_display = enrollment.grade_level
            if str(grade_display).lower().startswith('grade '):
                grade_display = str(grade_display)[6:]
            elif str(grade_display).lower().startswith('grade'):
                 grade_display = str(grade_display)[5:]
                 
            courses_dict[course_key] = {
                'id': course_key,
                'title': f"{enrollment.subject} - Grade {grade_display}",
                'subject': enrollment.subject,
                'grade_level': enrollment.grade_level,
                'stream': enrollment.stream,
                'teacher': {
                    'id': enrollment.teacher.id,
                    'username': enrollment.teacher.username,
                    'first_name': enrollment.teacher.first_name,
                    'last_name': enrollment.teacher.last_name,
                    'email': enrollment.teacher.email,
                },
                'units': {},
                'grades': [],
                'exam_grades': [],
                'assignment_grades': [],
                'overall_grade': 0,
                'assignment_average': 0,
                'exam_average': 0,
            }

    # Add grades to courses from StudentGrade model
    print(f"DEBUG: Found {len(student_grades)} grades for student {request.user.username}")
    for grade in student_grades:
        target_course_key = None
        
        print(f"DEBUG: Processing grade - Subject: '{grade.subject}', Level: '{grade.grade_level}', Stream: '{grade.stream}'")

        # Priority 1: Direct Match by Teacher (if graded_by is set)
        if grade.graded_by:
            potential_key = f"{grade.graded_by.id}_{grade.subject}_{grade.grade_level}_{grade.stream or ''}"
            if potential_key in courses_dict:
                target_course_key = potential_key

        # Priority 2: Match by Subject/Grade/Stream (fallback if no teacher match found yet)
        if not target_course_key:
            for key, course_data in courses_dict.items():
                print(f"  DEBUG: Comparing against Course - Subject: '{course_data['subject']}', Level: '{course_data['grade_level']}', Stream: '{course_data['stream']}'")
                
                # Check Subject
                subj_match = grade.subject == course_data['subject']
                # Check Grade Level
                # Normalize both to remove "Grade " prefix for comparison just in case, or rely on strict if DB is consistent
                # Let's try flexible grade matching
                g_grade = str(grade.grade_level).replace('Grade ', '').replace('Grade', '').strip()
                c_grade = str(course_data['grade_level']).replace('Grade ', '').replace('Grade', '').strip()
                grade_match = g_grade == c_grade
                
                # Check Stream (Relaxed)
                stream_match = (grade.stream is None or grade.stream == '' or grade.stream == course_data['stream'])
                
                print(f"  DEBUG: Match Result - Subject: {subj_match}, Grade: {grade_match} ('{g_grade}' vs '{c_grade}'), Stream: {stream_match}")

                if subj_match and grade_match and stream_match:
                    target_course_key = key
                    print(f"  DEBUG: >>> MATCH FOUND! Assigned to {course_data['title']}")
                    break 

        if target_course_key:
            course = courses_dict[target_course_key]
            percentage = grade.percentage
            
            if percentage is not None:
                # Add to appropriate list for calculation
                grade_type_lower = (grade.assignment_type or grade.exam_type or '').lower()
                is_exam = any(t in grade_type_lower for t in ['exam', 'mid', 'final'])
                
                if is_exam:
                     course['exam_grades'].append(percentage)
                else:
                     course['assignment_grades'].append(percentage)

                # Create unit/item entry for response
                grade_type = grade.assignment_type or grade.exam_type or 'Other'
                unit_key = grade_type
                if unit_key not in course['units']:
                    course['units'][unit_key] = {
                        'id': f"u_{course['id']}_{unit_key}",
                        'title': f"{grade_type}s",
                        'items': []
                    }

                course['units'][unit_key]['items'].append({
                    'id': grade.id,
                    'title': f"{grade_type} - {grade.subject}",
                    'score': percentage,
                    'max_score': 100,
                    'type': grade_type,
                    'submitted_at': grade.graded_at.isoformat() if grade.graded_at else None,
                })

    # Calculate overall grades and averages
    courses = []
    for course_data in courses_dict.values():
        assignment_avg = 0
        exam_avg = 0
        
        # Calculate Assignment Average
        if course_data['assignment_grades']:
            assignment_avg = sum(course_data['assignment_grades']) / len(course_data['assignment_grades'])
            course_data['assignment_average'] = round(assignment_avg, 2)
        else:
             course_data['assignment_average'] = None # Explicitly null if no data

        # Calculate Exam Average
        if course_data['exam_grades']:
            exam_avg = sum(course_data['exam_grades']) / len(course_data['exam_grades'])
            course_data['exam_average'] = round(exam_avg, 2)
        else:
            course_data['exam_average'] = None # Explicitly null if no data

        # Calculate Overall Grade (Weighted: 40% Assignments, 60% Exams)
        overall_grade = 0
        if course_data['assignment_average'] is not None and course_data['exam_average'] is not None:
             overall_grade = (assignment_avg * 0.4) + (exam_avg * 0.6)
        elif course_data['assignment_average'] is not None:
             overall_grade = assignment_avg # 100% assignments if no exams
        elif course_data['exam_average'] is not None:
             overall_grade = exam_avg # 100% exams if no assignments
        
        course_data['overall_grade'] = round(overall_grade, 2) if (course_data['assignment_average'] is not None or course_data['exam_average'] is not None) else 0

        # Convert units dict to list and calculate unit grades
        units_list = []
        for unit_data in course_data['units'].values():
            if unit_data['items']:
                unit_grades = [item['score'] for item in unit_data['items'] if item['score'] is not None]
                if unit_grades:
                    unit_data['unit_grade'] = sum(unit_grades) / len(unit_grades)
                else:
                    unit_data['unit_grade'] = 0
            else:
                unit_data['unit_grade'] = 0
            units_list.append(unit_data)

        course_data['units'] = units_list
        # Cleanup temporary lists
        del course_data['grades']
        del course_data['exam_grades']
        del course_data['assignment_grades']
        
        courses.append(course_data)

    return Response(courses)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def approved_teachers_for_student_view(request):
    """Get list of teachers for approved enrollments only."""
    
    if request.user.role != 'Student':
        return Response(
            {'error': 'Only students can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get approved enrollment requests for the student
    approved_enrollments = StudentEnrollmentRequest.objects.filter(
        student=request.user,
        status='approved'
    ).select_related('teacher')
    
    # Extract unique teachers and their courses
    teachers_dict = {}
    
    for enrollment in approved_enrollments:
        teacher_id = enrollment.teacher.id
        
        if teacher_id not in teachers_dict:
            teachers_dict[teacher_id] = {
                'id': teacher_id,
                'username': enrollment.teacher.username,
                'first_name': enrollment.teacher.first_name,
                'last_name': enrollment.teacher.last_name,
                'email': enrollment.teacher.email,
                'courses': []
            }
        
        # Add course info
        course_info = {
            'subject': enrollment.subject,
            'grade_level': enrollment.grade_level,
            'stream': enrollment.stream,
        }
        
        # Avoid duplicate courses
        if course_info not in teachers_dict[teacher_id]['courses']:
            teachers_dict[teacher_id]['courses'].append(course_info)
    
    teachers = list(teachers_dict.values())
    return Response(teachers)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_active_courses_view(request):
    """Get active approved courses for teacher (excluding ended courses)."""
    
    if request.user.role != 'Teacher':
        return Response(
            {'error': 'Only teachers can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get approved courses for teacher (excluding ended courses)
    approved_courses = TeacherCourseRequest.objects.filter(
        teacher=request.user,
        status='approved'
    ).values('subject', 'grade_level', 'stream').distinct()
    
    courses = list(approved_courses)
    return Response(courses)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_enrolled_students_view(request):
    """Get students enrolled in teacher's approved courses."""
    
    if request.user.role != 'Teacher':
        return Response(
            {'error': 'Only teachers can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get teacher's approved courses
    approved_courses = TeacherCourseRequest.objects.filter(
        teacher=request.user,
        status='approved'
    ).values_list('subject', 'grade_level', 'stream')
    
    # Get students enrolled in these courses
    enrolled_students = StudentEnrollmentRequest.objects.filter(
        status='approved',
        teacher=request.user
    ).select_related('student')
    
    # Use dictionary-based approach to avoid DISTINCT ON (not supported by SQLite)
    students_dict = {}
    
    for enrollment in enrolled_students:
        student_id = enrollment.student.id
        
        if student_id not in students_dict:
            students_dict[student_id] = {
                'id': student_id,
                'username': enrollment.student.username,
                'first_name': enrollment.student.first_name,
                'last_name': enrollment.student.last_name,
                'email': enrollment.student.email,
                'courses': []
            }
        
        # Add course info
        course_info = {
            'subject': enrollment.subject,
            'grade_level': enrollment.grade_level,
            'stream': enrollment.stream,
        }
        
        # Avoid duplicate courses
        if course_info not in students_dict[student_id]['courses']:
            students_dict[student_id]['courses'].append(course_info)
    
    students = list(students_dict.values())
    return Response(students)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_gradebook_view(request):
    """Get gradebook data for teacher with enrolled students and their grades."""
    
    if request.user.role != 'Teacher':
        return Response(
            {'error': 'Only teachers can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from communications.models import StudentAssignment
    
    # Get teacher's approved courses
    approved_courses = TeacherCourseRequest.objects.filter(
        teacher=request.user,
        status='approved'
    )
    
    # Get students enrolled in teacher's courses
    enrolled_students = StudentEnrollmentRequest.objects.filter(
        teacher=request.user,
        status='approved'
    ).select_related('student')
    
    # Build gradebook data
    gradebook_data = []
    
    for enrollment in enrolled_students:
        student = enrollment.student
        
        # Get assignments for this student in this course
        assignments = StudentAssignment.objects.filter(
            student=student,
            teacher=request.user,
            subject=enrollment.subject
        ).select_related('teacher')
        
        # Build student name with fallback
        first_name = student.first_name or ''
        last_name = student.last_name or ''
        student_name = f"{first_name} {last_name}".strip() or student.username
        
        student_entry = {
            'student_id': student.id,
            'student_name': student_name,
            'subject': enrollment.subject,
            'grade_level': enrollment.grade_level,
            'stream': enrollment.stream,
            'assignments': []
        }
        
        # Group assignments by type
        for assignment in assignments:
            student_entry['assignments'].append({
                'id': assignment.id,
                'topic': assignment.assignment_topic,
                'type': assignment.document_type,
                'score': assignment.grade if assignment.is_graded else None,
                'max_score': 100,
                'submitted_at': assignment.submitted_at.isoformat() if assignment.submitted_at else None,
                'is_graded': assignment.is_graded
            })
        
        gradebook_data.append(student_entry)
    
    return Response(gradebook_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_enrollment_requests_view(request):
    """Get all enrollment requests for admin review with statistics."""
    
    if request.user.role != 'Admin':
        return Response(
            {'error': 'Only admins can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get filter parameters
    status_filter = request.query_params.get('status', '')
    teacher_id = request.query_params.get('teacher_id', '')
    student_id = request.query_params.get('student_id', '')
    search_query = request.query_params.get('search', '')
    
    # Base queryset
    enrollments = StudentEnrollmentRequest.objects.select_related('student', 'teacher')
    
    # Apply filters
    if status_filter:
        enrollments = enrollments.filter(status=status_filter)
    if teacher_id:
        enrollments = enrollments.filter(teacher_id=teacher_id)
    if student_id:
        enrollments = enrollments.filter(student_id=student_id)
    if search_query:
        enrollments = enrollments.filter(
            Q(student__first_name__icontains=search_query) |
            Q(student__last_name__icontains=search_query) |
            Q(teacher__first_name__icontains=search_query) |
            Q(teacher__last_name__icontains=search_query) |
            Q(subject__icontains=search_query)
        )
    
    # Order by requested date descending
    enrollments = enrollments.order_by('-requested_at')
    
    # Build response data
    enrollment_data = []
    for enrollment in enrollments:
        enrollment_data.append({
            'id': enrollment.id,
            'student': {
                'id': enrollment.student.id,
                'first_name': enrollment.student.first_name,
                'last_name': enrollment.student.last_name,
                'email': enrollment.student.email,
                'username': enrollment.student.username
            },
            'teacher': {
                'id': enrollment.teacher.id,
                'first_name': enrollment.teacher.first_name,
                'last_name': enrollment.teacher.last_name,
                'email': enrollment.teacher.email,
                'username': enrollment.teacher.username
            },
            'subject': enrollment.subject,
            'grade_level': enrollment.grade_level,
            'stream': enrollment.stream,
            'status': enrollment.status,
            'review_notes': enrollment.review_notes,
            'created_at': enrollment.requested_at.isoformat(),
            'updated_at': enrollment.reviewed_at.isoformat() if enrollment.reviewed_at else None
        })
    
    # Get statistics
    total_requests = StudentEnrollmentRequest.objects.count()
    pending_requests = StudentEnrollmentRequest.objects.filter(status='pending').count()
    approved_requests = StudentEnrollmentRequest.objects.filter(status='approved').count()
    declined_requests = StudentEnrollmentRequest.objects.filter(status='declined').count()
    under_review_requests = StudentEnrollmentRequest.objects.filter(status='under_review').count()
    
    stats = {
        'total': total_requests,
        'pending': pending_requests,
        'approved': approved_requests,
        'declined': declined_requests,
        'under_review': under_review_requests
    }
    
    return Response({
        'enrollments': enrollment_data,
        'stats': stats,
        'count': len(enrollment_data)
    })


class StudentGradeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing student grades."""
    
    serializer_class = None  # Will be set dynamically
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'Teacher':
            return StudentGrade.objects.filter(graded_by=user)
        elif user.role == 'Student':
            return StudentGrade.objects.filter(student=user)
        elif user.role == 'Admin':
            return StudentGrade.objects.all()
        
        return StudentGrade.objects.none()
    
    def get_serializer_class(self):
        from .serializers import StudentGradeSerializer
        return StudentGradeSerializer
    
    def perform_create(self, serializer):
        """Save grade with current user as graded_by."""
        if serializer.is_valid():
            serializer.save(graded_by=self.request.user)
        else:
            raise DRFValidationError(serializer.errors)
    
    @action(detail=False, methods=['get'])
    def by_subject(self, request):
        """Get grades filtered by subject."""
        subject = request.query_params.get('subject')
        student_id = request.query_params.get('student_id')
        assignment_type = request.query_params.get('assignment_type')
        exam_type = request.query_params.get('exam_type')
        
        queryset = self.get_queryset()
        
        if subject:
            queryset = queryset.filter(subject=subject)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if assignment_type:
            queryset = queryset.filter(assignment_type=assignment_type)
        if exam_type:
            queryset = queryset.filter(exam_type=exam_type)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def calculate_overall(self, request):
        """Calculate overall grade for a student in a subject."""
        student_id = request.query_params.get('student_id')
        subject = request.query_params.get('subject')
        
        if not student_id or not subject:
            return Response(
                {'error': 'student_id and subject are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        grades = StudentGrade.objects.filter(
            student_id=student_id,
            subject=subject
        )
        
        if not grades.exists():
            return Response({
                'overall_grade': None,
                'assignment_average': None,
                'exam_average': None,
                'message': 'No grades found for this student in this subject'
            })
        
        # Separate assignment and exam grades
        assignment_grades = grades.filter(assignment_type__isnull=False)
        exam_grades = grades.filter(exam_type__isnull=False)
        
        # Calculate averages
        assignment_avg = None
        exam_avg = None
        
        if assignment_grades.exists():
            assignment_scores = [g.percentage for g in assignment_grades if g.percentage is not None]
            if assignment_scores:
                assignment_avg = sum(assignment_scores) / len(assignment_scores)
        
        if exam_grades.exists():
            exam_scores = [g.percentage for g in exam_grades if g.percentage is not None]
            if exam_scores:
                exam_avg = sum(exam_scores) / len(exam_scores)
        
        # Calculate overall grade (40% assignments, 60% exams)
        overall_grade = None
        if assignment_avg is not None and exam_avg is not None:
            overall_grade = (assignment_avg * 0.4) + (exam_avg * 0.6)
        elif assignment_avg is not None:
            overall_grade = assignment_avg
        elif exam_avg is not None:
            overall_grade = exam_avg
        
        return Response({
            'overall_grade': round(overall_grade, 2) if overall_grade else None,
            'assignment_average': round(assignment_avg, 2) if assignment_avg else None,
            'exam_average': round(exam_avg, 2) if exam_avg else None,
            'assignment_count': assignment_grades.count(),
            'exam_count': exam_grades.count()
        })
    
    @action(detail=False, methods=['get'])
    def aggregated(self, request):
        """Get aggregated grades for a student in a subject."""
        student_id = request.query_params.get('student_id')
        subject = request.query_params.get('subject')
        
        if not student_id or not subject:
            return Response(
                {'error': 'student_id and subject are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            aggregated_data = GradeAggregationService.get_aggregated_grades(int(student_id), subject)
            from .serializers import AggregatedGradeSerializer
            serializer = AggregatedGradeSerializer(aggregated_data)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get grade statistics."""
        teacher_id = request.query_params.get('teacher_id')
        
        try:
            stats = GradeAggregationService.get_grade_statistics(
                teacher_id=int(teacher_id) if teacher_id else None
            )
            from .serializers import GradeStatisticsSerializer
            serializer = GradeStatisticsSerializer(stats)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def performance_summary(self, request):
        """Get student performance summary."""
        student_id = request.query_params.get('student_id')
        
        if not student_id:
            return Response(
                {'error': 'student_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            summary = GradeAggregationService.get_student_performance_summary(int(student_id))
            from .serializers import StudentPerformanceSummarySerializer
            serializer = StudentPerformanceSummarySerializer(summary)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_gradebook_view(request):
    """Get student's complete gradebook with all grades organized by type."""
    
    if request.user.role != 'Student':
        return Response(
            {'error': 'Only students can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    subject = request.query_params.get('subject')
    
    grades = StudentGrade.objects.filter(student=request.user)
    
    if subject:
        grades = grades.filter(subject=subject)
    
    # Organize grades by subject + grade_level + stream (unique key)
    gradebook = {}
    
    for grade in grades:
        # Create unique key including grade_level and stream
        unique_key = f"{grade.subject}_{grade.grade_level}_{grade.stream or ''}"
        
        if unique_key not in gradebook:
            gradebook[unique_key] = {
                'subject': grade.subject,
                'grade_level': grade.grade_level,
                'stream': grade.stream,
                'assignments': {},
                'exams': {},
                'overall_grade': None
            }
        
        if grade.assignment_type:
            if grade.assignment_type not in gradebook[unique_key]['assignments']:
                gradebook[unique_key]['assignments'][grade.assignment_type] = []
            gradebook[unique_key]['assignments'][grade.assignment_type].append({
                'id': grade.id,
                'score': grade.score,
                'max_score': grade.max_score,
                'percentage': grade.percentage,
                'feedback': grade.feedback,
                'graded_at': grade.graded_at.isoformat() if grade.graded_at else None
            })
        
        if grade.exam_type:
            if grade.exam_type not in gradebook[unique_key]['exams']:
                gradebook[unique_key]['exams'][grade.exam_type] = []
            gradebook[unique_key]['exams'][grade.exam_type].append({
                'id': grade.id,
                'score': grade.score,
                'max_score': grade.max_score,
                'percentage': grade.percentage,
                'feedback': grade.feedback,
                'graded_at': grade.graded_at.isoformat() if grade.graded_at else None
            })
    
    # Calculate overall grades for each unique subject-grade-stream combination
    for unique_key, subject_data in gradebook.items():
        all_grades = StudentGrade.objects.filter(
            student=request.user,
            subject=subject_data['subject'],
            grade_level=subject_data['grade_level'],
            stream=subject_data['stream']
        )
        
        assignment_grades = all_grades.filter(assignment_type__isnull=False)
        exam_grades = all_grades.filter(exam_type__isnull=False)
        
        assignment_avg = None
        exam_avg = None
        
        if assignment_grades.exists():
            assignment_scores = [g.percentage for g in assignment_grades if g.percentage is not None]
            if assignment_scores:
                assignment_avg = sum(assignment_scores) / len(assignment_scores)
        
        if exam_grades.exists():
            exam_scores = [g.percentage for g in exam_grades if g.percentage is not None]
            if exam_scores:
                exam_avg = sum(exam_scores) / len(exam_scores)
        
        overall_grade = None
        if assignment_avg is not None and exam_avg is not None:
            overall_grade = (assignment_avg * 0.4) + (exam_avg * 0.6)
        elif assignment_avg is not None:
            overall_grade = assignment_avg
        elif exam_avg is not None:
            overall_grade = exam_avg
        
        subject_data['overall_grade'] = round(overall_grade, 2) if overall_grade else None
        subject_data['assignment_average'] = round(assignment_avg, 2) if assignment_avg else None
        subject_data['exam_average'] = round(exam_avg, 2) if exam_avg else None
    
    return Response(list(gradebook.values()))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_enrolled_subjects(request):
    """Get all subjects where teacher has enrolled students with grade statistics"""
    if request.user.role != 'Teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        subjects = TeacherSubjectGradesService.get_teacher_enrolled_subjects(request.user.id)
        return Response(subjects)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subject_students_with_grades(request, subject_id):
    """Get all students in subject with their existing grades"""
    if request.user.role != 'Teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        data = TeacherSubjectGradesService.get_subject_students_with_grades(request.user.id, subject_id)
        if not data:
            return Response({'error': 'Subject not found or not authorized'}, status=status.HTTP_404_NOT_FOUND)
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subject_grade_summary(request, subject_id):
    """Get grade statistics for a subject"""
    if request.user.role != 'Teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        summary = TeacherSubjectGradesService.get_subject_grade_summary(request.user.id, subject_id)
        if not summary:
            return Response({'error': 'Subject not found or not authorized'}, status=status.HTTP_404_NOT_FOUND)
        return Response(summary)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_grade_entry(request):
    """Bulk create grades for multiple students"""
    if request.user.role != 'Teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        grades_data = request.data.get('grades', [])
        if not grades_data:
            return Response({'error': 'No grades provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        result = TeacherSubjectGradesService.bulk_create_grades(request.user.id, grades_data)
        
        # Invalidate cache
        if result['created'] > 0:
            subject = grades_data[0].get('subject')
            if subject:
                TeacherSubjectGradesService.invalidate_subject_cache(request.user.id)
            
            # Generate Smart Alerts for Bulk Entry
            try:
                from alerts.alert_generator import AlertGenerator
                from users.models import User
                
                # Process alerts asynchronously or just catch errors to not block response
                for grade_item in grades_data:
                    student_id = grade_item.get('student_id')
                    subject = grade_item.get('subject')
                    
                    if student_id and subject:
                        try:
                            student = User.objects.get(id=student_id)
                            
                            # Fetch recent grades for this subject
                            recent_grades = StudentGrade.objects.filter(
                                student_id=student_id,
                                subject=subject
                            ).order_by('-created_at')[:5]
                            
                            scores = [g.percentage for g in recent_grades if g.percentage is not None]
                            
                            if scores:
                                AlertGenerator.generate_alert_from_performance(
                                    student=student,
                                    subject=subject,
                                    recent_scores=scores
                                )
                        except Exception as inner_e:
                            # Log but continue for other students
                            logger.warning(f"Failed to generate alert for student {student_id} in bulk entry: {inner_e}")
                            
            except Exception as e:
                logger.error(f"Failed to generate bulk performance alerts: {e}")
        
        return Response(result, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subject_assignments_exams(request, subject_id):
    """Get all assignments and exams for a subject"""
    if request.user.role != 'Teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Verify teacher owns the subject
        course = Course.objects.get(id=subject_id, teacher_id=request.user.id)
        
        # Get all assignments and exams for this subject
        assignments = Assignment.objects.filter(
            course_id=subject_id
        ).values('id', 'title', 'assignment_type', 'created_at').order_by('-created_at')
        
        exams = Exam.objects.filter(
            course_id=subject_id
        ).values('id', 'title', 'exam_type', 'created_at').order_by('-created_at')
        
        result = {
            'assignments': list(assignments),
            'exams': list(exams)
        }
        
        return Response(result)
    except Course.DoesNotExist:
        return Response({'error': 'Subject not found or access denied'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_enrolled_subjects_with_students(request):
    """Get all subjects with enrolled students including student details"""
    if request.user.role != 'Teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from .services_grade_entry_enhanced import EnhancedTeacherSubjectGradesService
        subjects = EnhancedTeacherSubjectGradesService.get_teacher_enrolled_subjects_with_students(request.user.id)
        return Response(subjects)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subject_students_for_grading(request, subject_id):
    """Get all students in a subject for grading"""
    if request.user.role != 'Teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from .services_grade_entry_enhanced import EnhancedTeacherSubjectGradesService
        data = EnhancedTeacherSubjectGradesService.get_subject_students_for_grading(request.user.id, subject_id)
        if not data:
            return Response({'error': 'Subject not found or not authorized'}, status=status.HTTP_404_NOT_FOUND)
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_grades_for_subject(request, student_id):
    """Get all grades for a student"""
    if request.user.role != 'Teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        subject = request.query_params.get('subject', '')
        from .services_grade_entry_enhanced import EnhancedTeacherSubjectGradesService
        grades = EnhancedTeacherSubjectGradesService.get_student_grades_for_subject(
            request.user.id, student_id, subject
        )
        return Response({
            'student_id': student_id,
            'subject': subject,
            'grades': grades
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_student_grade(request):
    """Save or update a student grade"""
    if request.user.role != 'Teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from .services_grade_entry_enhanced import EnhancedTeacherSubjectGradesService
        result = EnhancedTeacherSubjectGradesService.save_student_grade(request.user.id, request.data)
        
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        # Invalidate cache on success
        if result.get('success'):
            subject = request.data.get('subject')
            EnhancedTeacherSubjectGradesService.invalidate_cache(request.user.id)
            
            # Generate Smart Alert for Performance
            try:
                from alerts.alert_generator import AlertGenerator
                from users.models import User
                
                student_id = request.data.get('student_id')
                # subject is already retrieved above
                
                if student_id and subject:
                    student = User.objects.get(id=student_id)
                    
                    # Fetch recent grades for this subject to analyze trend
                    recent_grades = StudentGrade.objects.filter(
                        student_id=student_id,
                        subject=subject
                    ).order_by('-created_at')[:5] # Analyze last 5 grades
                    
                    scores = [g.percentage for g in recent_grades if g.percentage is not None]
                    
                    if scores:
                        AlertGenerator.generate_alert_from_performance(
                            student=student,
                            subject=subject,
                            recent_scores=scores
                        )
            except Exception as e:
                logger.error(f"Failed to generate performance alert: {e}")
        
        return Response(result, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def grade_statistics_for_subject(request, subject_name):
    """Get grade statistics for a subject"""
    if request.user.role != 'Teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from .services_grade_entry_enhanced import EnhancedTeacherSubjectGradesService
        stats = EnhancedTeacherSubjectGradesService.get_grade_statistics_for_subject(request.user.id, subject_name)
        return Response(stats)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def student_enrolled_subjects_view(request):
    """Get subjects enrolled by the student's family."""
    if request.user.role != 'Student':
        return Response(
            {'error': 'Only students can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )

    from users.models import FamilyMembership

    # Get all families the student is part of
    family_ids = FamilyMembership.objects.filter(
        user=request.user,
        is_active=True
    ).values_list('family_id', flat=True)

    if not family_ids:
        return Response({
            'message': 'No families found for this student',
            'families': []
        })

    # Get all approved enrollment requests for these families
    enrollments = StudentEnrollmentRequest.objects.filter(
        family_id__in=family_ids,
        status='approved'
    ).select_related('student', 'teacher', 'family')

    # Group by family and student
    result = {}
    for enrollment in enrollments:
        family_key = f"family_{enrollment.family.id}"
        if family_key not in result:
            result[family_key] = {
                'family_id': enrollment.family.id,
                'family_name': enrollment.family.name,
                'students': {}
            }

        student_key = f"student_{enrollment.student.id}"
        if student_key not in result[family_key]['students']:
            # Build student name with fallbacks
            first_name = enrollment.student.first_name
            last_name = enrollment.student.last_name
            username = enrollment.student.username

            if first_name and last_name:
                student_name = f"{first_name} {last_name}"
            elif first_name:
                student_name = first_name
            elif last_name:
                student_name = last_name
            else:
                student_name = username or 'Unknown Student'

            result[family_key]['students'][student_key] = {
                'student_id': enrollment.student.id,
                'student_name': student_name,
                'subjects': []
            }

        result[family_key]['students'][student_key]['subjects'].append({
            'id': enrollment.id,
            'subject': enrollment.subject,
            'grade_level': enrollment.grade_level,
            'stream': enrollment.stream,
            'teacher': {
                'id': enrollment.teacher.id,
                'first_name': enrollment.teacher.first_name,
                'last_name': enrollment.teacher.last_name,
                'username': enrollment.teacher.username
            },
            'enrolled_date': enrollment.requested_at
        })

    # Convert to list format
    families_list = []
    for family_data in result.values():
        students_list = []
        for student_data in family_data['students'].values():
            students_list.append(student_data)
        family_data['students'] = students_list
        families_list.append(family_data)

    return Response({
        'families': families_list
    })


@api_view(['GET'])
def student_family_grades_view(request):
    """Get grades for students in the student's family with proper deduplication."""
    if request.user.role != 'Student':
        return Response(
            {'error': 'Only students can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )

    from users.models import FamilyMembership, Family

    # Get all families the student is part of
    family_ids = FamilyMembership.objects.filter(
        user=request.user,
        is_active=True
    ).values_list('family_id', flat=True)

    if not family_ids:
        return Response({
            'message': 'No families found for this student',
            'courses': []
        })

    # Get family objects for metadata
    families_map = {}
    for family in Family.objects.filter(id__in=family_ids):
        families_map[family.id] = family.name

    # Get all students in these families
    family_students_data = FamilyMembership.objects.filter(
        family_id__in=family_ids,
        role='Student',
        is_active=True
    ).select_related('user', 'family').values_list('user_id', 'family_id')

    # Build student to family mapping
    student_to_family = {}
    for student_id, family_id in family_students_data:
        student_to_family[student_id] = family_id

    # Get approved courses with grades for these students
    # Use a dictionary to deduplicate by unique key
    courses_map = {}

    for student_id, family_id in family_students_data:
        # Get unique combinations of subject, grade_level, stream for this student
        # Use values() without distinct since SQLite doesn't support DISTINCT ON
        student_courses_raw = StudentGrade.objects.filter(
            student_id=student_id
        ).select_related('student').values(
            'student__first_name', 'student__last_name', 'student__username',
            'subject', 'grade_level', 'stream'
        )
        
        # Deduplicate in Python (SQLite compatible)
        seen_combinations = set()
        student_courses = []
        for course in student_courses_raw:
            combo_key = (course['subject'], course['grade_level'], course['stream'])
            if combo_key not in seen_combinations:
                seen_combinations.add(combo_key)
                student_courses.append(course)

        for course_data in student_courses:
            # Create unique key to prevent duplicates
            unique_key = f"{student_id}_{course_data['subject']}_{course_data['grade_level']}_{course_data['stream'] or 'no-stream'}"

            # Skip if already processed
            if unique_key in courses_map:
                continue

            # Calculate overall grade for this subject
            grades = StudentGrade.objects.filter(
                student_id=student_id,
                subject=course_data['subject'],
                grade_level=course_data['grade_level'],
                stream=course_data['stream']
            )

            assignment_grades = grades.filter(assignment_type__isnull=False)
            exam_grades = grades.filter(exam_type__isnull=False)

            assignment_avg = None
            exam_avg = None

            if assignment_grades.exists():
                assignment_scores = [g.percentage for g in assignment_grades if g.percentage is not None]
                if assignment_scores:
                    assignment_avg = sum(assignment_scores) / len(assignment_scores)

            if exam_grades.exists():
                exam_scores = [g.percentage for g in exam_grades if g.percentage is not None]
                if exam_scores:
                    exam_avg = sum(exam_scores) / len(exam_scores)

            overall_grade = None
            if assignment_avg is not None and exam_avg is not None:
                overall_grade = (assignment_avg * 0.4) + (exam_avg * 0.6)
            elif assignment_avg is not None:
                overall_grade = assignment_avg
            elif exam_avg is not None:
                overall_grade = exam_avg

            # Build student name with fallbacks
            first_name = course_data['student__first_name']
            last_name = course_data['student__last_name']
            username = course_data['student__username']

            if first_name and last_name:
                student_name = f"{first_name} {last_name}"
            elif first_name:
                student_name = first_name
            elif last_name:
                student_name = last_name
            else:
                student_name = username or 'Unknown Student'

            courses_map[unique_key] = {
                'id': unique_key,
                'title': f"{course_data['subject']} - {course_data['grade_level']} - {student_name}",
                'subject': course_data['subject'],
                'grade_level': course_data['grade_level'],
                'stream': course_data['stream'],
                'student_name': student_name,
                'student_id': student_id,
                'family_id': family_id,
                'family_name': families_map.get(family_id, 'Unknown Family'),
                'overall_grade': round(overall_grade, 2) if overall_grade else None,
                'assignment_average': round(assignment_avg, 2) if assignment_avg else None,
                'exam_average': round(exam_avg, 2) if exam_avg else None
            }

    courses = list(courses_map.values())

    return Response({
        'courses': courses,
        'families': [{'id': fid, 'name': fname} for fid, fname in families_map.items()]
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def filter_courses_by_family(request):
    """Filter courses/grades by family for students."""
    if request.user.role != 'Student':
        return Response(
            {'error': 'Only students can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )

    family_id = request.query_params.get('family_id')
    if not family_id:
        return Response(
            {'error': 'family_id query parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    from users.models import FamilyMembership

    try:
        family_id = int(family_id)
        
        # Verify the student is part of the family
        family_membership = FamilyMembership.objects.filter(
            family_id=family_id,
            user=request.user,
            is_active=True
        ).first()


        if not family_membership:
            return Response(
                {'error': 'Access denied to this family'},
                status=status.HTTP_403_FORBIDDEN
            )
    except Exception as e:
        return Response(
            {'error': 'Invalid family_id'},
            status=status.HTTP_400_BAD_REQUEST
        )
        # Get all students in the family
        family_students = FamilyMembership.objects.filter(
            family_id=family_id,
            role='Student',
            is_active=True
        ).select_related('user').values_list('user', flat=True)

        # Get grades for these students
        courses = []
        for student_id in family_students:
            student_courses = StudentGrade.objects.filter(
                student_id=student_id
            ).select_related('student').values(
                'student__first_name', 'student__last_name',
                'subject', 'grade_level', 'stream'
            ).distinct()

            for course_data in student_courses:
                # Calculate overall grade
                grades = StudentGrade.objects.filter(
                    student_id=student_id,
                    subject=course_data['subject']
                )

                assignment_grades = grades.filter(assignment_type__isnull=False)
                exam_grades = grades.filter(exam_type__isnull=False)

                assignment_avg = None
                exam_avg = None

                if assignment_grades.exists():
                    assignment_scores = [g.percentage for g in assignment_grades if g.percentage is not None]
                    if assignment_scores:
                        assignment_avg = sum(assignment_scores) / len(assignment_scores)

                if exam_grades.exists():
                    exam_scores = [g.percentage for g in exam_grades if g.percentage is not None]
                    if exam_scores:
                        exam_avg = sum(exam_scores) / len(exam_scores)

                overall_grade = None
                if assignment_avg is not None and exam_avg is not None:
                    overall_grade = (assignment_avg * 0.4) + (exam_avg * 0.6)
                elif assignment_avg is not None:
                    overall_grade = assignment_avg
                elif exam_avg is not None:
                    overall_grade = exam_avg

                courses.append({
                    'id': f"{course_data['subject']}_{student_id}",
                    'title': f"{course_data['subject']} - Grade {course_data['grade_level']}",
                    'subject': course_data['subject'],
                    'grade_level': course_data['grade_level'],
                    'stream': course_data['stream'],
                    'student_name': f"{(course_data['student__first_name'] or 'Unknown')} {(course_data['student__last_name'] or 'Student')}",
                    'overall_grade': round(overall_grade, 2) if overall_grade else None,
                    'assignment_average': round(assignment_avg, 2) if assignment_avg else None,
                    'exam_average': round(exam_avg, 2) if exam_avg else None
                })

        return Response({'courses': courses})

    except ValueError:
        return Response(
            {'error': 'Invalid family_id'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subject_teacher_info_view(request):
    """Get teacher info for a specific subject-grade-stream combination."""
    
    if request.user.role != 'Student':
        return Response(
            {'error': 'Only students can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    subject = request.query_params.get('subject')
    grade_level = request.query_params.get('grade_level')
    stream = request.query_params.get('stream', '')
    
    if not subject or not grade_level:
        return Response(
            {'error': 'subject and grade_level parameters required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Try to find a teacher for this subject-grade-stream combination
    # First check approved enrollments
    enrollment = StudentEnrollmentRequest.objects.filter(
        student=request.user,
        subject=subject,
        grade_level=grade_level,
        stream=stream or None,
        status='approved'
    ).select_related('teacher').first()
    
    if enrollment:
        return Response({
            'teacher': {
                'id': enrollment.teacher.id,
                'username': enrollment.teacher.username,
                'first_name': enrollment.teacher.first_name,
                'last_name': enrollment.teacher.last_name,
                'email': enrollment.teacher.email,
            }
        })
    
    # If no approved enrollment, try to find any teacher teaching this subject
    # by looking at other students' enrollments
    other_enrollment = StudentEnrollmentRequest.objects.filter(
        subject=subject,
        grade_level=grade_level,
        stream=stream or None,
        status='approved'
    ).select_related('teacher').first()
    
    if other_enrollment:
        return Response({
            'teacher': {
                'id': other_enrollment.teacher.id,
                'username': other_enrollment.teacher.username,
                'first_name': other_enrollment.teacher.first_name,
                'last_name': other_enrollment.teacher.last_name,
                'email': other_enrollment.teacher.email,
            }
        })
    
    # No teacher found
    return Response({
        'teacher': None
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_enrolled_subjects_analytics_view(request):
    """Get enriched enrolled subjects data with grades and analytics for parent."""
    if request.user.role != 'Parent':
        return Response(
            {'error': 'Only parents can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )

    from users.models import FamilyMembership, User
    from datetime import datetime, timedelta
    from django.db.models import Avg, Q

    # Get all families the parent is part of
    family_memberships = FamilyMembership.objects.filter(
        user=request.user,
        role='Parent',
        is_active=True
    ).select_related('family')
    
    family_ids = [fm.family.id for fm in family_memberships]

    # Get all students that belong to these families or are direct children
    # 1. Students in families
    family_student_ids = FamilyMembership.objects.filter(
        family_id__in=family_ids,
        role='Student',
        is_active=True
    ).values_list('user__id', flat=True)

    # 2. Get enrollments for these students OR direct children of the parent
    enrollments = StudentEnrollmentRequest.objects.filter(
        Q(student__id__in=family_student_ids) | Q(student__parent=request.user),
        status='approved'
    ).select_related('student', 'teacher', 'family').distinct()

    # Apply filters
    grade_level_filter = request.query_params.get('grade_level')
    subject_filter = request.query_params.get('subject')
    status_filter = request.query_params.get('status')
    days_back = request.query_params.get('days_back')
    performance_level_filter = request.query_params.get('performance_level')

    if grade_level_filter:
        enrollments = enrollments.filter(grade_level=grade_level_filter)
    if subject_filter:
        enrollments = enrollments.filter(subject__icontains=subject_filter)
    if status_filter:
        enrollments = enrollments.filter(status=status_filter)
    if days_back:
        try:
            cutoff_date = datetime.now() - timedelta(days=int(days_back))
            enrollments = enrollments.filter(created_at__gte=cutoff_date)
        except (ValueError, TypeError):
            pass

    families_data = {}
    all_grades = []
    total_subjects_count = 0

    # Initialize families data structure first to ensure all families are present even if empty
    for fm in family_memberships:
        if fm.family.id not in families_data:
             families_data[fm.family.id] = {
                'family_id': fm.family.id,
                'family_name': fm.family.name,
                'students': {}
            }
            
    # Also initialize "Direct Enrollments" bucket if needed (we'll create it on demand usually, but let's be consistent)
    # Actually, iterate through enrollments now.

    for enrollment in enrollments:
        # Determine which family bucket this enrollment belongs to.
        # Ideally, we find which family the STUDENT belongs to relative to this PARENT.
        # A student might be in multiple families, but we should prioritize the one this parent is viewing?
        # Or just put them in the family they are linked to.
        
        # Logic: 
        # 1. If enrollment has a family_id, use it (if parent matches).
        # 2. If not, check which family the student shares with the parent.
        # 3. Fallback to Direct.
        
        target_family_id = 0
        target_family_name = "Direct Enrollments"
        
        if enrollment.family and enrollment.family.id in family_ids:
            target_family_id = enrollment.family.id
            target_family_name = enrollment.family.name
        else:
            # Try to find a family link
            # We already have family_ids. Check if student is in any of them.
            # This is a bit N+1 but we can optimize if needed. For now correctness > speed.
            # actually we can infer from the family_student_ids query if we structured it differently, 
            # but let's query purely for the match.
            member_family = FamilyMembership.objects.filter(
                user_id=enrollment.student.id,
                family_id__in=family_ids,
                role='Student',
                is_active=True
            ).first()
            
            if member_family:
                target_family_id = member_family.family.id
                target_family_name = member_family.family.name

        if target_family_id not in families_data:
            families_data[target_family_id] = {
                'family_id': target_family_id,
                'family_name': target_family_name,
                'students': {}
            }

        student = enrollment.student
        student_id = student.id
        student_name = f"{student.first_name} {student.last_name}" if student.first_name else student.username

        if student_id not in families_data[target_family_id]['students']:
            families_data[target_family_id]['students'][student_id] = {
                'student_id': student_id,
                'student_name': student_name,
                'subjects': [],
                'seen_subjects': set() # Helper set for deduplication
            }

        # Deduplication Check
        # Key: SubjectName_GradeLevel_Stream_EnrollmentID
        # We must allow multiple enrollments for the same subject if they are distinct (e.g. different teachers)
        subject_key = f"{enrollment.subject}_{enrollment.grade_level}_{enrollment.stream or ''}_{enrollment.id}"
        
        if subject_key in families_data[target_family_id]['students'][student_id]['seen_subjects']:
            continue # Skip duplicate
            
        families_data[target_family_id]['students'][student_id]['seen_subjects'].add(subject_key)

        # Get grades for this subject
        grades = StudentGrade.objects.filter(
            student_id=student_id,
            subject=enrollment.subject
        ).order_by('created_at') # Order by date for trend calculation

        assignment_grades = grades.filter(assignment_type__isnull=False)
        exam_grades = grades.filter(exam_type__isnull=False)

        assignment_avg = None
        exam_avg = None
        overall_grade = None

        if assignment_grades.exists():
            assignment_scores = [g.percentage for g in assignment_grades if g.percentage is not None]
            if assignment_scores:
                assignment_avg = sum(assignment_scores) / len(assignment_scores)

        if exam_grades.exists():
            exam_scores = [g.percentage for g in exam_grades if g.percentage is not None]
            if exam_scores:
                exam_avg = sum(exam_scores) / len(exam_scores)

        if assignment_avg is not None and exam_avg is not None:
            overall_grade = (assignment_avg * 0.4) + (exam_avg * 0.6)
        elif assignment_avg is not None:
            overall_grade = assignment_avg
        elif exam_avg is not None:
            overall_grade = exam_avg

        # Determine performance level
        perf_level = 'no_grade'
        if overall_grade is not None:
            if overall_grade >= 90:
                perf_level = 'excellent'
            elif overall_grade >= 80:
                perf_level = 'good'
            elif overall_grade >= 70:
                perf_level = 'average'
            elif overall_grade >= 60:
                perf_level = 'below_average'
            else:
                perf_level = 'needs_improvement'
            
            all_grades.append(overall_grade)

        # Filter by performance level if requested
        if performance_level_filter and perf_level != performance_level_filter:
            continue

        # Determine trend based on actual history
        trend = 'stable'
        trend_value = 0
        scores = [g.percentage for g in grades if g.percentage is not None]
        
        if len(scores) >= 2:
            # Compare average of last 3 (or fewer) vs previous
            recent_count = min(3, len(scores) // 2 + 1)
            recent_scores = scores[-recent_count:]
            previous_scores = scores[:-recent_count]
            
            if previous_scores:
                recent_avg = sum(recent_scores) / len(recent_scores)
                previous_avg = sum(previous_scores) / len(previous_scores)
                
                diff = recent_avg - previous_avg
                trend_value = round(abs(diff), 1)

                if diff > 2: # 2% threshold
                    trend = 'improving'
                elif diff < -2:
                    trend = 'declining'
                else:
                    trend = 'stable'
            else:
                 # Fallback if not enough previous history but have at least 2 scores
                 diff = scores[-1] - scores[0]
                 trend_value = round(abs(diff), 1)
                 if diff > 2:
                     trend = 'improving'
                 elif diff < -2:
                     trend = 'declining'
        
        subject_data = {
            'id': enrollment.id,
            'subject': enrollment.subject,
            'grade_level': enrollment.grade_level,
            'stream': enrollment.stream,
            'teacher': {
                'id': enrollment.teacher.id,
                'first_name': enrollment.teacher.first_name,
                'last_name': enrollment.teacher.last_name,
                'username': enrollment.teacher.username,
                'full_name': enrollment.teacher.get_full_name()
            },
            'enrolled_date': enrollment.requested_at,
            'status': enrollment.status,
            'assignment_average': round(assignment_avg, 1) if assignment_avg is not None else None,
            'exam_average': round(exam_avg, 1) if exam_avg is not None else None,
            'overall_grade': round(overall_grade, 1) if overall_grade is not None else None,
            'performance_level': perf_level,
            'total_grades': grades.count(),
            'trend': trend,
            'trend_value': trend_value
        }

        families_data[target_family_id]['students'][student_id]['subjects'].append(subject_data)
        total_subjects_count += 1

    # Format response
    formatted_families = []
    for family_data in families_data.values():
        students_list = []
        for student_data in family_data['students'].values():
            if 'seen_subjects' in student_data:
                del student_data['seen_subjects']

            if student_data['subjects']: # Only include students with subjects (after filtering)
                students_list.append(student_data)
        
        if students_list:
            family_data['students'] = students_list
            family_data['total_students'] = len(students_list)
            formatted_families.append(family_data)

    # Calculate summary
    average_performance = sum(all_grades) / len(all_grades) if all_grades else None

    return Response({
        'families': formatted_families,
        'summary': {
            'total_subjects': total_subjects_count,
            'active_subjects': total_subjects_count, # Assuming all approved are active
            'average_performance': average_performance,
            'filters_applied': {
                'grade_level': grade_level_filter,
                'subject': subject_filter,
                'status': status_filter,
                'days_back': days_back,
                'performance_level': performance_level_filter
            }
        }
    })



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_academic_analytics_view(request):
    """Get comprehensive academic analytics for parent's children."""
    if request.user.role != 'Parent':
        return Response(
            {'error': 'Only parents can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )

    from users.models import FamilyMembership
    from datetime import datetime, timedelta
    from django.db.models import Avg, Count, Q

    # Get all children of this parent
    children = request.user.children.filter(is_active=True)
    
    if not children.exists():
        return Response({
            'analytics': [],
            'summary': {
                'total_children': 0,
                'total_subjects': 0,
                'average_performance': None,
                'performance_alerts': []
            }
        })

    # Get query parameters for filtering
    min_score = request.query_params.get('min_score')
    max_score = request.query_params.get('max_score')
    days_back = request.query_params.get('days_back')
    performance_level = request.query_params.get('performance_level')
    subject_filter = request.query_params.get('subject')

    # Build filter criteria
    filters = Q()
    
    if min_score:
        try:
            filters &= Q(overall_score__gte=float(min_score))
        except (ValueError, TypeError):
            pass
    
    if max_score:
        try:
            filters &= Q(overall_score__lte=float(max_score))
        except (ValueError, TypeError):
            pass
    
    if days_back:
        try:
            cutoff_date = datetime.now() - timedelta(days=int(days_back))
            filters &= Q(created_at__gte=cutoff_date)
        except (ValueError, TypeError):
            pass
    
    if performance_level:
        if performance_level == 'excellent':
            filters &= Q(overall_score__gte=90)
        elif performance_level == 'good':
            filters &= Q(overall_score__gte=80, overall_score__lt=90)
        elif performance_level == 'average':
            filters &= Q(overall_score__gte=70, overall_score__lt=80)
        elif performance_level == 'below_average':
            filters &= Q(overall_score__gte=60, overall_score__lt=70)
        elif performance_level == 'needs_improvement':
            filters &= Q(overall_score__lt=60)
    
    if subject_filter:
        filters &= Q(subject__icontains=subject_filter)

    # Collect analytics for each child
    analytics_list = []
    all_grades = []
    performance_alerts = []

    for child in children:
        # Get all grades for this child
        child_grades = StudentGrade.objects.filter(
            student=child
        ).select_related('student', 'teacher').apply_filters(filters) if hasattr(StudentGrade.objects, 'apply_filters') else StudentGrade.objects.filter(
            student=child
        ).filter(filters)

        if not child_grades.exists():
            continue

        # Group by subject
        subject_map = {}
        for grade in child_grades:
            if grade.subject not in subject_map:
                subject_map[grade.subject] = []
            subject_map[grade.subject].append(grade)

        # Calculate analytics per subject
        subject_analytics = []
        for subject, grades in subject_map.items():
            scores = [g.percentage for g in grades if g.percentage is not None]
            if not scores:
                continue

            avg_score = sum(scores) / len(scores)
            latest_score = scores[-1] if scores else None
            
            # Calculate trend (compare first half vs second half)
            mid_point = len(scores) // 2
            if mid_point > 0:
                first_half_avg = sum(scores[:mid_point]) / mid_point
                second_half_avg = sum(scores[mid_point:]) / len(scores[mid_point:])
                
                if second_half_avg > first_half_avg + 5:
                    trend = 'improving'
                    trend_value = round(((second_half_avg - first_half_avg) / first_half_avg * 100), 2)
                elif second_half_avg < first_half_avg - 5:
                    trend = 'declining'
                    trend_value = round(((first_half_avg - second_half_avg) / first_half_avg * 100), 2)
                else:
                    trend = 'stable'
                    trend_value = 0
            else:
                trend = 'stable'
                trend_value = 0

            # Determine performance level
            if avg_score >= 90:
                performance = 'excellent'
            elif avg_score >= 80:
                performance = 'good'
            elif avg_score >= 70:
                performance = 'average'
            elif avg_score >= 60:
                performance = 'below_average'
            else:
                performance = 'needs_improvement'

            # Add alert if performance is low
            if avg_score < 60:
                performance_alerts.append({
                    'type': 'low_grade',
                    'student_name': child.first_name or child.username,
                    'subject': subject,
                    'score': round(avg_score, 2),
                    'severity': 'high' if avg_score < 50 else 'medium'
                })
            elif trend == 'declining' and trend_value > 10:
                performance_alerts.append({
                    'type': 'declining_trend',
                    'student_name': child.first_name or child.username,
                    'subject': subject,
                    'decline_percentage': trend_value,
                    'severity': 'medium'
                })

            subject_analytics.append({
                'subject': subject,
                'average_score': round(avg_score, 2),
                'latest_score': round(latest_score, 2) if latest_score else None,
                'total_grades': len(scores),
                'trend': trend,
                'trend_value': trend_value,
                'performance_level': performance,
                'min_score': round(min(scores), 2),
                'max_score': round(max(scores), 2)
            })
    
    return Response({
        'analytics': analytics_list,
        'summary': {
            'total_children': children.count(),
            'total_subjects': len(analytics_list),
            'average_performance': round(sum([a['average_score'] for a in analytics_list]) / len(analytics_list), 2) if analytics_list else 0,
            'performance_alerts': performance_alerts
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_grades_history_view(request):
    """Get grade history for a student and subject."""
    if request.user.role != 'Parent':
        return Response({'error': 'Forbidden'}, status=403)
        
    student_id = request.query_params.get('student_id')
    subject = request.query_params.get('subject')
    
    if not student_id or not subject:
        return Response({'error': 'Missing parameters'}, status=400)
        
    # Verify parent-child relationship
    is_child = request.user.children.filter(id=student_id).exists()
    
    if not is_child:
        # Check family relationship
        from users.models import FamilyMembership
        # Get families where request.user is a Parent
        parent_families = FamilyMembership.objects.filter(
            user=request.user, 
            role='Parent',
            is_active=True
        ).values_list('family', flat=True)
        
        # Check if student is in any of these families
        is_family_member = FamilyMembership.objects.filter(
            user_id=student_id,
            family__in=parent_families,
            role='Student',
            is_active=True
        ).exists()
        
        if not is_family_member:
             return Response({'error': 'Student not found'}, status=404)
        
    grades = StudentGrade.objects.filter(
        student_id=student_id,
        subject=subject
    ).order_by('created_at')
    
    data = []
    for g in grades:
        data.append({
            'id': g.id,
            'date': g.created_at.isoformat(),
            'score': g.score,
            'max_score': g.max_score,
            'percentage': g.percentage,
            'type': g.assignment_type or g.exam_type or 'Other',
            'category': g.category,
            'feedback': g.feedback
        })
        
    return Response(data)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def assignment_types_view(request):
    """Get all available assignment types."""
    return Response([{'value': t[0], 'label': t[1]} for t in Assignment.DOCUMENT_TYPES])

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_student_assignment_topics_view(request):
    """Get unique assignment topics from student assignments for the teacher."""
    from rest_framework import status
    if request.user.role != 'Teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    from communications.models import StudentAssignment
    
    # Group by topic and type
    topics = StudentAssignment.objects.filter(teacher=request.user).values('assignment_topic', 'document_type').distinct()
    
    # Format as "assignments"
    data = []
    for t in topics:
        data.append({
            'id': f"sa_{t['assignment_topic']}", # distinct ID prefix
            'title': t['assignment_topic'],
            'document_type': t['document_type'],
            'is_student_assignment': True
        })
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_student_assignment_submissions_view(request):
    """Get submissions for a specific student assignment topic."""
    from rest_framework import status
    if request.user.role != 'Teacher':
        return Response({'error': 'Only teachers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    topic = request.query_params.get('topic')
    if not topic:
        return Response({'error': 'Topic is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    from communications.models import StudentAssignment
    
    submissions = StudentAssignment.objects.filter(teacher=request.user, assignment_topic=topic)
    
    # Map to Submission structure expected by frontend
    data = []
    from users.serializers import UserSerializer
    
    for sub in submissions:
        data.append({
            'id': sub.id,
            'student': UserSerializer(sub.student).data,
            'submitted_at': sub.submitted_at,
            'submitted_text': '', # Text extraction might be needed if we want to show it immediately, but usually it's on demand or we can extract if file is present
            'submitted_file': request.build_absolute_uri(sub.file.url) if sub.file else None,
            'authenticity_score': sub.authenticity_score,
            'ai_likelihood': sub.ai_likelihood,
            'is_student_assignment': True # Flag to identify source
        })
        
    return Response(data)
    return Response(data)

# ============================================================================
# ASSIGNMENT GENERATION & PARSING
# ============================================================================

import json
import logging
from ai_tools.llm import llm_router, LLMRequest, TaskType, TaskComplexity, UserRole
from ai_tools.views import clean_json_response

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_assignment_view(request):
    """
    Generate assignment content using AI.
    """
    topic = request.data.get('topic')
    grade_level = request.data.get('grade_level')
    subject = request.data.get('subject')
    assignment_type = request.data.get('assignment_type', 'Quiz')
    difficulty = request.data.get('difficulty', 'Medium')
    
    if not topic:
        return Response({'error': 'Topic is required'}, status=status.HTTP_400_BAD_REQUEST)

    prompt = f"""Create a {difficulty} difficulty {assignment_type} for {grade_level} {subject} on the topic: "{topic}".
    
    Include:
    1. Title
    2. Description
    3. 5-10 Questions/Tasks
    4. Answer Key/Rubric
    
    Format as JSON:
    {{
        "title": "...",
        "description": "...",
        "content": "..." (Markdown formatted content)
    }}
    """
    
    llm_request = LLMRequest(
        prompt=prompt,
        user_id=request.user.id,
        user_role=UserRole(request.user.role),
        task_type=TaskType.CONTENT_GENERATION,
        complexity=TaskComplexity.MEDIUM,
        system_prompt="You are an expert teacher.",
        temperature=0.7,
        max_tokens=2000
    )
    
    try:
        response = llm_router.process_request(llm_request)
        if not response.success:
             return Response({'error': response.error_message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
             
        try:
            cleaned = clean_json_response(response.content)
            data = json.loads(cleaned)
            return Response(data)
        except:
            return Response({
                "title": f"{topic} Assignment",
                "description": "Generated assignment",
                "content": response.content
            })
            
    except Exception as e:
        logger.error(f"Assignment generation error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def parse_assignment_view(request):
    """
    Parse uploaded assignment file (PDF, Docx, Txt).
    """
    if 'file' not in request.FILES:
        return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
    file = request.FILES['file']
    content = ""
    
    try:
        if file.name.endswith('.pdf'):
            import PyPDF2
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    content += text + "\n"
        elif file.name.endswith('.docx'):
            import docx
            doc = docx.Document(file)
            for para in doc.paragraphs:
                content += para.text + "\n"
        elif file.name.endswith('.txt'):
            content = file.read().decode('utf-8')
        else:
            return Response({'error': 'Unsupported file format. Please upload PDF, DOCX, or TXT.'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({'content': content})
        
    except ImportError as e:
        logger.error(f"Import error during file parsing: {e}")
        return Response({'error': f"Server configuration error: Missing library {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"File parsing error: {e}")
        return Response({'error': f"Failed to parse file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Regions."""
    queryset = Region.objects.filter(is_active=True)
    serializer_class = RegionSerializer
    permission_classes = [AllowAny]


class GradeLevelViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Grade Levels."""
    queryset = GradeLevel.objects.filter(is_active=True)
    serializer_class = GradeLevelSerializer
    permission_classes = [AllowAny]


class StreamViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Streams."""
    queryset = Stream.objects.filter(is_active=True)
    serializer_class = StreamSerializer
    permission_classes = [AllowAny]


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Subjects."""
    queryset = Subject.objects.filter(is_active=True)
    serializer_class = SubjectSerializer
    permission_classes = [AllowAny]


class CurriculumViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Curriculum."""
    queryset = Curriculum.objects.filter(is_active=True)
    serializer_class = CurriculumSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Curriculum.objects.filter(is_active=True)
        region = self.request.query_params.get('region')
        grade = self.request.query_params.get('grade')
        stream = self.request.query_params.get('stream')

        if region:
            queryset = queryset.filter(region__name=region)
        if grade:
            queryset = queryset.filter(grade_level__name=grade)
        if stream:
            queryset = queryset.filter(stream__name=stream)
        
        return queryset

from .serializers import AssignmentTypeSerializer, ExamTypeSerializer
from .models import AssignmentType, ExamType

class AssignmentTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Assignment Types."""
    queryset = AssignmentType.objects.filter(is_active=True)
    serializer_class = AssignmentTypeSerializer
    permission_classes = [IsAuthenticated]

class ExamTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Exam Types."""
    queryset = ExamType.objects.filter(is_active=True)
    serializer_class = ExamTypeSerializer
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def grade_types_view(request):
    """Get all available assignment and exam types."""
    assignment_types = AssignmentType.objects.filter(is_active=True)
    exam_types = ExamType.objects.filter(is_active=True)
    
    # Serialize data from database
    a_data = AssignmentTypeSerializer(assignment_types, many=True).data
    e_data = ExamTypeSerializer(exam_types, many=True).data

    return Response({
        'assignment_types': a_data,
        'exam_types': e_data
    })
