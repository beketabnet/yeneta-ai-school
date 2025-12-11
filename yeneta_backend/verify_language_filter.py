import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from academics.models import Curriculum, Subject, GradeLevel, Region, Stream
from rest_framework.test import APIRequestFactory
from rag.views import get_curriculum_config

def verify_language_filtering():
    print("--- Verifying Language Filtering ---")

    # 1. Check existing curriculums
    print("\n1. Checking existing Curriculum entries defaults...")
    existing_count = Curriculum.objects.count()
    english_count = Curriculum.objects.filter(language='English').count()
    print(f"Total Curriculum objects: {existing_count}")
    print(f"English Curriculum objects: {english_count}")
    
    if existing_count == english_count:
        print("PASS: All existing objects defaulted to English.")
    else:
        print(f"FAIL: {existing_count - english_count} objects are not English.")

    # 2. Add a non-English curriculum
    print("\n2. Adding a test Amharic curriculum entry...")
    
    # Get or create dependencies
    region, _ = Region.objects.get_or_create(name='Addis Ababa', defaults={'code': 'AA'})
    grade, _ = GradeLevel.objects.get_or_create(name='Grade 9', defaults={'order': 9})
    # Create a unique subject name to avoid conflicts if re-running
    subject_name = 'Amharic History Test'
    subject, _ = Subject.objects.get_or_create(name=subject_name, defaults={'code': 'AMH-HIST'})
    
    # Delete if exists to start fresh
    Curriculum.objects.filter(subject=subject, grade_level=grade, region=region).delete()

    amharic_curr = Curriculum.objects.create(
        region=region,
        grade_level=grade,
        subject=subject,
        language='Amharic'
    )
    print(f"Created Curriculum: {amharic_curr}")

    # 3. Test get_curriculum_config view logic
    print("\n3. Testing get_curriculum_config view filtering...")
    factory = APIRequestFactory()
    
    # Simulate request for Grade 9 in Addis Ababa
    request = factory.get('/rag/curriculum-config/', {'grade': 'Grade 9', 'region': 'Addis Ababa'})
    
    response = get_curriculum_config(request)
    
    if response.status_code == 200:
        data = response.data
        subjects_list = data.get('subjects', [])
        print(f"Subjects returned: {subjects_list}")
        
        if subject_name in subjects_list:
            print(f"FAIL: '{subject_name}' (Amharic) was returned in the list!")
        else:
            print(f"PASS: '{subject_name}' (Amharic) was correctly filtered out.")
            
        # Verify normal English subjects are still there
        # Assuming there is at least one other subject for Grade 9 AA
        if len(subjects_list) > 0:
            print(f"PASS: English subjects are present ({len(subjects_list)} found).")
        else:
            print("WARNING: No English subjects found. Make sure Grade 9 AA has English subjects.")
            
    else:
        print(f"FAIL: API returned status {response.status_code}")

    # Cleanup
    print("\nCleaning up test data...")
    amharic_curr.delete()
    # We keep the subject/region/grade as they might be used elsewhere or are generic
    # actually better to just leave the subject created as a test artifact or delete it
    if subject.name == 'Amharic History Test':
        subject.delete()

    print("\nDone.")

if __name__ == '__main__':
    verify_language_filtering()
