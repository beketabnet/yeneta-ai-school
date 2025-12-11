#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'yeneta_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from academics.models import StudentGrade, GradeItem, Unit, Grade
from users.models import User

print("=" * 50)
print("DATABASE TABLE RECORD COUNTS")
print("=" * 50)
print(f"StudentGrade count: {StudentGrade.objects.count()}")
print(f"Grade count: {Grade.objects.count()}")
print(f"GradeItem count: {GradeItem.objects.count()}")
print(f"Unit count: {Unit.objects.count()}")
print(f"Student Users count: {User.objects.filter(role='Student').count()}")

if StudentGrade.objects.exists():
    sample = StudentGrade.objects.first()
    print("\nSample StudentGrade:")
    print(f"  Student: {sample.student}")
    print(f"  Subject: {sample.subject}")
    print(f"  Score: {sample.score}/{sample.max_score}")
    print(f"  Assignment Type: {sample.assignment_type}")
    print(f"  Exam Type: {sample.exam_type}")
    print(f"  Graded At: {sample.graded_at}")
