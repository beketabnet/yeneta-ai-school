import os
files = [
    'D:/django_project/yeneta-ai-school/yeneta_backend/academics/models.py',
    'D:/django_project/yeneta-ai-school/services/gradebookService.ts',
]

for file_path in files:
    if os.path.exists(file_path):
        print(f"=== {os.path.basename(file_path)} ===")
        with open(file_path) as f:
            content = f.read()
            # Show first 2000 chars for models
            if 'models.py' in file_path:
                print(content[:4000])
            else:
                print(content)
        print("\n")
