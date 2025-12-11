import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'yeneta_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from rag.models import VectorStore
from django.conf import settings

try:
    vs = VectorStore.objects.get(id=3)
    print(f"VectorStore ID: {vs.id}")
    print(f"File Name: {vs.file_name}")
    print(f"File Path: {vs.file.path if vs.file else 'None'}")
    print(f"File Exists: {os.path.exists(vs.file.path) if vs.file else 'N/A'}")
    print(f"Vector Store Path: {vs.vector_store_path}")
    print(f"Vector Store Path Exists: {os.path.exists(vs.vector_store_path) if vs.vector_store_path else 'N/A'}")
    print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
except VectorStore.DoesNotExist:
    print("VectorStore 3 does not exist.")
