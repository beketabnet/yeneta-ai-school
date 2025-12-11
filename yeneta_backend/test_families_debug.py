#!/usr/bin/env python
"""Debug script to check families and memberships"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Family, FamilyMembership

User = get_user_model()

print("=" * 60)
print("FAMILIES DEBUG")
print("=" * 60)

# Get all families
families = Family.objects.all()
print(f"\nTotal families: {families.count()}")
for family in families:
    print(f"\nFamily: {family.name} (ID: {family.id})")
    members = family.members.filter(is_active=True)
    print(f"  Active members: {members.count()}")
    for member in members:
        print(f"    - {member.user.username} ({member.user.email}) - Role: {member.role}")

# Get student user
print("\n" + "=" * 60)
print("STUDENT FAMILIES")
print("=" * 60)

try:
    student = User.objects.get(email='student@yeneta.com')
    print(f"\nStudent: {student.username} (Email: {student.email})")
    
    # Get families for this student
    student_families = Family.objects.filter(
        members__user=student,
        members__is_active=True
    ).distinct()
    
    print(f"Families for this student: {student_families.count()}")
    for family in student_families:
        print(f"  - {family.name} (ID: {family.id})")
        members = family.members.filter(is_active=True)
        for member in members:
            print(f"    - {member.user.username} ({member.role})")
except User.DoesNotExist:
    print("Student user not found!")

# Get all users
print("\n" + "=" * 60)
print("ALL USERS")
print("=" * 60)

users = User.objects.all()
print(f"\nTotal users: {users.count()}")
for user in users:
    print(f"  - {user.username} ({user.email}) - Role: {user.role}")
