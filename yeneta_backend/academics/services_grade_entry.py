"""
Grade Entry Service - Optimized for efficient grade entry operations
Handles subject-specific grade retrieval, bulk operations, and caching
"""

from django.db.models import Q, Count, Avg, F
from django.core.cache import cache
from .models import StudentGrade, Course, Enrollment
from django.contrib.auth import get_user_model

User = get_user_model()


class TeacherSubjectGradesService:
    """Service for managing grades at subject level for teachers"""

    CACHE_TIMEOUT = 300  # 5 minutes

    @staticmethod
    def get_teacher_enrolled_subjects(teacher_id):
        """
        Get all unique subjects where teacher has enrolled students with aggregated data
        Returns subjects grouped by subject and grade level
        Includes both actual Enrollments and approved StudentEnrollmentRequest records
        """
        cache_key = f"teacher_subjects_{teacher_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        subject_dict = {}
        student_set = {}
        
        # USE SSOT: approved StudentEnrollmentRequest records
        from .models import StudentEnrollmentRequest
        approved_requests = StudentEnrollmentRequest.objects.filter(
            teacher_id=teacher_id,
            status='approved'
        ).select_related('student')
        
        # Deduplicate requests (there may be multiple requests for same subject/student)
        seen_requests = set()
        
        for req in approved_requests:
            # Create unique key to avoid duplicates (student_id, subject, grade_level)
            req_unique = (req.student_id, req.subject, req.grade_level, req.stream)
            
            if req_unique in seen_requests:
                continue
            seen_requests.add(req_unique)
            
            # Normalize key
            key = f"{req.subject}_{req.grade_level}_{req.stream or ''}"
            
            if key not in subject_dict:
                subject_dict[key] = {
                    'subject_id': req.id, # Use a stable ID if possible, or hash
                    'subject_name': req.subject,
                    'grade_level': req.grade_level,
                    'stream': req.stream
                }
                student_set[key] = set()
            
            student_set[key].add(req.student_id)
        
        result = []
        for key, subject_data in subject_dict.items():
            subject_data['student_count'] = len(student_set[key])
            subject_data['average_score'] = None
            subject_data['id'] = key # Frontend often expects an ID
            result.append(subject_data)

        result = sorted(result, key=lambda x: (x['subject_name'], x['grade_level']))
        
        cache.set(cache_key, result, TeacherSubjectGradesService.CACHE_TIMEOUT)
        return result

    @staticmethod
    def get_subject_students_with_grades(teacher_id, subject_id):
        """
        Get all students enrolled in subject with their existing grades
        Optimized query with minimal database hits
        """
        cache_key = f"subject_grades_{teacher_id}_{subject_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        # Resolve Subject/Grade/Stream from the ID (which is a StudentEnrollmentRequest ID)
        from .models import StudentEnrollmentRequest
        try:
            # We use the ID to find *one* request, which gives us the subject/grade info
            reference_req = StudentEnrollmentRequest.objects.get(id=subject_id)
            if reference_req.teacher_id != teacher_id:
                return []
        except StudentEnrollmentRequest.DoesNotExist:
            return []

        subject_name = reference_req.subject
        grade_level = reference_req.grade_level
        stream = reference_req.stream

        # Get all approved requests for this class
        requests = StudentEnrollmentRequest.objects.filter(
            teacher_id=teacher_id,
            subject=subject_name,
            grade_level=grade_level,
            status='approved'
        ).select_related('student').prefetch_related(
            'student__student_grades'
        )
        
        if stream:
            requests = requests.filter(stream=stream)

        students_data = []
        for req in requests:
            student = req.student
            # Fetch grades for this student/subject
            # Note: StudentGrade stores 'subject' as string name
            grades_qs = StudentGrade.objects.filter(
                student_id=student.id,
                subject=subject_name
            )
            
            # Graded by check? Ideally yes, but if we want to show all grades for the subject, maybe no.
            # But the original code filtered by `graded_by_id=teacher_id`. Let's keep that for now to match behavior,
            # unless the user wants to see all grades. But usually a teacher sees grades they gave, or normalized grades.
            # Given SSOT, maybe we should relax `graded_by` if multiple teachers teach same subject?
            # For now, let's keep `graded_by` or strict subject matching.
            # Actually, `StudentGrade` has `graded_by`.
            # Let's trust `subject` + `grade_level` + `stream` (if in model).
            # `StudentGrade` has `grade_level` and `stream`.
            
            grades_qs = grades_qs.filter(grade_level=grade_level)
            if stream:
                grades_qs = grades_qs.filter(stream=stream)
            
            # Retrieve values
            grades = grades_qs.values(
                'id',
                'assignment_type',
                'exam_type',
                'score',
                'max_score',
                'feedback',
                'graded_at'
            )

            students_data.append({
                'student_id': student.id,
                'student_name': student.get_full_name(),
                'grade_level': grade_level,
                'stream': stream,
                'enrollment_date': req.requested_at.isoformat(),
                'grades': list(grades),
                'assignment_grades': [g for g in grades if g['assignment_type']],
                'exam_grades': [g for g in grades if g['exam_type']],
                'total_grades': len(list(grades))
            })

        result = {
            'subject_id': subject_id,
            'subject_name': subject_name,
            'grade_level': grade_level,
            'students': students_data,
            'total_students': len(students_data)
        }

        cache.set(cache_key, result, self.CACHE_TIMEOUT)
        return result

    @staticmethod
    def get_subject_grade_summary(teacher_id, subject_id):
        """
        Get grade statistics for a subject
        """
        cache_key = f"subject_summary_{teacher_id}_{subject_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        from .models import StudentEnrollmentRequest
        try:
            # Resolve subject info from ID
            reference_req = StudentEnrollmentRequest.objects.get(id=subject_id)
            if reference_req.teacher_id != teacher_id:
                return None
        except StudentEnrollmentRequest.DoesNotExist:
            return None

        subject_name = reference_req.subject
        grade_level = reference_req.grade_level
        stream = reference_req.stream

        # Get relevant grades
        grades = StudentGrade.objects.filter(
            subject=subject_name,
            grade_level=grade_level
        )
        if stream:
            grades = grades.filter(stream=stream)

        assignment_grades = grades.filter(assignment_type__isnull=False)
        exam_grades = grades.filter(exam_type__isnull=False)

        # Count students
        student_count_qs = StudentEnrollmentRequest.objects.filter(
            teacher_id=teacher_id,
            subject=subject_name,
            grade_level=grade_level,
            status='approved'
        )
        if stream:
            student_count_qs = student_count_qs.filter(stream=stream)

        result = {
            'subject_id': subject_id,
            'subject_name': subject_name,
            'total_grades': grades.count(),
            'total_students': student_count_qs.count(),
            'average_score': grades.aggregate(Avg('score'))['score__avg'] or 0,
            'assignment_count': assignment_grades.count(),
            'exam_count': exam_grades.count(),
            'assignment_average': assignment_grades.aggregate(Avg('score'))['score__avg'] or 0,
            'exam_average': exam_grades.aggregate(Avg('score'))['score__avg'] or 0,
        }

        cache.set(cache_key, result, self.CACHE_TIMEOUT)
        return result

    @staticmethod
    def bulk_create_grades(teacher_id, grades_data):
        """
        Bulk create grades for multiple students
        grades_data: List of {student_id, subject, assignment_type, exam_type, score, max_score, feedback}
        """
        created_grades = []
        errors = []

        for grade_data in grades_data:
            try:
                # Validate data
                if not grade_data.get('student_id') or not grade_data.get('subject'):
                    errors.append({
                        'student_id': grade_data.get('student_id'),
                        'error': 'Missing student_id or subject'
                    })
                    continue

                # Check student exists
                try:
                    student = User.objects.get(id=grade_data['student_id'], role='Student')
                except User.DoesNotExist:
                    errors.append({
                        'student_id': grade_data['student_id'],
                        'error': 'Student not found'
                    })
                    continue

                # Create grade
                grade = StudentGrade.objects.create(
                    student_id=grade_data['student_id'],
                    subject=grade_data['subject'],
                    grade_level=grade_data.get('grade_level', ''),
                    stream=grade_data.get('stream', ''),
                    assignment_type=grade_data.get('assignment_type'),
                    exam_type=grade_data.get('exam_type'),
                    score=grade_data['score'],
                    max_score=grade_data.get('max_score', 100),
                    feedback=grade_data.get('feedback', ''),
                    graded_by_id=teacher_id
                )
                created_grades.append(grade)

            except Exception as e:
                errors.append({
                    'student_id': grade_data.get('student_id'),
                    'error': str(e)
                })

        return {
            'created': len(created_grades),
            'failed': len(errors),
            'grades': created_grades,
            'errors': errors
        }

    @staticmethod
    def invalidate_subject_cache(teacher_id, subject_id=None):
        """
        Invalidate cache for subject grades
        """
        if subject_id:
            cache.delete(f"subject_grades_{teacher_id}_{subject_id}")
            cache.delete(f"subject_summary_{teacher_id}_{subject_id}")
        else:
            cache.delete(f"teacher_subjects_{teacher_id}")
