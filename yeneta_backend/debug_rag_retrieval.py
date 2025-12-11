
import os
import django
import sys

# Setup Django environment
sys.path.append('D:\\django_project\\yeneta-ai-school\\yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from rag.services import query_curriculum_documents
from ai_tools.chapter_utils import normalize_chapter_input

def debug_rag_retrieval():
    grade = "Grade 7"
    subject = "English"
    
    print(f"--- Debugging RAG Content for {grade} {subject} ---")
    
    # Query for "Road Safety"
    print("\n1. Searching for 'Road Safety'...")
    docs_safety = query_curriculum_documents(
        grade=grade,
        subject=subject,
        query="Road Safety",
        top_k=5
    )
    for i, doc in enumerate(docs_safety):
        meta = doc.get('metadata', {})
        print(f"  Result {i+1}: Chapter {meta.get('chapter', '?')} - {doc.get('source', '?')}")
        print(f"  Snippet: {doc.get('content', '')[:100]}...")

    # Query for "Preferences"
    print("\n2. Searching for 'Talking about Preferences'...")
    docs_pref = query_curriculum_documents(
        grade=grade,
        subject=subject,
        query="Talking about Preferences",
        top_k=5
    )
    for i, doc in enumerate(docs_pref):
        meta = doc.get('metadata', {})
        print(f"  Result {i+1}: Chapter {meta.get('chapter', '?')} - {doc.get('source', '?')}")
        print(f"  Snippet: {doc.get('content', '')[:100]}...")

    # Test Semantic Search for Table of Contents
    print("\n7. Testing Semantic Search for 'Table of Contents'...")
    docs_toc = query_curriculum_documents(
        grade=grade,
        subject=subject,
        query="Table of Contents",
        top_k=5,
        extract_full_chapter=False
    )
    for i, doc in enumerate(docs_toc):
        print(f"  Result {i+1}: Chapter {doc.get('metadata', {}).get('chapter', '?')} - Title: {doc.get('title', '?')}")
        print(f"  Snippet: {doc.get('content', '')[:200]}...")

if __name__ == "__main__":
    debug_rag_retrieval()
