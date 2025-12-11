import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from rag.models import VectorStore
from rag.services import query_curriculum_documents
import chromadb
from chromadb.config import Settings as ChromaSettings

def verify_deep_scan():
    print("🚀 Starting Deep Scan Verification...")
    
    # Parameters from the failing case
    grade = "Grade 7"
    subject = "English"
    region = "Addis Ababa"
    chapter_input = "Chapter 3"
    
    print(f"🔍 Searching for: {grade} - {subject} ({region})")
    
    # 1. Check Vector Stores
    stores = VectorStore.objects.filter(
        grade=grade,
        subject=subject,
        region=region,
        status='Active'
    )
    
    print(f"📊 Found {stores.count()} active vector stores.")
    
    for vs in stores:
        print(f"\n📂 Vector Store ID: {vs.id}")
        print(f"   Path: {vs.vector_store_path}")
        print(f"   Exists: {os.path.exists(vs.vector_store_path)}")
        
        if not os.path.exists(vs.vector_store_path):
            print("   ❌ Path does not exist!")
            # Try reconstruction logic
            reconstructed_path = os.path.join(
                settings.MEDIA_ROOT,
                'vector_stores',
                vs.region.replace(' ', '_'),
                f'Grade_{vs.grade.replace("Grade ", "").replace(" ", "_")}',
                f'Subject_{vs.subject}',
                f'store_{vs.id}'
            )
            print(f"   🔄 Reconstructed Path: {reconstructed_path}")
            print(f"   Reconstructed Exists: {os.path.exists(reconstructed_path)}")
            if os.path.exists(reconstructed_path):
                print("   ✅ Reconstruction would fix this.")
            continue

        # 2. Inspect ChromaDB Content
        try:
            client = chromadb.PersistentClient(path=vs.vector_store_path, settings=ChromaSettings(anonymized_telemetry=False))
            collection_name = f"curriculum_{grade.replace(' ', '_').lower()}_{subject.replace(' ', '_').lower()}"
            print(f"   📚 Collection Name: {collection_name}")
            
            try:
                collection = client.get_collection(name=collection_name)
                count = collection.count()
                print(f"   📄 Document Count: {count}")
                
                # Peek at metadata
                peek = collection.peek(limit=5)
                if peek and 'metadatas' in peek:
                    print("   🧐 Sample Metadata:")
                    for meta in peek['metadatas']:
                        print(f"      - {meta}")
                        
                # 3. Test Query with Chapter Filter
                print(f"\n   🧪 Testing Query with Chapter Filter: '{chapter_input}'")
                results = query_curriculum_documents(
                    grade=grade,
                    subject=subject,
                    query="main topics objectives",
                    region=region,
                    chapter="3", # Explicitly testing "3"
                    top_k=3
                )
                print(f"   🎯 Results with '3': {len(results)}")
                
                if not results:
                     print(f"   🧪 Testing Query WITHOUT Chapter Filter")
                     results_loose = query_curriculum_documents(
                        grade=grade,
                        subject=subject,
                        query=f"{chapter_input} main topics objectives",
                        region=region,
                        chapter=None,
                        top_k=3
                    )
                     print(f"   🎯 Results loose: {len(results_loose)}")

            except Exception as e:
                print(f"   ❌ Error accessing collection: {e}")
                
        except Exception as e:
            print(f"   ❌ Error initializing ChromaDB: {e}")

if __name__ == "__main__":
    verify_deep_scan()
