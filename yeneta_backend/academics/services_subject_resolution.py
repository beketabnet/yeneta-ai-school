"""
Subject Resolution Service - Ensures all subjects have valid subject_ids
This service resolves StudentEnrollmentRequest subjects to actual Course objects,
creating courses when necessary to ensure complete data integrity.
"""

from django.db.models import Q
from .models import Course, StudentEnrollmentRequest, Enrollment


class SubjectResolutionService:
    """Service for resolving subjects to valid course IDs"""
    
    @staticmethod
    def resolve_or_create_course(teacher, subject_name, grade_level):
        """
        Resolve a subject to a Course or create one if it doesn't exist.
        
        Args:
            teacher: Teacher user object
            subject_name: Name of the subject
            grade_level: Grade level string
            
        Returns:
            Course object with valid ID
        """
        # Try to find exact match first
        course = Course.objects.filter(
            teacher=teacher,
            subject=subject_name,
            grade_level=grade_level
        ).first()
        
        if course:
            return course
        
        # Try fuzzy matching (subject name might be stored differently)
        subject_lower = subject_name.lower()
        matching_courses = Course.objects.filter(
            teacher=teacher,
            grade_level=grade_level
        )
        
        for c in matching_courses:
            if c.subject.lower() == subject_lower or c.title.lower() == subject_lower:
                return c
        
        # Create new course if none exists
        course = Course.objects.create(
            teacher=teacher,
            title=subject_name,
            subject=subject_name,
            grade_level=grade_level,
            description=f"Auto-created for {teacher.username}: {subject_name} - Grade {grade_level}"
        )
        
        return course
    
    @staticmethod
    def sync_enrollment_requests_to_courses(teacher_id=None):
        """
        Sync StudentEnrollmentRequest records to Course objects.
        Ensures each approved request has a matching course.
        
        Args:
            teacher_id: Optional teacher ID to limit sync
            
        Returns:
            dict with sync results
        """
        query = StudentEnrollmentRequest.objects.filter(status='approved')
        if teacher_id:
            query = query.filter(teacher_id=teacher_id)
        
        results = {
            'total': 0,
            'created_courses': 0,
            'found_courses': 0,
            'errors': []
        }
        
        for req in query:
            results['total'] += 1
            
            try:
                course = SubjectResolutionService.resolve_or_create_course(
                    req.teacher,
                    req.subject,
                    req.grade_level
                )
                
                # Create enrollment if it doesn't exist
                enrollment, created = Enrollment.objects.get_or_create(
                    student=req.student,
                    course=course
                )
                
                if created:
                    results['created_courses'] += 1
                else:
                    results['found_courses'] += 1
                    
            except Exception as e:
                results['errors'].append({
                    'request_id': req.id,
                    'error': str(e)
                })
        
        return results
    
    @staticmethod
    def validate_subject_ids(teacher_id=None):
        """
        Validate that all subjects for a teacher have valid subject_ids.
        
        Args:
            teacher_id: Optional teacher ID
            
        Returns:
            dict with validation results
        """
        from .services_grade_entry_enhanced import EnhancedTeacherSubjectGradesService
        
        if teacher_id:
            subjects = EnhancedTeacherSubjectGradesService.get_teacher_enrolled_subjects_with_students(teacher_id)
        else:
            subjects = []
        
        results = {
            'total_subjects': len(subjects),
            'subjects_with_id': 0,
            'subjects_without_id': 0,
            'invalid_subjects': []
        }
        
        for subject in subjects:
            if subject.get('subject_id') is None:
                results['subjects_without_id'] += 1
                results['invalid_subjects'].append({
                    'name': subject.get('subject_name'),
                    'grade_level': subject.get('grade_level')
                })
            else:
                results['subjects_with_id'] += 1
        
        return results
