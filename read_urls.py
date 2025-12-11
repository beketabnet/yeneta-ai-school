with open(r'd:\django_project\yeneta-ai-school\yeneta_backend\academics\urls.py', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines, 1):
        print(f'{i:3d}: {line.rstrip()}')
