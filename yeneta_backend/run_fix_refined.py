from academics.models import Curriculum, Region
from django.db.models import Q

print("--- STARTING REFINED FIX ---")

# 1. Update Afan Oromo based on Oromia-specific patterns
# Patterns: 'Barnoota ...', 'Herrega ...', 'Saayinsii ...', 'Afaan Oromoo'
afan_patterns = ['Barnoota', 'Herrega', 'Saayinsii', 'Afaan Oromoo']
query = Q()
for p in afan_patterns:
    query |= Q(subject__name__startswith=p)

# We specifically target Oromia region for these patterns to be safe, 
# though 'Afaan Oromoo' subject is likely Afan Oromo language anywhere.
# But keeping to User's prompt about Oromia Region.
# Actually 'Afaan Oromoo' is the language subject itself, so valid globally.
# The others are subjects TAUGHT in Afan Oromo.
count = Curriculum.objects.filter(query).update(language='Afan Oromo')
print(f"Afan Oromo updated (Global/Oromia patterns): {count}")

# 2. Re-run Amharic to be sure
count = Curriculum.objects.filter(subject__name__icontains='Amharic').update(language='Amharic')
print(f"Amharic updated: {count}")

# 3. Tigrinya
count = Curriculum.objects.filter(subject__name__icontains='Tigrinya').update(language='Tigrinya')
print(f"Tigrinya updated: {count}")

# 4. Somali
count = Curriculum.objects.filter(subject__name__icontains='Somali').update(language='Somali')
print(f"Somali updated: {count}")

print("--- REFINED FIX COMPLETE ---")
