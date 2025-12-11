import os
import django
import sys

# Set up Django environment
sys.path.append(r'D:\django_project\yeneta-ai-school\yeneta_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from academics.views import RegionViewSet, GradeLevelViewSet, StreamViewSet, SubjectViewSet, CurriculumViewSet

def verify_endpoints():
    factory = APIRequestFactory()

    print("--- Verifying Generic Configuration API Endpoints ---")

    # 1. Regions
    print("\n1. Testing /academics/regions/")
    view = RegionViewSet.as_view({'get': 'list'})
    request = factory.get('/academics/regions/')
    response = view(request)
    print(f"Status Code: {response.status_code}")
    print(f"Count: {len(response.data)}")
    if len(response.data) > 0:
        print(f"Sample: {response.data[0]}")

    # 2. Grade Levels
    print("\n2. Testing /academics/grade-levels/")
    view = GradeLevelViewSet.as_view({'get': 'list'})
    request = factory.get('/academics/grade-levels/')
    response = view(request)
    print(f"Status Code: {response.status_code}")
    print(f"Count: {len(response.data)}")
    if len(response.data) > 0:
        print(f"Sample: {response.data[0]}")

    # 3. Streams
    print("\n3. Testing /academics/streams/")
    view = StreamViewSet.as_view({'get': 'list'})
    request = factory.get('/academics/streams/')
    response = view(request)
    print(f"Status Code: {response.status_code}")
    print(f"Count: {len(response.data)}")
    if len(response.data) > 0:
        print(f"Sample: {response.data[0]}")

    # 4. Subjects
    print("\n4. Testing /academics/subjects/")
    view = SubjectViewSet.as_view({'get': 'list'})
    request = factory.get('/academics/subjects/')
    response = view(request)
    print(f"Status Code: {response.status_code}")
    print(f"Count: {len(response.data)}")
    if len(response.data) > 0:
        print(f"Sample: {response.data[0]}")

    # 5. Curriculum
    print("\n5. Testing /academics/curriculum/")
    view = CurriculumViewSet.as_view({'get': 'list'})
    request = factory.get('/academics/curriculum/')
    response = view(request)
    print(f"Status Code: {response.status_code}")
    print(f"Count: {len(response.data)}")
    if len(response.data) > 0:
        print(f"Sample: {response.data[0]}")

    # 6. Curriculum Filtering
    print("\n6. Testing /academics/curriculum/ filtering (Grade 12, Natural Science)")
    request = factory.get('/academics/curriculum/', {'grade': 'Grade 12', 'stream': 'Natural Science'})
    response = view(request)
    print(f"Status Code: {response.status_code}")
    print(f"Count: {len(response.data)}")
    if len(response.data) > 0:
        print(f"Sample Subject: {response.data[0]['subject_detail']['name']}")

if __name__ == '__main__':
    verify_endpoints()
