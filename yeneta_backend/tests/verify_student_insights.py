import os
import django
import json
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from academics.models import StudentGrade
from analytics.engagement_models import EngagementSession
from ai_tools.views import student_insights_view
from rest_framework.test import force_authenticate

User = get_user_model()

def verify_student_insights():
    print("Starting Student Insights Verification...")
    
    # 1. Create Test User (Student)
    student_email = "test_student_insights@example.com"
    try:
        student = User.objects.get(email=student_email)
        print(f"Found existing test student: {student.username}")
    except User.DoesNotExist:
        student = User.objects.create_user(
            username="test_student_insights",
            email=student_email,
            password="testpassword123",
            role="Student",
            grade_level="9"
        )
        print(f"Created test student: {student.username}")

    # 2. Create Test Data (Grades & Engagement)
    # Clear old data
    StudentGrade.objects.filter(student=student).delete()
    EngagementSession.objects.filter(student=student).delete()
    
    # Add Grades (one strong, one weak)
    StudentGrade.objects.create(
        student=student,
        subject="Mathematics",
        score=95,
        max_score=100,
        grade_level="9"
    )
    StudentGrade.objects.create(
        student=student,
        subject="Physics",
        score=45,
        max_score=100,
        grade_level="9"
    )
    print("Created test grades (Math: 95%, Physics: 45%)")
    
    # Add Engagement Session
    session = EngagementSession.objects.create(
        student=student,
        subject="Mathematics",
        engagement_score=85.0,
        dominant_expression="happy"
    )
    print("Created test engagement session")

    # 3. Call the View
    factory = RequestFactory()
    data = {'student': {'id': student.id}}
    request = factory.post('/api/ai-tools/student-insights/', data, content_type='application/json')
    force_authenticate(request, user=student) # Authenticate as the student (or teacher)
    
    print("Calling student_insights_view...")
    try:
        response = student_insights_view(request)
        
        if response.status_code == 200:
            print("API Response Status: 200 OK")
            insights = response.data
            print("\nGenerated Insights:")
            print(json.dumps(insights, indent=2))
            
            # Validation
            required_fields = ['summary', 'interventionSuggestions']
            missing_fields = [f for f in required_fields if f not in insights]
            
            if missing_fields:
                print(f"Validation Failed: Missing fields {missing_fields}")
            else:
                print("Validation Passed: Response structure is correct.")
                
                # Check if Physics (weak area) is mentioned in areasForImprovement or suggestions
                content_str = str(insights).lower()
                if 'physics' in content_str:
                    print("Context Check Passed: 'Physics' found in insights.")
                else:
                    print("Context Check Warning: 'Physics' not explicitly mentioned (might be generic).")
                    
        else:
            print(f"API Failed with status {response.status_code}")
            print(response.data)
            
    except Exception as e:
        print(f"Exception during view call: {e}")

if __name__ == "__main__":
    verify_student_insights()
