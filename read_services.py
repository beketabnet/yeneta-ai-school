with open(r'd:\django_project\yeneta-ai-school\yeneta_backend\academics\services.py', 'r') as f:
    lines = f.readlines()
    print(f"Total lines: {len(lines)}")
    for i, line in enumerate(lines, 1):
        print(f'{i:3d}: {line.rstrip()}')
