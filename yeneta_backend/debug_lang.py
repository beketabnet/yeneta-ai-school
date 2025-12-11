from academics.models import Curriculum

non_english = Curriculum.objects.exclude(language='English')
print(f"Count: {non_english.count()}")
if non_english.exists():
    print(f"First 5 languages: {[c.language for c in non_english[:5]]}")
    print(f"First 5 objects: {non_english[:5]}")
