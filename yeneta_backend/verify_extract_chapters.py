
import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from rag.services import get_available_chapters
from rag.services import get_available_chapters
from django.apps import apps

def verify_extract_chapters():
    print("🚀 Starting Extract Chapters Verification...")
    
    VectorStore = apps.get_model('rag', 'VectorStore')
    
    # Use a known vector store (e.g., ID 3 which we fixed earlier)
    try:
        vs = VectorStore.objects.get(id=3)
        print(f"✅ Found Vector Store ID 3: {vs.subject} {vs.grade} ({vs.region})")
        
        print("\n📚 Extracting chapters...")
        chapters = get_available_chapters(
            grade=vs.grade,
            subject=vs.subject,
            region=vs.region,
            stream=vs.stream
        )
        
        if chapters:
            print(f"✅ Successfully extracted {len(chapters)} chapters:")
            for chapter in chapters:
                label = chapter.get('label', 'Chapter')
                print(f"   - {label} {chapter.get('number')}: {chapter.get('title')}")
        else:
            print("⚠️ No chapters extracted. This might be due to missing TOC in the document or LLM failure.")
            
    except VectorStore.DoesNotExist:
        print("❌ Vector Store ID 3 not found. Please check your database.")
    except Exception as e:
        print(f"❌ Error during verification: {e}")

if __name__ == "__main__":
    verify_extract_chapters()
