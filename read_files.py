import sys

files_to_read = [
    r'd:\django_project\yeneta-ai-school\components\teacher\GradebookManager.tsx',
    r'd:\django_project\yeneta-ai-school\components\teacher\gradebook\GradebookManagerFilters.tsx',
    r'd:\django_project\yeneta-ai-school\components\teacher\gradebook\GradebookManagerStats.tsx',
    r'd:\django_project\yeneta-ai-school\hooks\useGradebookManager.ts',
]

for file_path in files_to_read:
    print(f"\n\n{'='*80}")
    print(f"FILE: {file_path}")
    print('='*80)
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()[:100]
            for i, line in enumerate(lines, 1):
                print(f'{i:3d}: {line.rstrip()}')
    except Exception as e:
        print(f"Error reading file: {e}")
