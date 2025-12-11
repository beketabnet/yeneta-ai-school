import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from academics.models import AssignmentType, ExamType, StudentGrade

def seed_types():
    # Seed Assignment Types
    print("Seeding Assignment Types...")
    for value, name in StudentGrade.ASSIGNMENT_TYPES:
        obj, created = AssignmentType.objects.get_or_create(
            name=name,
            defaults={'description': f"{name} type", 'is_active': True}
        )
        if created:
            print(f"Created AssignmentType: {name}")
        else:
            print(f"AssignmentType already exists: {name}")

    # Seed Exam Types
    print("\nSeeding Exam Types...")
    for value, name in StudentGrade.EXAM_TYPES:
        obj, created = ExamType.objects.get_or_create(
            name=name,
            defaults={'description': f"{name} type", 'is_active': True}
        )
        if created:
            print(f"Created ExamType: {name}")
        else:
            print(f"ExamType already exists: {name}")

    print("\nSeeding completed successfully.")

if __name__ == '__main__':
    seed_types()
