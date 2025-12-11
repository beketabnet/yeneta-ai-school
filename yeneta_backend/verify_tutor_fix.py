import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from ai_tools.views import generate_tutor_welcome_message_view, extract_curriculum_content_view
from users.models import User

def verify_tutor_welcome():
    print("🚀 Verifying Tutor Welcome Message Generation...")
    factory = APIRequestFactory()
    user = User.objects.first() # Get a user for authentication
    
    if not user:
        print("❌ No user found to authenticate request.")
        return

    # Payload that mimics the failing scenario
    payload = {
        "grade": "Grade 7",
        "subject": "English",
        "chapter": "Chapter 3",
        "chapter_title": "Understanding Capitalization",
        "use_ethiopian_curriculum": True
    }
    
    request = factory.post('/api/ai-tools/generate-tutor-welcome/', payload, format='json')
    force_authenticate(request, user=user)
    
    try:
        response = generate_tutor_welcome_message_view(request)
        if response.status_code == 200:
            print("✅ Welcome Message Generated Successfully!")
            print(f"Message: {response.data.get('welcome_message')[:100]}...")
        else:
            print(f"❌ Failed to generate welcome message: {response.status_code} - {response.data}")
    except Exception as e:
        print(f"❌ Exception during welcome message generation: {e}")

def verify_topic_generation():
    print("\n🚀 Verifying Topic Generation (Extract Curriculum Content)...")
    factory = APIRequestFactory()
    user = User.objects.first()
    
    payload = {
        "grade_level": "Grade 7",
        "subject": "English",
        "chapter_input": "Chapter 3",
        "suggest_topic": True,
        "region": "Addis Ababa",
        "document_type": "tutor_context"
    }
    
    request = factory.post('/api/ai-tools/extract-curriculum-content/', payload, format='json')
    force_authenticate(request, user=user)
    
    try:
        response = extract_curriculum_content_view(request)
        if response.status_code == 200:
            topics = response.data.get('suggested_topics', [])
            print(f"✅ Topics Generated Successfully! Count: {len(topics)}")
            for t in topics:
                print(f" - {t}")
        else:
            print(f"❌ Failed to generate topics: {response.status_code} - {response.data}")
    except Exception as e:
        print(f"❌ Exception during topic generation: {e}")

if __name__ == "__main__":
    verify_tutor_welcome()
    verify_topic_generation()
