#!/usr/bin/env python
"""Test the families API endpoint"""

import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

# Get student user
student = User.objects.get(email='student@yeneta.com')
print(f"Student: {student.username} ({student.email})")

# Generate JWT token
refresh = RefreshToken.for_user(student)
token = str(refresh.access_token)

# Make request
client = Client()
response = client.get(
    '/api/users/student-families/',
    HTTP_AUTHORIZATION=f'Bearer {token}'
)

print(f"\nStatus Code: {response.status_code}")
print(f"Content-Type: {response.get('Content-Type')}")
print(f"\nResponse Data:")
print(json.dumps(response.json(), indent=2))
