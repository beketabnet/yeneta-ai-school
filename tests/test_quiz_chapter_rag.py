
import os
import sys
import django
from django.conf import settings
from unittest.mock import MagicMock, patch

# Setup Django environment
sys.path.append('D:/django_project/yeneta-ai-school/yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from academics.views_quiz import generate_quiz_view

def test_chapter_aware_quiz_generation():
    factory = APIRequestFactory()
    
    # Mock data
    request_data = {
        'topic': 'Chapter 3: ROAD SAFETY',
        'subject': 'English',
        'grade_level': 7,
        'use_rag': True,
        'quiz_type': 'Quiz',
        'num_questions': 5
    }
    
    request = factory.post('/api/generate-quiz/', request_data, format='json')
    
    # Mock User
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User(username='testteacher', email='test@example.com', role='Teacher')
    request.user = user
    
    # Mock Dependencies
    with patch('rag.chapter_aware_rag.ChapterBoundaryDetector') as MockDetector, \
         patch('rag.chapter_aware_rag.ChapterContentExtractor') as MockExtractor, \
         patch('academics.views_quiz.LLMService') as MockLLMService, \
         patch('academics.views_quiz.QuizGeneratorRAGEnhancer') as MockEnhancer, \
         patch('academics.views_quiz.TutorRAGEnhancer') as MockTutorEnhancer, \
         patch('ai_tools.llm.rag_service.rag_service') as MockRAGService, \
         patch('ai_tools.llm.vector_store.vector_store') as MockVectorStore:
         
        # Setup Mocks
        MockDetector.detect_chapter_number.return_value = 3
        
        mock_extractor_instance = MockExtractor.return_value
        mock_extractor_instance.extract_chapter_content.return_value = {
            'success': True,
            'content': "Full content of Chapter 3...",
            'total_chunks': 5
        }
        
        mock_llm_instance = MockLLMService.return_value
        mock_llm_instance.generate_json.return_value = {
            'title': 'Chapter 3 Quiz',
            'questions': []
        }
        
        MockVectorStore.client = MagicMock()
        
        # Execute View
        response = generate_quiz_view(request)
        
        # Assertions
        print("Response Status:", response.status_code)
        print("Response Data:", response.data)
        
        # Verify Chapter Detection
        MockDetector.detect_chapter_number.assert_called_with('Chapter 3: The Mystery')
        print("✅ Chapter Detected")
        
        # Verify Extraction
        mock_extractor_instance.extract_chapter_content.assert_called()
        print("✅ Chapter Content Extracted")
        
        # Verify LLM Call contains full content AND new instructions
        call_args = mock_llm_instance.generate_json.call_args[0][0]
        
        if "=== COMPLETE CHAPTER 3 CONTENT ===" in call_args:
            print("✅ Full Chapter Content passed to LLM")
        else:
            print("❌ Full Chapter Content NOT passed to LLM")
            
        if "You are an expert Ethiopian Curriculum Developer" in call_args:
            print("✅ New Expert Role Prompt Used")
        else:
            print("❌ New Expert Role Prompt NOT Used")
            
        if "NO External Knowledge" in call_args:
            print("✅ 'NO External Knowledge' constraint present")
        else:
            print("❌ 'NO External Knowledge' constraint MISSING")

def test_smart_token_handling():
    """Test that content is truncated when exceeding token limit."""
    from rag.chapter_aware_rag import ChapterContentExtractor
    from unittest.mock import MagicMock, patch
    
    # Create a mock token counter
    with patch('ai_tools.llm.token_counter.token_counter') as mock_counter:
        # Setup mock to return high token count
        mock_counter.count_tokens.return_value = 20000 # Exceeds 15000 limit
        
        extractor = ChapterContentExtractor(chroma_client=MagicMock())
        
        # Mock collection query results
        # Create 20 chunks
        documents = [f"Chunk {i}" for i in range(20)]
        metadatas = [{'page': i, 'chapter_title': 'Test Chapter'} for i in range(20)]
        
        extractor.chroma_client.get_collection.return_value.get.return_value = {
            'documents': documents,
            'metadatas': metadatas
        }
        
        # Execute
        result = extractor.extract_chapter_content("test_collection", 1)
        
        # Verify
        if result['truncated']:
            print("✅ Smart Truncation Active: Content marked as truncated")
        else:
            print("❌ Smart Truncation Failed: Content not marked as truncated")
            
        if "[...Content Truncated for Length...]" in result['content']:
            print("✅ Truncation Markers Present")
        else:
            print("❌ Truncation Markers Missing")

if __name__ == "__main__":
    print("🚀 Starting Test Script...", flush=True)
    try:
        test_chapter_aware_quiz_generation()
        print("\n--- Testing Smart Token Handling ---", flush=True)
        test_smart_token_handling()
    except Exception as e:
        print(f"💥 Test Script Crashed: {e}", flush=True)
        import traceback
        traceback.print_exc()
