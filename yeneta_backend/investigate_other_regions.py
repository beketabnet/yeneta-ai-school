import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from academics.models import Curriculum, Region

def investigate_regions():
    target_regions = ['Tigray', 'Somali', 'Amhara', 'SNNPR', 'Sidama', 'Afar']
    
    for region_name in target_regions:
        print(f"\n--- Investigating Region: {region_name} ---")
        try:
            region = Region.objects.filter(name=region_name).first()
            if not region:
                print(f"Region '{region_name}' not found in DB")
                continue

            count = Curriculum.objects.filter(region=region).count()
            print(f"Total curriculums: {count}")
            
            if count > 0:
                print("Sample distinct subject names:")
                subjects = Curriculum.objects.filter(region=region).values_list('subject__name', flat=True).distinct().order_by('subject__name')
                for s in subjects:
                    print(f" - {s}")
            else:
                print("No curriculums found.")
                
        except Exception as e:
            print(f"Error checking {region_name}: {e}")

if __name__ == '__main__':
    investigate_regions()
