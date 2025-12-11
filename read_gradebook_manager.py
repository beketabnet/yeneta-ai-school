with open(r'd:\django_project\yeneta-ai-school\components\teacher\GradebookManagerNew.tsx', 'r') as f:
    lines = f.readlines()
    print(f"Total lines: {len(lines)}")
    for i, line in enumerate(lines, 1):
        print(f'{i:3d}: {line.rstrip()}')
