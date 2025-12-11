
import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from rag.models import VectorStore

def check_vector_stores():
    print("Checking Vector Stores...")
    stores = VectorStore.objects.all()
    for store in stores:
        print(f"ID: {store.id}, Grade: {store.grade}, Subject: {store.subject}, Region: {store.region}")
        print(f"  Path: {store.vector_store_path}")
        if store.vector_store_path:
            exists = os.path.exists(store.vector_store_path)
            print(f"  Exists: {exists}")
            if not exists:
                print("  ❌ Path does not exist!")
        else:
            print("  ❌ Path is empty!")
        print("-" * 20)

if __name__ == "__main__":
    check_vector_stores()
