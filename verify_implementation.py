#!/usr/bin/env python
"""
Verification script for GradeBook Enhancement Implementation
Checks all components and endpoints are properly configured
"""

import os
import sys

def verify_files():
    """Verify all required files exist"""
    files_to_check = {
        'Backend Services': [
            'yeneta_backend/academics/services_grade_entry_enhanced.py',
            'yeneta_backend/academics/views.py',
            'yeneta_backend/academics/urls.py',
        ],
        'Frontend Components': [
            'components/teacher/gradebook/GradeAddingCard.tsx',
            'components/teacher/gradebook/EnrolledSubjectsTable.tsx',
            'components/teacher/gradebook/TeacherGradebookManagerNew.tsx',
            'services/gradebookServiceEnhanced.ts',
        ]
    }
    
    print("=" * 60)
    print("VERIFICATION: File Existence")
    print("=" * 60)
    
    all_exist = True
    for category, files in files_to_check.items():
        print(f"\n{category}:")
        for file_path in files:
            exists = os.path.exists(file_path)
            status = "[OK]" if exists else "[FAIL]"
            print(f"  {status} {file_path}")
            if not exists:
                all_exist = False
    
    return all_exist

def verify_backend_endpoints():
    """Verify all backend endpoints are registered"""
    print("\n" + "=" * 60)
    print("VERIFICATION: Backend API Endpoints")
    print("=" * 60)
    
    expected_endpoints = [
        'teacher-enrolled-subjects-with-students/',
        'subject-students-for-grading/<int:subject_id>/',
        'student-grades-for-subject/<int:student_id>/',
        'save-student-grade/',
        'grade-statistics-for-subject/<str:subject_name>/',
    ]
    
    # Read urls.py to verify
    with open('yeneta_backend/academics/urls.py') as f:
        urls_content = f.read()
    
    print("\nExpected Endpoints:")
    all_found = True
    for endpoint in expected_endpoints:
        found = endpoint in urls_content
        status = "[OK]" if found else "[FAIL]"
        print(f"  {status} {endpoint}")
        if not found:
            all_found = False
    
    return all_found

def verify_frontend_integration():
    """Verify frontend components are properly integrated"""
    print("\n" + "=" * 60)
    print("VERIFICATION: Frontend Integration")
    print("=" * 60)
    
    integration_checks = {
        'GradeAddingCard imported in TeacherGradebookManagerNew': (
            'components/teacher/gradebook/TeacherGradebookManagerNew.tsx',
            "import GradeAddingCard"
        ),
        'Student names in EnrolledSubjectsTable': (
            'components/teacher/gradebook/EnrolledSubjectsTable.tsx',
            "student_name"
        ),
        'Vertical slider in EnrolledSubjectsTable': (
            'components/teacher/gradebook/EnrolledSubjectsTable.tsx',
            "ChevronUpIcon"
        ),
        'Dynamic stats in TeacherGradebookManagerNew': (
            'components/teacher/gradebook/TeacherGradebookManagerNew.tsx',
            "dynamicStats"
        ),
        'Grade card modal state management': (
            'components/teacher/gradebook/TeacherGradebookManagerNew.tsx',
            "isGradeCardOpen"
        ),
    }
    
    print("\nIntegration Checks:")
    all_checks_pass = True
    for check_name, (file_path, search_term) in integration_checks.items():
        with open(file_path) as f:
            content = f.read()
        found = search_term in content
        status = "[OK]" if found else "[FAIL]"
        print(f"  {status} {check_name}")
        if not found:
            all_checks_pass = False
    
    return all_checks_pass

def verify_data_structures():
    """Verify data structures match between backend and frontend"""
    print("\n" + "=" * 60)
    print("VERIFICATION: Data Structures")
    print("=" * 60)
    
    print("\nChecking backend service exports students in subjects:")
    with open('yeneta_backend/academics/services_grade_entry_enhanced.py') as f:
        content = f.read()
        has_students_export = "'students':" in content and "'student_id':" in content
        status = "[OK]" if has_students_export else "[FAIL]"
        print(f"  {status} Backend exports student list with subjects")
    
    print("\nChecking frontend accepts students data:")
    with open('components/teacher/gradebook/EnrolledSubjectsTable.tsx') as f:
        content = f.read()
        handles_students = "subject.students" in content
        status = "[OK]" if handles_students else "[FAIL]"
        print(f"  {status} Frontend receives and displays student list")
    
    return has_students_export and handles_students

def main():
    print("\n" + "=" * 60)
    print("GRADEBOOK ENHANCEMENT IMPLEMENTATION VERIFICATION")
    print("=" * 60)
    
    results = {
        'Files Exist': verify_files(),
        'Backend Endpoints': verify_backend_endpoints(),
        'Frontend Integration': verify_frontend_integration(),
        'Data Structures': verify_data_structures(),
    }
    
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    for check, passed in results.items():
        status = "[PASS]" if passed else "[FAIL]"
        print(f"{status}: {check}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 60)
    if all_passed:
        print("[PASS] ALL VERIFICATIONS PASSED - Implementation is complete!")
    else:
        print("[FAIL] Some verifications failed - Review the output above")
    print("=" * 60 + "\n")
    
    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(main())
