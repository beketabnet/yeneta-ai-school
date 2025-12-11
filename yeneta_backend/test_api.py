"""
Quick test script to verify API responses
Run this with: python test_api.py
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

# Login first
login_response = requests.post(f"{BASE_URL}/users/token/", json={
    "email": "admin@yeneta.com",
    "password": "admin123"
})

if login_response.status_code == 200:
    token = login_response.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    
    print("✅ Login successful!")
    print(f"Token: {token[:50]}...\n")
    
    # Test endpoints
    endpoints = [
        "/users/",
        "/alerts/smart-alerts/",
        "/rag/vector-stores/",
        "/analytics/engagement-trends/",
        "/analytics/learning-outcomes/",
    ]
    
    for endpoint in endpoints:
        response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        data = response.json()
        
        print(f"\n{'='*60}")
        print(f"Endpoint: {endpoint}")
        print(f"Status: {response.status_code}")
        print(f"Type: {type(data).__name__}")
        
        if isinstance(data, list):
            print(f"✅ Returns array with {len(data)} items")
        elif isinstance(data, dict):
            print(f"❌ Returns object (should be array)")
            print(f"Keys: {list(data.keys())}")
        
        print(f"Response preview: {json.dumps(data, indent=2)[:200]}...")
else:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
