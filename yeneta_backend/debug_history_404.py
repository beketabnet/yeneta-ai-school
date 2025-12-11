import os
import django
# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

import requests
from rest_framework.test import APIClient
from users.models import User
from academics.models import StudentGrade

def debug_404():
    print("Starting 404 Debug (Family Check)...")
    
    # 1. Setup Parent and Child (NOT directly linked)
    parent_email = 'debug_parent_fam@test.com'
    child_email = 'debug_child_fam@test.com'
    
    parent, _ = User.objects.get_or_create(username='debug_parent_fam', email=parent_email, defaults={'role': 'Parent'})
    child, _ = User.objects.get_or_create(username='debug_child_fam', email=child_email, defaults={'role': 'Student'})
    
    # Ensure NO direct link
    child.parent = None
    child.save()
    
    # 2. Setup Family
    from users.models import Family, FamilyMembership
    family, _ = Family.objects.get_or_create(name="Debug Family")
    
    FamilyMembership.objects.get_or_create(family=family, user=parent, defaults={'role': 'Parent'})
    FamilyMembership.objects.get_or_create(family=family, user=child, defaults={'role': 'Student'})
    
    print(f"Parent: {parent.id}, Child: {child.id}, Family: {family.name}")
    
    # 3. Create some grades
    StudentGrade.objects.create(
        student=child,
        subject='Science',
        score=88,
        max_score=100,
        assignment_type='Quiz',
        title='Debug Quiz'
    )
    
    # 4. Hit the endpoint
    client = APIClient()
    client.force_authenticate(user=parent)
    
    url = f'/api/academics/student-grades-history/?student_id={child.id}&subject=Science'
    print(f"Requesting: {url}")
    
    response = client.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.content.decode()}")
    
    if response.status_code == 200:
        print("SUCCESS: Endpoint returned 200 via Family connection.")
    else:
        print(f"FAILURE: Endpoint returned {response.status_code}.")

if __name__ == '__main__':
    debug_404()
