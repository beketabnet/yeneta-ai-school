"""
Quick test script to verify RAG setup
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from ai_tools.llm import embedding_service, document_processor, vector_store

print("=" * 60)
print("RAG SYSTEM TEST")
print("=" * 60)

# Test 1: Embedding Service
print("\n1. Testing Embedding Service...")
try:
    test_text = "This is a test sentence for embedding generation."
    embedding = embedding_service.embed_text(test_text)
    
    if embedding:
        print(f"   ✅ Embedding generated: {len(embedding)} dimensions")
        print(f"   Model: {embedding_service.embedding_model}")
    else:
        print("   ❌ Failed to generate embedding")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Document Processor
print("\n2. Testing Document Processor...")
try:
    test_file = "media/curriculum_docs/KIRA-Research.md"
    if os.path.exists(test_file):
        chunks = document_processor.process_file(test_file)
        print(f"   ✅ Processed file: {len(chunks)} chunks generated")
        if chunks:
            print(f"   First chunk preview: {chunks[0].text[:100]}...")
    else:
        print(f"   ⚠️  File not found: {test_file}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Vector Store
print("\n3. Testing Vector Store...")
try:
    stats = vector_store.get_stats()
    print(f"   Collection: {stats['collection_name']}")
    print(f"   Total chunks: {stats['total_chunks']}")
    print(f"   Status: {stats['status']}")
    print(f"   Storage: {stats['persist_directory']}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
