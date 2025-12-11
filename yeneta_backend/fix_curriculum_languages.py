from academics.models import Curriculum
from django.db.models import Q

def fix_languages():
    print("Starting smart language correction...")
    
    # 1. Reset all to English first (as a base, though they seemingly already are)
    # This ensures we have a clean slate for the "unsure" cases.
    # Curriculum.objects.update(language='English') 
    # Commented out since they are already English from previous step, but essentially that's the state.

    updates = {
        'Amharic': 0,
        'Afan Oromo': 0,
        'Tigrinya': 0,
        'Somali': 0,
        'English': 0
    }

    # 2. Update Amharic
    # Case insensitive search for 'Amharic'
    amharic_count = Curriculum.objects.filter(subject__name__icontains='Amharic').update(language='Amharic')
    updates['Amharic'] = amharic_count
    print(f"Updated {amharic_count} records to Amharic")

    # 3. Update Afan Oromo
    # Covers 'Afan Oromo', 'Oromiffa', 'Oromo'
    oromo_count = Curriculum.objects.filter(
        Q(subject__name__icontains='Afan Oromo') | 
        Q(subject__name__icontains='Oromiffa') |
        Q(subject__name__icontains='Oromo')
    ).update(language='Afan Oromo')
    updates['Afan Oromo'] = oromo_count
    print(f"Updated {oromo_count} records to Afan Oromo")

    # 4. Update Tigrinya
    tigrinya_count = Curriculum.objects.filter(subject__name__icontains='Tigrinya').update(language='Tigrinya')
    updates['Tigrinya'] = tigrinya_count
    print(f"Updated {tigrinya_count} records to Tigrinya")

    # 5. Update Somali
    somali_count = Curriculum.objects.filter(subject__name__icontains='Somali').update(language='Somali')
    updates['Somali'] = somali_count
    print(f"Updated {somali_count} records to Somali")

    # 6. Verify English count (everything else)
    english_count = Curriculum.objects.filter(language='English').count()
    updates['English'] = english_count
    print(f"Remaining {english_count} records are set to English")

    print("\n--- Summary ---")
    for lang, count in updates.items():
        print(f"{lang}: {count}")

if __name__ == '__main__':
    fix_languages()
