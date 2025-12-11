
import sys
import os

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

print(f"Project root: {project_root}")
print("Starting import...")

try:
    from yeneta_backend.rag.structured_document_processor import StructuredDocumentProcessor
    print("Imported successfully")
except Exception as e:
    print(f"Import failed: {e}")
