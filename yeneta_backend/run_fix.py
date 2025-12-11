from academics.models import Curriculum
from django.db.models import Q

print("--- STARTING FIX ---")
# 1. Update Amharic
count = Curriculum.objects.filter(subject__name__icontains='Amharic').update(language='Amharic')
print(f"Amharic updated: {count}")

# 2. Update Afan Oromo (including 'Oromo')
# careful with 'Oromo', might match too broadly? But in Ethiopia context usually fine.
count = Curriculum.objects.filter(
    Q(subject__name__icontains='Afan Oromo') | 
    Q(subject__name__icontains='Oromiffa')
).update(language='Afan Oromo')
print(f"Afan Oromo updated: {count}")

# 3. Update Tigrinya
count = Curriculum.objects.filter(subject__name__icontains='Tigrinya').update(language='Tigrinya')
print(f"Tigrinya updated: {count}")

# 4. Update Somali
count = Curriculum.objects.filter(subject__name__icontains='Somali').update(language='Somali')
print(f"Somali updated: {count}")

print("--- FIX COMPLETE ---")
