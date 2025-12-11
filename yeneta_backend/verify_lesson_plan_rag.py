import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from ai_tools.views import lesson_planner_view
from users.models import User

def verify_lesson_plan_rag():
    print("🚀 Verifying Lesson Planner RAG Context Extraction...")
    factory = APIRequestFactory()
    user = User.objects.first()
    
    if not user:
        print("❌ No user found to authenticate request.")
        return

    # Payload mimicking the frontend request with explicit region and chapter
    payload = {
        "topic": "Reading Comprehension",
        "gradeLevel": "Grade 7",
        "subject": "English",
        "objectives": "Students will analyze the main idea of the text.",
        "duration": 45,
        "useRAG": True,
        "region": "Addis Ababa", # Explicit geographic region
        "chapter": "Chapter 3", # Explicit chapter
        "localContext": {
            "region": "Urban" # Community context
        }
    }
    
    print(f"📝 Request Payload: {payload}")
    
    request = factory.post('/api/ai-tools/lesson-planner/', payload, format='json')
    force_authenticate(request, user=user)
    
    try:
        # We expect the view to log "Retrieved X curriculum documents" and "Using explicit chapter for RAG: Chapter 3"
        # Since we can't easily capture logs here without mocking, we'll check the response structure
        # or rely on the console output if we run this script.
        
        response = lesson_planner_view(request)
        
        if response.status_code == 200:
            print("✅ Lesson Plan Generated Successfully!")
            plan = response.data
            print(f"Title: {plan.get('title')}")
            
            # Check if RAG context was used (indirectly)
            # Ideally, the plan content should reflect the chapter content.
            # But for verification, success 200 is a good start, and we should watch the console logs for "Retrieved X documents".
            
        else:
            print(f"❌ Failed to generate lesson plan: {response.status_code} - {response.data}")
            
    except Exception as e:
        print(f"❌ Exception during lesson generation: {e}")

if __name__ == "__main__":
    verify_lesson_plan_rag()
