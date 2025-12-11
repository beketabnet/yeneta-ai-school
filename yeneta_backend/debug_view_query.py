import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from academics.models import Curriculum

def simulate_view(region_name, grade_name):
    print(f"--- Simulating API Query for Region: {region_name}, Grade: {grade_name} ---")
    
    subjects_query = Curriculum.objects.filter(
        grade_level__name=grade_name,
        is_active=True
    )
    
    if region_name:
        subjects_query = subjects_query.filter(region__name=region_name)
        
    # APPLY THE FILTER EXACTLY AS IN VIEW
    subjects_query = subjects_query.filter(language='English')

    # Get distinct subjects
    subjects = subjects_query.values_list('subject__name', flat=True).distinct().order_by('subject__name')
    
    results = list(subjects)
    print(f"Count: {len(results)}")
    print("Subjects found:")
    for s in results:
        print(f" - {s}")

    # Check specifically for the one we know is bad
    bad_subject = 'Barnoota Hawaasaa (Social Studies)'
    if bad_subject in results:
        print(f"\n[!] FAILURE: '{bad_subject}' is present in the list!")
    else:
        print(f"\n[+] SUCCESS: '{bad_subject}' is NOT in the list.")

if __name__ == '__main__':
    simulate_view('Oromia', 'Grade 9')
