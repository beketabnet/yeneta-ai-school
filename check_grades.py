import os
import django
import sys

# Add the backend directory to the Python path
sys.path.append('yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')

# Setup Django
django.setup()

from users.models import Family, FamilyMembership
from academics.models import StudentEnrollmentRequest
from django.contrib.auth import get_user_model

User = get_user_model()

print('Total Family records:', Family.objects.count())
print('Total FamilyMembership records:', FamilyMembership.objects.count())
print('Total approved StudentEnrollmentRequest records:', StudentEnrollmentRequest.objects.filter(status='approved').count())

parents = User.objects.filter(role='Parent')
print('Total Parent users:', parents.count())

# Check parents with memberships
parents_with_memberships = FamilyMembership.objects.filter(
    role='Parent',
    is_active=True
).values_list('user', flat=True).distinct()

print(f'Parents with family memberships: {len(set(parents_with_memberships))}')

if parents_with_memberships:
    parent_id = list(parents_with_memberships)[0]
    parent = User.objects.get(id=parent_id)
    print(f'\nChecking parent with memberships: {parent.username}')
    memberships = FamilyMembership.objects.filter(user=parent, role='Parent', is_active=True)
    print(f'Parent family memberships: {memberships.count()}')
    for m in memberships:
        print(f'  Family: {m.family.name}, Role: {m.role}, Active: {m.is_active}')

    # Check enrollments for these families
    family_ids = memberships.values_list('family_id', flat=True)
    enrollments = StudentEnrollmentRequest.objects.filter(
        family_id__in=family_ids,
        status='approved'
    )
    print(f'Approved enrollments for parent families: {enrollments.count()}')
    for e in enrollments[:3]:
        print(f'  {e.student.username} -> {e.subject} (Family: {e.family.name})')

families = Family.objects.all()[:5]
print('\nSample Family records:')
for f in families:
    print(f'  {f.name} (ID: {f.id})')
    members = FamilyMembership.objects.filter(family=f, is_active=True)
    print(f'    Members: {members.count()}')
    for m in members:
        print(f'      {m.user.username} ({m.role})')