import os
import sys
import django
from unittest.mock import MagicMock, patch

# Setup Django environment
sys.path.append('d:\\django_project\\yeneta-ai-school')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_ai_school.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from yeneta_backend.academics.views_quiz import generate_quiz_view
from ai_tools.llm.llm_service import LLMService

def test_quiz_timer_integration():
    print("🧪 Testing Quiz Timer Integration...")
    
    # Mock LLMService
    mock_llm_service = MagicMock()
    mock_llm_service.generate_json.return_value = {
        "title": "Test Quiz",
        "questions": []
    }
    
    # Patch the LLMService class to return our mock
    with patch('yeneta_backend.academics.views_quiz.LLMService', return_value=mock_llm_service):
        
        factory = APIRequestFactory()
        
        # Test Case 1: Custom Time Limit (120s)
        print("\n1️⃣  Testing Custom Time Limit (120s)...")
        request = factory.post('/api/academics/generate-quiz/', {
            'subject': 'Physics',
            'grade_level': 'Grade 11',
            'topic': 'Kinematics',
            'time_limit': 120,
            'use_rag': False
        }, format='json')
        
        response = generate_quiz_view(request)
        
        # Verify prompt contains time_limit: 120
        call_args = mock_llm_service.generate_json.call_args
        prompt = call_args[0][0]
        
        if '"time_limit": 120' in prompt:
            print("✅ Success: Prompt contains 'time_limit': 120")
        else:
            print("❌ Failure: Prompt missing 'time_limit': 120")
            print("Prompt snippet:", prompt[-500:])
            
        # Test Case 2: Default Time Limit (60s)
        print("\n2️⃣  Testing Default Time Limit (missing param)...")
        request = factory.post('/api/academics/generate-quiz/', {
            'subject': 'Physics',
            'grade_level': 'Grade 11',
            'topic': 'Kinematics',
            # No time_limit provided
            'use_rag': False
        }, format='json')
        
        response = generate_quiz_view(request)
        
        # Verify prompt contains time_limit: 60
        call_args = mock_llm_service.generate_json.call_args
        prompt = call_args[0][0]
        
        if '"time_limit": 60' in prompt:
            print("✅ Success: Prompt contains default 'time_limit': 60")
        else:
            print("❌ Failure: Prompt missing default 'time_limit': 60")
            print("Prompt snippet:", prompt[-500:])

if __name__ == "__main__":
    test_quiz_timer_integration()
