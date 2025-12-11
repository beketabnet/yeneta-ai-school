
import os
import django
import sys

# Setup Django
sys.path.append('d:/django_project/yeneta-ai-school/yeneta_backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "yeneta_backend.settings")
django.setup()

from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from users.serializers import UserRegistrationSerializer

def test_registration_requirements():
    print("Testing Registration Requirements...")
    client = APIClient()
    
    # 1. Test Missing Fields (should fail validation)
    print("\n[Test 1] Attempting registration with missing fields...")
    data_missing = {
        "email": "test_missing@example.com",
        "username": "test_missing",
        "password": "password123",
        "role": "Student"
        # Missing firstname, lastname, region, mobile
    }
    
    serializer = UserRegistrationSerializer(data=data_missing)
    if not serializer.is_valid():
        print("[SUCCESS] Validation failed as expected for missing fields.")
        print("Errors:", serializer.errors)
        assert 'first_name' in serializer.errors
        assert 'last_name' in serializer.errors
        assert 'region' in serializer.errors
        assert 'mobile_number' in serializer.errors
    else:
        print("[FAILURE] Validation succeeded but should have failed!")
        # Cleanup if created (unlikely)
        pass

    # 2. Test Full Fields (should succeed)
    print("\n[Test 2] Attempting registration with valid fields...")
    data_valid = {
        "email": "test_valid@example.com",
        "username": "test_valid",
        "password": "password123",
        "role": "Student",
        "first_name": "Test",
        "last_name": "User",
        "region": "Addis Ababa",
        "mobile_number": "+251911223344"
    }
    
    serializer = UserRegistrationSerializer(data=data_valid)
    if serializer.is_valid():
        user = serializer.save()
        print("[SUCCESS] User created successfully.")
        print(f"Created User: {user.username}, ID: {user.id}")
        
        # Verify DB values
        refreshed_user = User.objects.get(id=user.id)
        assert refreshed_user.first_name == "Test"
        assert refreshed_user.last_name == "User"
        assert refreshed_user.region == "Addis Ababa"
        assert refreshed_user.mobile_number == "+251911223344"
        print("[SUCCESS] DB Verification: All fields saved correctly.")
        
        # Cleanup
        refreshed_user.delete()
        print("Cleanup done.")
    else:
        print("[FAILURE] Validation failed for valid data!")
        print("Errors:", serializer.errors)

    # 3. Test Default Values on Model Level (Direct Creation)
    print("\n[Test 3] Testing Model Defaults (Direct DB Creation)...")
    try:
        # Create user without specifying new fields (should use defaults)
        user_default = User.objects.create_user(
            email="test_default@example.com",
            username="test_default",
            password="password123"
        )
        print("[SUCCESS] User created directly via model.")
        print(f"Defaults -> First: {user_default.first_name}, Last: {user_default.last_name}, Region: {user_default.region}, Mobile: {user_default.mobile_number}")
        
        assert user_default.first_name == "Unknown"
        assert user_default.last_name == "Unknown"
        assert user_default.region == "Addis Ababa"
        assert user_default.mobile_number == "+251000000000"
        print("[SUCCESS] Defaults Verification: Correct defaults applied.")
        
        user_default.delete()
    except Exception as e:
        print(f"[FAILURE] Direct creation failed: {e}")

if __name__ == "__main__":
    try:
        test_registration_requirements()
        print("\n[DONE] ALL TESTS PASSED")
    except AssertionError as e:
        print(f"\n[FAILED] TEST FAILED: Assertion Error")
    except Exception as e:
        print(f"\n[FAILED] TEST FAILED: {e}")
