"""
Test document indexing directly
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from ai_tools.llm import document_processor, vector_store, embedding_service

print("Testing document indexing...\n")

# Process document
file_path = "media/curriculum_docs/KIRA-Research.md"
print(f"Processing: {file_path}")
chunks = document_processor.process_file(file_path)
print(f"Generated {len(chunks)} chunks\n")

if chunks:
    # Take first 3 chunks for testing
    test_chunks = chunks[:3]
    print(f"Testing with {len(test_chunks)} chunks...")
    
    # Try to add them
    try:
        added = vector_store.add_documents(test_chunks, batch_size=10)
        print(f"✅ Successfully added {added} chunks")
        
        # Check stats
        stats = vector_store.get_stats()
        print(f"Total chunks in store: {stats['total_chunks']}")
        
        # Try a search
        if added > 0:
            print("\nTesting search...")
            results = vector_store.search("Ethiopian education", n_results=2)
            print(f"Found {len(results)} results")
            if results:
                print(f"Top result: {results[0]['text'][:100]}...")
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
