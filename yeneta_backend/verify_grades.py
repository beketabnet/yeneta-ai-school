import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from users.models import User
from communications.models import StudentAssignment
from academics.models import StudentGrade
from rest_framework.test import APIRequestFactory, force_authenticate
from communications.views import StudentAssignmentViewSet
from academics.views import my_grades_view
from django.utils import timezone

def verify_grade_persistence():
    print("Starting Grade Persistence Verification...")
    
    # 1. Setup Users
    student_username = 'test_student_grade_verify'
    teacher_username = 'test_teacher_grade_verify'
    
    student, _ = User.objects.get_or_create(username=student_username, defaults={'role': 'Student', 'email': 's@test.com'})
    teacher, _ = User.objects.get_or_create(username=teacher_username, defaults={'role': 'Teacher', 'email': 't@test.com'})
    
    print(f"Users setup: Student={student.username}, Teacher={teacher.username}")
    
    # 2. Create Assignment
    assignment = StudentAssignment.objects.create(
        student=student,
        teacher=teacher,
        assignment_topic="Test Assignment for Persistence",
        document_type="Assignment",
        subject="Mathematics",
        grade_level="Grade 10",
        is_graded=False
    )
    print(f"Created Assignment: ID={assignment.id}")
    
    # 3. Grade Assignment via ViewSet
    factory = APIRequestFactory()
    view = StudentAssignmentViewSet.as_view({'post': 'grade'})
    
    data = {'grade': 85.5, 'feedback': 'Great work!'}
    request = factory.post(f'/api/communications/student-assignments/{assignment.id}/grade/', data, format='json')
    force_authenticate(request, user=teacher)
    
    response = view(request, pk=assignment.id)
    print(f"Grading Response: {response.status_code}")
    
    if response.status_code != 200:
        print("Error grading assignment:", response.data)
        return
    
    # 4. Verify StudentGrade Creation
    student_grades = StudentGrade.objects.filter(student=student, title=assignment.assignment_topic)
    if student_grades.exists():
        grade_entry = student_grades.first()
        print(f"SUCCESS: StudentGrade created! Score={grade_entry.score}, Feedback={grade_entry.feedback}")
    else:
        print("FAILURE: StudentGrade NOT created.")
        return

    # 5. Verify my_grades_view
    request = factory.get('/api/academics/my-grades/')
    force_authenticate(request, user=student)
    
    response = my_grades_view(request)
    print(f"My Grades View Response: {response.status_code}")
    
    if response.status_code == 200:
        data = response.data
        # Check if our grade is in the response
        found = False
        for course in data:
            for unit in course['units']:
                for item in unit['items']:
                    if item['title'] == assignment.assignment_topic and item['score'] == 85.5:
                        found = True
                        print("SUCCESS: Grade found in my_grades_view!")
                        break
        if not found:
            print("FAILURE: Grade NOT found in my_grades_view response.")
            print("Response Data:", data)
    else:
        print("Error accessing my_grades_view:", response.data)

if __name__ == '__main__':
    try:
        verify_grade_persistence()
    except Exception as e:
        print(f"An error occurred: {e}")
