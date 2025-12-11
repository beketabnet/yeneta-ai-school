
import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from rag.services import query_curriculum_documents
from rag.models import VectorStore

def verify_fix():
    print("Verifying RAG Fix...")
    
    # Check Vector Store 3
    try:
        vs = VectorStore.objects.get(id=3)
        print(f"Checking Vector Store 3: {vs.grade} {vs.subject} ({vs.region})")
        print(f"Current Path: {vs.vector_store_path}")
        print(f"Exists: {os.path.exists(vs.vector_store_path) if vs.vector_store_path else False}")
        
        # Trigger query to update path
        print("\nTriggering query_curriculum_documents...")
        docs = query_curriculum_documents(
            grade=vs.grade,
            subject=vs.subject,
            query="test query",
            region=vs.region,
            top_k=1
        )
        
        # Check path again
        vs.refresh_from_db()
        print(f"\nUpdated Path: {vs.vector_store_path}")
        print(f"Exists: {os.path.exists(vs.vector_store_path)}")
        
        if docs:
            print(f"✅ Successfully retrieved {len(docs)} documents")
        else:
            print("⚠️ No documents retrieved (might be empty store or query mismatch)")
            
    except VectorStore.DoesNotExist:
        print("❌ Vector Store 3 not found in DB")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verify_fix()
