import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from academics.models import Curriculum, Region

def investigate():
    try:
        oromia = Region.objects.filter(name='Oromia').first()
        if not oromia:
            print("Oromia region not found")
            return

        print(f"Found Oromia region: {oromia}")
        
        # Get all curriculums in Oromia
        oromia_curriculums = Curriculum.objects.filter(region=oromia)
        count = oromia_curriculums.count()
        print(f"Total curriculums in Oromia: {count}")

        # List all distinct subject names to identify patterns
        print("\nAll Unique Subject Names in Oromia:")
        subjects = oromia_curriculums.values_list('subject__name', flat=True).distinct().order_by('subject__name')
        for s in subjects:
            print(f" - {s}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    investigate()
