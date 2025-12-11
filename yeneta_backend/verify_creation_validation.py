import os
import django
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.exceptions import ValidationError
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from users.models import User
from rag.views import VectorStoreViewSet, ExamVectorStoreViewSet
from academics.models import Curriculum

def test_creation_validation():
    print("--- Verifying Vector Store Creation Validation ---")
    
    # Get a user
    user = User.objects.first() # Assume at least one user exists (superuser or from seed)
    if not user:
        print("No user found. Create one first.")
        return

    factory = APIRequestFactory()
    view = VectorStoreViewSet.as_view({'post': 'create'})
    exam_view = ExamVectorStoreViewSet.as_view({'post': 'create'})

    # 1. Test allowed English Subject
    print("\n1. Testing Allowed English Subject (Chemistry)...")
    # Make sure Chemistry exists as English
    chem = Curriculum.objects.filter(subject__name='Chemistry', language='English').first()
    if chem:
        print("Found English subject: Chemistry")
        file = SimpleUploadedFile("test.txt", b"dummy content", content_type="text/plain")
        data = {
            'file': file,
            'subject': 'Chemistry',
            'grade': chem.grade_level.name,
            'region': chem.region.name,
            'stream': chem.stream.name if chem.stream else 'N/A'
        }
        request = factory.post('/rag/vector-stores/', data, format='multipart')
        force_authenticate(request, user=user)
        try:
            # We treat success as passing validation. It might fail on file processing but validation is earlier.
            # Actually perform_create triggers immediately in ViewSet logic?
            # ViewSet.create() calls perform_create().
            response = view(request)
            if response.status_code == 201:
                print("SUCCESS: English subject was allowed.")
            else:
                print(f"FAILED (Unexpected): English subject rejected? Status: {response.status_code}, Data: {response.data}")
        except Exception as e:
            # Even if it fails later in processing, we want to know if VALIDATION passed.
            # If it's a validation error, it's what we look for.
            print(f"Exception during creation: {e}")
    else:
        print("Skipping Chemistry test (not found in DB)")

    # 2. Test Disallowed Amharic (Language check)
    print("\n2. Testing Disallowed Non-English Subject (Amharic)...")
    amharic = Curriculum.objects.filter(language='Amharic').first()
    if amharic:
        print(f"Found non-English subject: {amharic.subject.name} (Lang: {amharic.language})")
        file = SimpleUploadedFile("test_amharic.txt", b"dummy content", content_type="text/plain")
        data = {
            'file': file,
            'subject': amharic.subject.name,
            'grade': amharic.grade_level.name,
            'region': amharic.region.name,
            'stream': amharic.stream.name if amharic.stream else 'N/A'
        }
        request = factory.post('/rag/vector-stores/', data, format='multipart')
        force_authenticate(request, user=user)
        try:
            response = view(request)
            if response.status_code == 201:
                print(f"FAILURE: Non-English subject {amharic.subject.name} was ALLOWED! (Should be blocked)")
            elif response.status_code == 400:
                print(f"SUCCESS: Rejected with 400. Error: {response.data}")
            else:
                print(f"Result: Status {response.status_code}, Data: {response.data}")
        except ValidationError as e:
            print(f"SUCCESS: Caught Validation Error: {e}")
        except Exception as e:
             if 'restricted to English' in str(e):
                 print(f"SUCCESS: Caught Exception: {e}")
             else:
                 print(f"Caught Exception: {e}")
    else:
        print("No Amharic subject found for testing")

if __name__ == '__main__':
    test_creation_validation()
