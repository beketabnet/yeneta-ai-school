#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from academics.models import StudentGrade, Grade, GradeItem, Unit
from communications.models import StudentAssignment
from users.models import User, FamilyMembership, Family

print("=== Database Statistics ===")
print(f"StudentGrade records: {StudentGrade.objects.count()}")
print(f"Grade records: {Grade.objects.count()}")
print(f"GradeItem records: {GradeItem.objects.count()}")
print(f"Unit records: {Unit.objects.count()}")
print(f"StudentAssignment records: {StudentAssignment.objects.count()}")
print(f"User records: {User.objects.count()}")
print(f"Family records: {Family.objects.count()}")
print(f"FamilyMembership records: {FamilyMembership.objects.count()}")

print("\n=== Sample Student Data ===")
students_with_grades = StudentGrade.objects.values('student_id').distinct()[:5]
for sg in students_with_grades:
    try:
        student = User.objects.get(id=sg['student_id'])
        grade_count = StudentGrade.objects.filter(student_id=sg['student_id']).count()
        print(f"Student: {student.first_name} {student.last_name} ({student.username}) - Grades: {grade_count}")
    except:
        pass

print("\n=== Family Memberships Sample ===")
families = Family.objects.all()[:3]
for family in families:
    members = FamilyMembership.objects.filter(family=family)
    print(f"Family '{family.name}': {members.count()} members")
    for member in members:
        print(f"  - {member.user.username} ({member.role})")
