"""
Enhanced Grade Entry Service - Includes student information with enrolled subjects
"""

from django.db.models import Q, Count, Avg, F
from django.core.cache import cache
from .models import StudentGrade, Course, Enrollment
from django.contrib.auth import get_user_model

User = get_user_model()

# Import subject resolution service to handle missing courses
try:
    from .services_subject_resolution import SubjectResolutionService
except ImportError:
    SubjectResolutionService = None


class EnhancedTeacherSubjectGradesService:
    """Service for managing grades at subject level for teachers - with student details"""

    CACHE_TIMEOUT = 300

    @staticmethod
    def get_teacher_enrolled_subjects_with_students(teacher_id):
        """
        Get all unique subjects where teacher has enrolled students with student details
        Returns subjects with student information
        """
        # Note: Not using cache for this endpoint to ensure fresh data
        subject_data = {}
        
        # Get all actual enrollments for teacher's courses
        enrollments = Enrollment.objects.filter(
            course__teacher_id=teacher_id
        ).select_related('student', 'course').order_by('course__title')

        for enrollment in enrollments:
            key = f"{enrollment.course.id}_{enrollment.course.grade_level}"
            
            if key not in subject_data:
                subject_data[key] = {
                    'subject_id': enrollment.course.id,
                    'subject_name': enrollment.course.title,
                    'grade_level': enrollment.course.grade_level,
                    'students': [],
                    'student_ids': set(),
                }
            
            if enrollment.student.id not in subject_data[key]['student_ids']:
                first_name = enrollment.student.first_name or ''
                last_name = enrollment.student.last_name or ''
                full_name = f"{first_name} {last_name}".strip()
                student_name = full_name if full_name else enrollment.student.username
                subject_data[key]['students'].append({
                    'student_id': enrollment.student.id,
                    'student_name': student_name,
                    'username': enrollment.student.username,
                })
                subject_data[key]['student_ids'].add(enrollment.student.id)
        
        # Include approved StudentEnrollmentRequest records
        from .models import StudentEnrollmentRequest
        approved_requests = StudentEnrollmentRequest.objects.filter(
            teacher_id=teacher_id,
            status='approved'
        ).select_related('student')
        
        seen_requests = set()
        
        for req in approved_requests:
            req_unique = (req.student_id, req.subject, req.grade_level)
            
            if req_unique in seen_requests:
                continue
            seen_requests.add(req_unique)
            
            # Check if this matches existing enrollment
            existing_key = None
            for key, data in subject_data.items():
                subject_lower = data['subject_name'].lower()
                req_subject_lower = req.subject.lower()
                
                if ((req_subject_lower in subject_lower or subject_lower in req_subject_lower) and 
                    data['grade_level'] == req.grade_level):
                    existing_key = key
                    break
            
            if existing_key:
                if req.student.id not in subject_data[existing_key]['student_ids']:
                    subject_data[existing_key]['students'].append({
                        'student_id': req.student.id,
                        'student_name': f"{req.student.first_name} {req.student.last_name}".strip() or req.student.username,
                        'username': req.student.username,
                    })
                    subject_data[existing_key]['student_ids'].add(req.student.id)
            else:
                # Try to resolve or create a course for this StudentEnrollmentRequest
                resolved_course = None
                if SubjectResolutionService:
                    try:
                        resolved_course = SubjectResolutionService.resolve_or_create_course(
                            req.teacher,
                            req.subject,
                            req.grade_level
                        )
                    except Exception:
                        # If resolution fails, continue without course ID
                        pass
                
                key = f"req_{req.subject}_{req.grade_level}" if not resolved_course else f"{resolved_course.id}_{req.grade_level}"
                
                if key not in subject_data:
                    subject_data[key] = {
                        'subject_id': resolved_course.id if resolved_course else None,
                        'subject_name': req.subject,
                        'grade_level': req.grade_level,
                        'students': [],
                        'student_ids': set(),
                    }
                
                if req.student.id not in subject_data[key]['student_ids']:
                    first_name = req.student.first_name or ''
                    last_name = req.student.last_name or ''
                    full_name = f"{first_name} {last_name}".strip()
                    student_name = full_name if full_name else req.student.username
                    subject_data[key]['students'].append({
                        'student_id': req.student.id,
                        'student_name': student_name,
                        'username': req.student.username,
                    })
                    subject_data[key]['student_ids'].add(req.student.id)
        
        result = []
        for key, data in subject_data.items():
            # Remove student_ids set before returning
            student_ids_set = data.pop('student_ids')
            data['student_count'] = len(data['students'])
            
            # Calculate average score for this subject
            student_ids = [s['student_id'] for s in data['students']]
            if student_ids:
                avg_score = StudentGrade.objects.filter(
                    student_id__in=student_ids,
                    subject=data['subject_name'],
                    graded_by_id=teacher_id
                ).aggregate(avg=Avg('score'))['avg']
                data['average_score'] = avg_score
            else:
                data['average_score'] = None
            
            result.append(data)

        result = sorted(result, key=lambda x: (x['subject_name'], x['grade_level']))
        return result

    @staticmethod
    def get_subject_students_for_grading(teacher_id, subject_id):
        """
        Get all students in a subject for grading with their existing grades
        """
        cache_key = f"subject_students_grading_{teacher_id}_{subject_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        try:
            course = Course.objects.get(id=subject_id, teacher_id=teacher_id)
        except Course.DoesNotExist:
            return None

        students_data = []
        student_ids = set()
        
        # Get from actual enrollments
        enrollments = Enrollment.objects.filter(
            course_id=subject_id
        ).select_related('student')

        for enrollment in enrollments:
            if enrollment.student.id not in student_ids:
                students_data.append({
                    'student_id': enrollment.student.id,
                    'student_name': f"{enrollment.student.first_name} {enrollment.student.last_name}".strip() or enrollment.student.username,
                    'username': enrollment.student.username,
                    'email': enrollment.student.email,
                })
                student_ids.add(enrollment.student.id)

        # Also get from approved requests
        from .models import StudentEnrollmentRequest
        approved_requests = StudentEnrollmentRequest.objects.filter(
            teacher_id=teacher_id,
            status='approved',
            subject=course.title,
            grade_level=course.grade_level
        ).select_related('student')

        for req in approved_requests:
            if req.student.id not in student_ids:
                students_data.append({
                    'student_id': req.student.id,
                    'student_name': f"{req.student.first_name} {req.student.last_name}".strip() or req.student.username,
                    'username': req.student.username,
                    'email': req.student.email,
                })
                student_ids.add(req.student.id)

        result = {
            'subject_id': subject_id,
            'subject_name': course.title,
            'grade_level': course.grade_level,
            'students': students_data,
            'total_students': len(students_data),
        }

        cache.set(cache_key, result, EnhancedTeacherSubjectGradesService.CACHE_TIMEOUT)
        return result

    @staticmethod
    def get_student_grades_for_subject(teacher_id, student_id, subject_name):
        """
        Get all existing grades for a student in a subject
        """
        try:
            grades = StudentGrade.objects.filter(
                student_id=student_id,
                subject=subject_name,
                graded_by_id=teacher_id
            ).values(
                'id',
                'assignment_type',
                'exam_type',
                'score',
                'max_score',
                'feedback',
                'graded_at'
            )
            return list(grades)
        except Exception:
            return []

    @staticmethod
    def save_student_grade(teacher_id, grade_data):
        """
        Save or update a student grade
        """
        try:
            student_id = grade_data.get('student_id')
            subject = grade_data.get('subject')
            
            if not student_id or not subject:
                return {'error': 'Missing student_id or subject'}

            # Check student exists
            try:
                student = User.objects.get(id=student_id, role='Student')
            except User.DoesNotExist:
                return {'error': 'Student not found'}

            # Update or create grade
            grade_obj, created = StudentGrade.objects.update_or_create(
                student_id=student_id,
                subject=subject,
                assignment_type=grade_data.get('assignment_type'),
                exam_type=grade_data.get('exam_type'),
                defaults={
                    'score': grade_data.get('score'),
                    'max_score': grade_data.get('max_score', 100),
                    'feedback': grade_data.get('feedback', ''),
                    'graded_by_id': teacher_id,
                    'grade_level': grade_data.get('grade_level', ''),
                    'stream': grade_data.get('stream', ''),
                }
            )

            return {
                'success': True,
                'grade_id': grade_obj.id,
                'created': created,
                'message': 'Grade saved successfully'
            }
        except Exception as e:
            return {'error': str(e)}

    @staticmethod
    def get_grade_statistics_for_subject(teacher_id, subject_name):
        """
        Get statistics for all grades in a subject
        """
        try:
            grades = StudentGrade.objects.filter(
                subject=subject_name,
                graded_by_id=teacher_id
            )

            total_grades = grades.count()
            avg_score = grades.aggregate(Avg('score'))['score__avg']
            
            # Group by type
            assignment_grades = grades.filter(assignment_type__isnull=False)
            exam_grades = grades.filter(exam_type__isnull=False)

            return {
                'subject': subject_name,
                'total_grades': total_grades,
                'average_score': avg_score,
                'assignment_count': assignment_grades.count(),
                'exam_count': exam_grades.count(),
                'assignment_average': assignment_grades.aggregate(Avg('score'))['score__avg'],
                'exam_average': exam_grades.aggregate(Avg('score'))['score__avg'],
            }
        except Exception as e:
            return {'error': str(e)}

    @staticmethod
    def invalidate_cache(teacher_id, subject_id=None):
        """Invalidate cache for teacher"""
        cache.delete(f"teacher_subjects_with_students_{teacher_id}")
        if subject_id:
            cache.delete(f"subject_students_grading_{teacher_id}_{subject_id}")
