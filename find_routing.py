import os
import re

print("=== Looking for Teacher Dashboard Files ===\n")
teacher_path = r'd:\django_project\yeneta-ai-school\components\dashboards\teacher'
if os.path.exists(teacher_path):
    for file in os.listdir(teacher_path):
        print(f"  {file}")
else:
    print("  Directory not found")

print("\n=== Looking for All Dashboard Files ===\n")
dashboards_path = r'd:\django_project\yeneta-ai-school\components\dashboards'
if os.path.exists(dashboards_path):
    for item in os.listdir(dashboards_path):
        print(f"  {item}")
        
print("\n=== Searching for 'Gradebook' in TeacherDashboard ===\n")
teacher_dashboard_file = r'd:\django_project\yeneta-ai-school\components\dashboards\teacher\TeacherDashboard.tsx'
if os.path.exists(teacher_dashboard_file):
    with open(teacher_dashboard_file, 'r') as f:
        content = f.read()
        # Find lines with Gradebook
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'Gradebook' in line or 'gradebook' in line:
                print(f"Line {i+1}: {line}")
