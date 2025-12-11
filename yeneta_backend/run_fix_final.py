from academics.models import Curriculum, Region
from django.db.models import Q

print("--- STARTING FINAL FIX ---")

# 1. ORMOMIA (Retaining previous logic)
afan_patterns = ['Barnoota', 'Herrega', 'Saayinsii', 'Afaan Oromoo']
query_oromia = Q()
for p in afan_patterns:
    query_oromia |= Q(subject__name__startswith=p)

# Also explicitly the bracketed ones if they start with English but are Oromia specific? 
# The previous logic worked well for Oromia. 
# Let's ensure we capture exactly what we did before + any 'Local Language (Optional)' in Oromia if it exists.
# We will trust the previous global pattern for Oromia specific keywords.
count = Curriculum.objects.filter(query_oromia).update(language='Afan Oromo')
print(f"Afan Oromo updated (Keywords): {count}")

# 2. TIGRAY -> TIGRINYA
# Heuristic: Region='Tigray' AND Subject='Local Language (Optional)'
# Also check if there is a subject named 'Tigrinya' (explicitly)
tigray_region = Region.objects.filter(name='Tigray').first()
if tigray_region:
    count = Curriculum.objects.filter(
        region=tigray_region,
        subject__name='Local Language (Optional)'
    ).update(language='Tigrinya')
    print(f"Tigrinya updated in Tigray (Local Language): {count}")

# 3. SOMALI -> SOMALI
somali_region = Region.objects.filter(name='Somali').first()
if somali_region:
    count = Curriculum.objects.filter(
        region=somali_region,
        subject__name='Local Language (Optional)'
    ).update(language='Somali')
    print(f"Somali updated in Somali Region (Local Language): {count}")

# 4. AMHARIC (Global catch-all for the subject 'Amharic')
count = Curriculum.objects.filter(subject__name__icontains='Amharic').update(language='Amharic')
print(f"Amharic updated (Global Subject Match): {count}")

print("--- FINAL FIX COMPLETE ---")
