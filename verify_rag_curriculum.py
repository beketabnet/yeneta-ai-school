import os
import django
import sys
import traceback

# Setup Django environment
sys.path.append('D:/django_project/yeneta-ai-school/yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from academics.models import Region, GradeLevel, Stream, Subject, Curriculum
from rag.models import VectorStore
from rag.services import query_curriculum_documents
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model

def verify_rag_curriculum():
    print("Verifying RAG Curriculum Logic...")

    try:
        # 1. Create Test Data
        print("Creating test data...")
        
        User = get_user_model()
        try:
            user = User.objects.get(username="test_verifier")
        except User.DoesNotExist:
            user = User.objects.create_user(username="test_verifier", email="test_verifier@example.com", password="password123", role="Admin")

        # Region
        try:
            region = Region.objects.get(name="TestRegion")
        except Region.DoesNotExist:
            region = Region.objects.create(name="TestRegion", code="TR_TEST")
            
        # Grade
        try:
            grade = GradeLevel.objects.get(name="Grade 11")
        except GradeLevel.DoesNotExist:
            grade = GradeLevel.objects.create(name="Grade 11")

        # Stream
        try:
            stream = Stream.objects.get(name="Natural Science")
        except Stream.DoesNotExist:
            stream = Stream.objects.create(name="Natural Science")

        # Subject
        try:
            subject = Subject.objects.get(name="Physics")
        except Subject.DoesNotExist:
            subject = Subject.objects.create(name="Physics")
        
        # Ensure Curriculum exists
        Curriculum.objects.get_or_create(
            region=region,
            grade_level=grade,
            stream=stream,
            subject=subject
        )

        # 2. Create a Dummy VectorStore
        # We need a dummy file
        dummy_file = SimpleUploadedFile("test.txt", b"dummy content")
        
        vs, created = VectorStore.objects.get_or_create(
            region=region.name,
            grade=grade.name,
            stream=stream.name,
            subject=subject.name,
            defaults={
                'file': dummy_file,
                'status': 'Active',
                'file_name': 'test.txt',
                'created_by': user
            }
        )
        if not created:
            vs.status = 'Active'
            vs.created_by = user
            vs.save()

        print(f"Created/Found VectorStore: ID={vs.id}, Region={vs.region}, Grade={vs.grade}, Stream={vs.stream}, Subject={vs.subject}")

        # 3. Test query_curriculum_documents
        print("\nTesting query_curriculum_documents with matching filters...")
        
        results = query_curriculum_documents(
            grade="Grade 11",
            subject="Physics",
            query="test query",
            region="TestRegion",
            stream="Natural Science"
        )
        print(f"Query executed successfully. Found {len(results)} results (might be 0 if no ChromaDB).")

        # 4. Test with non-matching region
        print("\nTesting query_curriculum_documents with NON-matching region...")
        
        results_bad = query_curriculum_documents(
            grade="Grade 11",
            subject="Physics",
            query="test query",
            region="OtherRegion", # Should not find our test store
            stream="Natural Science"
        )
        print(f"Query executed successfully. Found {len(results_bad)} results.")

        # 5. Test get_subjects_for_grade from curriculum_config
        print("\nTesting get_subjects_for_grade from curriculum_config...")
        from rag.curriculum_config import get_subjects_for_grade
        
        subjects = get_subjects_for_grade(grade="Grade 11", stream="Natural Science", region="TestRegion")
        print(f"Subjects found for Grade 11 Natural Science in TestRegion: {subjects}")
        
        if "Physics" in subjects:
            print("✅ 'Physics' correctly found in subjects list.")
        else:
            print("❌ 'Physics' NOT found in subjects list.")

        # Cleanup
        print("\nCleaning up test data...")
        vs.delete()
        if region.name == "TestRegion":
            region.delete()
        
        print("Verification complete.")

    except Exception as e:
        print(f"Verification failed with error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    verify_rag_curriculum()
