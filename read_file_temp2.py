import os
files = [
    'D:/django_project/yeneta-ai-school/components/teacher/gradebook/TeacherGradebookManagerNew.tsx',
    'D:/django_project/yeneta-ai-school/components/teacher/gradebook/GradebookManagerStats.tsx',
    'D:/django_project/yeneta-ai-school/components/teacher/gradebook/SubjectsVerticalSlider.tsx',
]

for file_path in files:
    if os.path.exists(file_path):
        print(f"=== {os.path.basename(file_path)} ===")
        with open(file_path) as f:
            print(f.read())
        print("\n")
