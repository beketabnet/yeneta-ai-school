"""
Grade aggregation and calculation services for the Gradebook Manager.
Handles real-time aggregation of grades by type and overall calculations.
"""

from django.db.models import Avg, Q, Count
from .models import StudentGrade


class GradeAggregationService:
    """Service for calculating aggregated grades and statistics."""
    
    ASSIGNMENT_TYPES = [
        'Quiz', 'Assignment', 'Homework', 'Project', 'Lab Report',
        'Presentation', 'Group Work', 'Essay', 'Critical Analysis'
    ]
    
    EXAM_TYPES = ['Quiz', 'Mid Exam', 'Final Exam']
    
    @staticmethod
    def get_grade_by_type(student_id, subject, grade_type, type_value):
        """
        Get a specific grade for a student by type.
        
        Args:
            student_id: Student ID
            subject: Subject name
            grade_type: 'assignment' or 'exam'
            type_value: Assignment type or exam type value
            
        Returns:
            Grade object or None
        """
        try:
            if grade_type == 'assignment':
                return StudentGrade.objects.get(
                    student_id=student_id,
                    subject=subject,
                    assignment_type=type_value,
                    exam_type__isnull=True
                )
            else:  # exam
                return StudentGrade.objects.get(
                    student_id=student_id,
                    subject=subject,
                    exam_type=type_value,
                    assignment_type__isnull=True
                )
        except StudentGrade.DoesNotExist:
            return None
    
    @staticmethod
    def get_assignment_average(student_id, subject):
        """
        Calculate average of all assignment grades for a student in a subject.
        
        Args:
            student_id: Student ID
            subject: Subject name
            
        Returns:
            Average score or None if no assignments
        """
        avg = StudentGrade.objects.filter(
            student_id=student_id,
            subject=subject,
            assignment_type__isnull=False,
            exam_type__isnull=True
        ).aggregate(avg_score=Avg('score'))
        
        return avg['avg_score']
    
    @staticmethod
    def get_exam_average(student_id, subject):
        """
        Calculate average of all exam grades for a student in a subject.
        
        Args:
            student_id: Student ID
            subject: Subject name
            
        Returns:
            Average score or None if no exams
        """
        avg = StudentGrade.objects.filter(
            student_id=student_id,
            subject=subject,
            exam_type__isnull=False,
            assignment_type__isnull=True
        ).aggregate(avg_score=Avg('score'))
        
        return avg['avg_score']
    
    @staticmethod
    def get_overall_grade(student_id, subject):
        """
        Calculate overall grade using weighted average.
        Overall Grade = (Assignment Average × 0.4) + (Exam Average × 0.6)
        
        Args:
            student_id: Student ID
            subject: Subject name
            
        Returns:
            Overall grade or None if insufficient data
        """
        assignment_avg = GradeAggregationService.get_assignment_average(student_id, subject)
        exam_avg = GradeAggregationService.get_exam_average(student_id, subject)
        
        # Return None if no data
        if assignment_avg is None and exam_avg is None:
            return None
        
        # If only one type exists, use that
        if assignment_avg is None:
            return exam_avg
        if exam_avg is None:
            return assignment_avg
        
        # Calculate weighted average
        overall = (assignment_avg * 0.4) + (exam_avg * 0.6)
        return round(overall, 1)
    
    @staticmethod
    def get_aggregated_grades(student_id, subject):
        """
        Get all grades for a student in a subject, organized by type.
        
        Args:
            student_id: Student ID
            subject: Subject name
            
        Returns:
            Dictionary with aggregated grade data
        """
        result = {
            'student_id': student_id,
            'subject': subject,
            'assignment_grades': {},
            'exam_grades': {},
            'assignment_average': None,
            'exam_average': None,
            'overall_grade': None,
            'total_grades': 0,
            'pending_grades': 0,
            'completed_grades': 0
        }
        
        # Get all grades for this student/subject
        grades = StudentGrade.objects.filter(
            student_id=student_id,
            subject=subject
        ).select_related('student', 'graded_by')
        
        # Organize by type
        for grade in grades:
            if grade.assignment_type:
                result['assignment_grades'][grade.assignment_type] = {
                    'id': grade.id,
                    'score': grade.score,
                    'max_score': grade.max_score,
                    'percentage': grade.percentage,
                    'feedback': grade.feedback,
                    'graded_at': grade.graded_at.isoformat() if grade.graded_at else None
                }
                result['completed_grades'] += 1
            elif grade.exam_type:
                result['exam_grades'][grade.exam_type] = {
                    'id': grade.id,
                    'score': grade.score,
                    'max_score': grade.max_score,
                    'percentage': grade.percentage,
                    'feedback': grade.feedback,
                    'graded_at': grade.graded_at.isoformat() if grade.graded_at else None
                }
                result['completed_grades'] += 1
        
        # Add missing grade types as pending
        for assignment_type in GradeAggregationService.ASSIGNMENT_TYPES:
            if assignment_type not in result['assignment_grades']:
                result['assignment_grades'][assignment_type] = None
                result['pending_grades'] += 1
        
        for exam_type in GradeAggregationService.EXAM_TYPES:
            if exam_type not in result['exam_grades']:
                result['exam_grades'][exam_type] = None
                result['pending_grades'] += 1
        
        result['total_grades'] = result['completed_grades'] + result['pending_grades']
        
        # Calculate averages
        result['assignment_average'] = GradeAggregationService.get_assignment_average(student_id, subject)
        result['exam_average'] = GradeAggregationService.get_exam_average(student_id, subject)
        result['overall_grade'] = GradeAggregationService.get_overall_grade(student_id, subject)
        
        return result
    
    @staticmethod
    def get_grade_statistics(teacher_id=None):
        """
        Get grade statistics for a teacher or all teachers.
        
        Args:
            teacher_id: Optional teacher ID to filter by
            
        Returns:
            Dictionary with statistics
        """
        query = StudentGrade.objects.all()
        
        if teacher_id:
            query = query.filter(graded_by_id=teacher_id)
        
        stats = {
            'total_grades': query.count(),
            'average_score': query.aggregate(avg=Avg('score'))['avg'],
            'subjects_count': query.values('subject').distinct().count(),
            'students_count': query.values('student_id').distinct().count(),
            'assignment_count': query.filter(assignment_type__isnull=False).count(),
            'exam_count': query.filter(exam_type__isnull=False).count(),
        }
        
        return stats
    
    @staticmethod
    def get_student_performance_summary(student_id):
        """
        Get overall performance summary for a student.
        
        Args:
            student_id: Student ID
            
        Returns:
            Dictionary with performance data
        """
        grades = StudentGrade.objects.filter(student_id=student_id)
        
        subjects = {}
        for grade in grades:
            if grade.subject not in subjects:
                subjects[grade.subject] = {
                    'assignment_avg': None,
                    'exam_avg': None,
                    'overall': None
                }
            
            # Calculate for this subject
            subjects[grade.subject]['assignment_avg'] = GradeAggregationService.get_assignment_average(
                student_id, grade.subject
            )
            subjects[grade.subject]['exam_avg'] = GradeAggregationService.get_exam_average(
                student_id, grade.subject
            )
            subjects[grade.subject]['overall'] = GradeAggregationService.get_overall_grade(
                student_id, grade.subject
            )
        
        # Calculate overall performance
        all_grades = grades.aggregate(avg=Avg('score'))['avg']
        
        return {
            'student_id': student_id,
            'overall_average': all_grades,
            'subjects': subjects,
            'total_subjects': len(subjects),
            'total_grades': grades.count()
        }
