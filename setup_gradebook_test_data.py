#!/usr/bin/env python
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "yeneta_backend.settings")
django.setup()

from django.utils import timezone
from users.models import User
from academics.models import TeacherCourseRequest, StudentEnrollmentRequest, StudentGrade

def setup_test_data():
    """Setup comprehensive test data for gradebook tests."""
    
    try:
        # Get or create users
        teacher, _ = User.objects.get_or_create(
            username='teacher',
            defaults={
                'email': 'teacher@yeneta.ai',
                'first_name': 'Smith',
                'last_name': 'Teacher',
                'role': 'Teacher',
                'is_active': True,
                'grade_level': 'All'
            }
        )
        if not teacher.check_password('password'):
            teacher.set_password('password')
            teacher.save()
        
        # Create admin user for approving requests
        admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@yeneta.ai',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'Admin',
                'is_active': True
            }
        )
        if not admin.check_password('password'):
            admin.set_password('password')
            admin.save()
        
        # Create multiple students
        students = []
        student_names = [
            ('Abebe', 'Kebede'),
            ('Almaz', 'Tadesse'),
            ('Biruk', 'Getachew'),
            ('Chaltu', 'Mekonnen'),
            ('Dawit', 'Yoseph'),
        ]
        
        for i, (first_name, last_name) in enumerate(student_names, 1):
            student, _ = User.objects.get_or_create(
                username=f'student{i}',
                defaults={
                    'email': f'student{i}@yeneta.ai',
                    'first_name': first_name,
                    'last_name': last_name,
                    'role': 'Student',
                    'grade_level': f'Grade {(i % 12) + 1}',
                    'is_active': True
                }
            )
            if not student.check_password('password'):
                student.set_password('password')
                student.save()
            students.append(student)
        
        # Create teacher course requests for multiple subjects and grades
        subjects = ['Mathematics', 'English', 'Science', 'History', 'Geography']
        grades = ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
        
        # Approve some courses for the teacher
        approved_courses = []
        for subject in subjects[:3]:  # Only first 3 subjects
            for grade in grades[:6]:  # Only first 6 grades
                course_req, created = TeacherCourseRequest.objects.get_or_create(
                    teacher=teacher,
                    subject=subject,
                    grade_level=grade,
                    defaults={'status': 'approved', 'reviewed_by': admin, 'reviewed_at': timezone.now()}
                )
                if created:
                    course_req.status = 'approved'
                    course_req.reviewed_by = admin
                    course_req.reviewed_at = timezone.now()
                    course_req.save()
                    print(f"✓ Created approved course: {subject} - Grade {grade}")
                approved_courses.append((subject, grade, course_req))
        
        # Create student enrollment requests (approved)
        for i, student in enumerate(students):
            student_grade = f"Grade {(i % 6) + 1}"
            for subject in subjects[:3]:
                enrollment, created = StudentEnrollmentRequest.objects.get_or_create(
                    student=student,
                    teacher=teacher,
                    subject=subject,
                    grade_level=student_grade,
                    defaults={'status': 'approved', 'reviewed_by': admin, 'reviewed_at': timezone.now()}
                )
                if created:
                    enrollment.status = 'approved'
                    enrollment.reviewed_by = admin
                    enrollment.reviewed_at = timezone.now()
                    enrollment.save()
                    print(f"✓ Created enrollment: {student.first_name} -> {subject} - {student_grade}")
        
        # Create sample grades for each student-subject combination
        assignment_types = ['Assignment', 'Quiz']
        exam_types = ['Mid Exam', 'Final Exam']
        
        for student in students:
            for subject in subjects[:3]:
                # Create assignment grades
                for assignment_type in assignment_types:
                    score = (hash(f"{student.id}_{subject}_{assignment_type}") % 100) + 50
                    grade, created = StudentGrade.objects.get_or_create(
                        student=student,
                        subject=subject,
                        assignment_type=assignment_type,
                        defaults={
                            'score': score,
                            'max_score': 100,
                            'feedback': f'Good work on {assignment_type}',
                            'graded_by': teacher,
                            'graded_at': timezone.now()
                        }
                    )
                    if created:
                        print(f"✓ Created grade: {student.first_name} - {subject} - {assignment_type}: {score}")
                
                # Create exam grades (less frequently)
                if hash(f"{student.id}_{subject}") % 2 == 0:
                    for exam_type in exam_types:
                        score = (hash(f"{student.id}_{subject}_{exam_type}") % 100) + 50
                        grade, created = StudentGrade.objects.get_or_create(
                            student=student,
                            subject=subject,
                            exam_type=exam_type,
                            defaults={
                                'score': score,
                                'max_score': 100,
                                'feedback': f'Exam performance',
                                'graded_by': teacher,
                                'graded_at': timezone.now()
                            }
                        )
                        if created:
                            print(f"✓ Created exam grade: {student.first_name} - {subject} - {exam_type}: {score}")
        
        print("\n✓ Test data setup complete!")
        print(f"Created {len(students)} students")
        print(f"Created {len(approved_courses)} approved courses")
        print("Students are enrolled in these courses and have grades entered")
        
    except Exception as e:
        print(f"Error setting up test data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    setup_test_data()
