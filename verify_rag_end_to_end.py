import os
import django
import json
import sys
from unittest.mock import patch, MagicMock

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'yeneta_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
os.environ['OPENAI_API_KEY'] = 'dummy-key'  # Set dummy key to avoid import errors

django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from academics.models import Region, GradeLevel, Stream, Subject, Curriculum
from rag.models import VectorStore

# Import views AFTER setup
from ai_tools import views
from ai_tools.views import lesson_planner_view, generate_teacher_note_view
# Try importing generate_quiz_view from academics
try:
    from academics.views_quiz import generate_quiz_view
except ImportError:
    print("Could not import generate_quiz_view from academics.views_quiz, trying ai_tools.views")
    try:
        from ai_tools.views import generate_quiz_view
    except ImportError:
        print("Could not import generate_quiz_view. Quiz verification will fail.")
        generate_quiz_view = None

User = get_user_model()

def run_verification():
    print("Starting End-to-End RAG Verification...")

    # Mock LLM response
    dummy_json_response = {
        "title": "Test Lesson",
        "grade": "Grade 11",
        "subject": "Biology",
        "topic": "Cell Biology",
        "duration": 45,
        "objectives": ["Understand cell structure"],
        "materials": ["Textbook"],
        "activities": [],
        "fiveESequence": [],
        "differentiationStrategies": [],
        "assessmentPlan": {},
        "homework": "Read chapter 5"
    }

    # Patch the process_json_request method on the llm_router instance in views
    # This is crucial because views.py has already imported llm_router
    print("Patching llm_router.process_json_request...")
    with patch.object(views.llm_router, 'process_json_request', return_value=dummy_json_response) as mock_process:
        print("Mock applied.")
        
        # 1. Setup Data
        print("\n1. Setting up test data...")
        user, _ = User.objects.get_or_create(username='testuser', email='test@example.com', defaults={'password': 'password'})
        
        region, _ = Region.objects.get_or_create(name='Addis Ababa', defaults={'code': 'AA'})
        grade, _ = GradeLevel.objects.get_or_create(name='Grade 12', defaults={'code': '12'})
        stream, _ = Stream.objects.get_or_create(name='Natural Science', defaults={'code': 'NS'})
        subject, _ = Subject.objects.get_or_create(name='Physics', defaults={'code': 'PHY'})
        
        # Ensure Curriculum exists
        Curriculum.objects.get_or_create(
            region=region,
            grade_level=grade,
            stream=stream,
            subject=subject,
            is_active=True
        )

        # Create a dummy VectorStore if not exists
        vs, created = VectorStore.objects.get_or_create(
            file_name="physics_grade_12_test.pdf",
            defaults={
                'region': 'Addis Ababa',
                'grade': 'Grade 12',
                'stream': 'Natural Science',
                'subject': 'Physics',
                'status': 'Active',
                'chunk_count': 10,
                'created_by': user
            }
        )
        if created:
            print("Created dummy VectorStore.")
        else:
            print("Using existing VectorStore.")

        factory = APIRequestFactory()

        # 2. Verify Lesson Planner with RAG
        print("\n--- Verifying Lesson Planner with RAG ---")
        data = {
            "topic": "Cell Biology",
            "gradeLevel": "Grade 11",
            "subject": "Biology",
            "useRAG": True,
            "objectives": ["Understand cell structure"]
        }
        request = factory.post('/api/ai-tools/lesson-planner/', data, format='json')
        force_authenticate(request, user=user)
        
        try:
            response = lesson_planner_view(request)
            print(f"Lesson Planner Response Status: {response.status_code}")
            if response.status_code == 200:
                print("Lesson Planner Output:", json.dumps(response.data, indent=2)[:200] + "...")
                if mock_process.called:
                    print("✅ LLM Router was called.")
                else:
                    print("❌ LLM Router was NOT called.")
            else:
                print("Error:", response.data)
        except Exception as e:
            print(f"❌ Exception in Lesson Planner: {e}")
            import traceback
            traceback.print_exc()

        # 3. Verify Quiz Generation with RAG
        print("\n--- Verifying Quiz Generation with RAG ---")
        if generate_quiz_view:
            quiz_data = {
                "topic": "Cell Biology",
                "grade_level": "Grade 11",
                "subject": "Biology",
                "use_rag": True,
                "num_questions": 5,
                "question_type": "multiple_choice"
            }
            request = factory.post('/api/academics/generate-quiz/', quiz_data, format='json')
            force_authenticate(request, user=user)
            
            try:
                response = generate_quiz_view(request)
                print(f"Quiz Gen Response Status: {response.status_code}")
                if response.status_code == 200:
                     print("Quiz Gen Output:", json.dumps(response.data, indent=2)[:200] + "...")
                else:
                     print("Error:", response.data)
            except Exception as e:
                print(f"❌ Exception in Quiz Gen: {e}")
                traceback.print_exc()
        else:
            print("Skipping Quiz Verification (View not found)")

        # 4. Verify Teacher Note Generation
        print("\n--- Verifying Teacher Note Generation ---")
        note_data = {
            "lessonPlan": {
                "topic": "Cell Biology",
                "grade": "Grade 11",
                "subject": "Biology",
                "objectives": ["Understand cell structure"],
                "duration": 45
            },
            "useRAG": True,
            "region": "Addis Ababa"
        }
        request = factory.post('/api/ai-tools/generate-teacher-note/', note_data, format='json')
        force_authenticate(request, user=user)
        
        try:
            response = generate_teacher_note_view(request)
            print(f"Teacher Note Response Status: {response.status_code}")
            if response.status_code == 200:
                print("Teacher Note Output:", json.dumps(response.data, indent=2)[:200] + "...")
            else:
                print("Error:", response.data)
        except Exception as e:
             print(f"❌ Exception in Teacher Note: {e}")
             traceback.print_exc()

if __name__ == "__main__":
    run_verification()
