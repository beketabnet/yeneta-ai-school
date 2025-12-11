import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

# Use the credentials from previous scripts or assume authentication is handled via session/token if needed.
# For simplicity, we'll assume a development environment or use a token if I can find one.
# Wait, previous verification scripts accessed DB directly. For backend view test, I need to make an API call.
# I can use `requests` but I need to be authenticated.
# Alternatively, I can use the Django test client or call the view directly in a script.

import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from ai_tools.views import extract_curriculum_content_view
from users.models import User

def test_extraction():
    print("Testing extraction with adjusted prompt...")
    
    factory = APIRequestFactory()
    
    # Get a teacher user
    user = User.objects.filter(role='teacher').first()
    if not user:
        print("No teacher user found, creating one dummy")
        user = User.objects.create(username='test_teacher', role='teacher')
    
    # Data that caused the issue
    # "Curriculum-Based Rubric Generator (RAG)" mode ON
    # We need to ensure there is a vector store for this, or mock the RAG retrieval.
    # The error happened AFTER RAG context was retrieved (implied by "Gemini returned no content").
    
    # We can try to invoke the view.
    # But wait, without actual RAG documents, it might return "No documents found".
    # I need to simulate a case where RAG returns content.
    
    # Actually, the user's log says "No active vector stores found..." then eventually error.
    # Wait, if "No active vector stores found", then `extract_curriculum_content_view`
    # calls `query_curriculum_documents`.
    # If `documents` is empty, it returns early with "No curriculum content found".
    # So the user MUST have hit a case where documents WERE found.
    # Re-reading user log:
    # [06/Dec/2025 02:08:44] "GET /api/academics/curriculum/?region=Oromia&grade=Grade+8 HTTP/1.1" 200 6805
    # Then some "No active vector stores found for Grade 7 - English"
    # Then "POST /api/ai-tools/extract-chapters/" -> Non-recoverable error.
    
    # Wait, the error was in `extract-curriculum-content` according to user request:
    # "I have gor a response generation slow back while Exracting Content from Curriculum... Review terminal.md"
    # Terminal.md shows:
    # [06/Dec/2025 02:11:17] "POST /api/ai-tools/extract-curriculum-content/ HTTP/1.1" 200 1398
    # But before that: "Non-recoverable error with gemini... Finish reason: 2"
    
    # To verify, I should try to call the prompt generator directly with a large context and see if it fails.
    # Calling the LLM service directly is easier than setting up the full HTTP request with RAG state.
    
    from ai_tools.llm.llm_service import llm_service
    from ai_tools.llm.models import LLMRequest, TaskType, LLMModel
    from ai_tools.chapter_assistant_enhancer import ChapterAssistantEnhancer
    
    # Create a large dummy context to simulate a full chapter
    dummy_context = "This is a dummy chapter context. " * 500 # Not huge but enough to test basic flow
    
    # Build prompt using the new function
    prompt = ChapterAssistantEnhancer.format_extraction_prompt(
        grade="Grade 8",
        subject="English",
        chapter="Chapter 1",
        chapter_info={'number': '1'},
        rag_context=dummy_context,
        has_full_chapter=True,
        has_explicit_objectives=True
    )
    
    print(f"Prompt length: {len(prompt)}")
    
    request = LLMRequest(
        prompt=prompt,
        user_id=user.id,
        user_role=user.role,
        task_type=TaskType.LESSON_PLANNING,
        max_tokens=2000,
        metadata={'preferred_model': LLMModel.GEMINI_FLASH} 
    )
    
    print("Sending request to Gemini...")
    output_log = []
    try:
        response = llm_service.generate(request)
        if response.success:
            succ_msg = "✅ Generation SUCCESS!"
            print(succ_msg)
            output_log.append(succ_msg)
            content_preview = f"Part of content: {response.content[:200]}..."
            print(content_preview)
            output_log.append(content_preview)
        else:
            fail_msg = f"❌ Generation FAILED: {response.error_message}"
            print(fail_msg)
            output_log.append(fail_msg)
            if "Finish reason" in response.error_message:
                output_log.append("Captured Finish Reason correctly.")
    except Exception as e:
        err_msg = f"❌ Exception caught: {e}"
        print(err_msg)
        output_log.append(err_msg)
        
    with open('verification_result.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_log))


if __name__ == '__main__':
    test_extraction()
