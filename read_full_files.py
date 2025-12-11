import sys

file_path = r'd:\django_project\yeneta-ai-school\hooks\useGradebookManager.ts'

print(f"\n\n{'='*80}")
print(f"FILE: {file_path}")
print('='*80)
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for i, line in enumerate(lines[100:300], 101):
            print(f'{i:3d}: {line.rstrip()}')
except Exception as e:
    print(f"Error reading file: {e}")
