from academics.models import Curriculum, Region

try:
    oromia = Region.objects.get(name='Oromia')
    print(f"Found Oromia region: {oromia}")
    
    # Get all curriculums in Oromia
    oromia_curriculums = Curriculum.objects.filter(region=oromia)
    print(f"Total curriculums in Oromia: {oromia_curriculums.count()}")

    # List some subject names to identify the pattern
    print("\nSample Subject Names in Oromia:")
    subjects = oromia_curriculums.values_list('subject__name', flat=True).distinct()[:30]
    for s in subjects:
        print(f" - {s}")

    # Check for the specific pattern mentioned: "(Health and Physical Education)"
    print("\nChecking for parenthesized content:")
    parenthesis_subjects = oromia_curriculums.filter(subject__name__contains='(').values_list('subject__name', flat=True).distinct()
    for s in parenthesis_subjects:
        print(f" [Parenthesis match]: {s}")

except Region.DoesNotExist:
    print("Oromia region not found in DB")
