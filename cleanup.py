#!/usr/bin/env python
import os
import glob

temp_files = [
    'read_backend.py',
    'read_frontend.py',
    'read_approved.py',
    'read_breakdown.py',
    'read_grades_by_type.py',
    'read_parent_component.py',
    'read_admin_analytics.py',
    'check_api_service.py',
    'find_stats.py',
    'find_family_model.py',
    'check_imports.py',
    'find_location.py',
    'find_hook_usage.py',
    'read_file_exact.py',
    'check_student_grade_viewset.py',
    'find_admin_useeffect.py',
    'read_package_json.py',
    'strategic_plan.txt',
    'output_hook.txt',
    'approved_content.txt',
    'breakdown_content.txt',
    'grades_by_type_full.txt',
    'approved_partial.txt'
]

for file in temp_files:
    try:
        if os.path.exists(file):
            os.remove(file)
            print(f'Removed: {file}')
    except Exception as e:
        print(f'Could not remove {file}: {e}')

print("Cleanup complete!")
