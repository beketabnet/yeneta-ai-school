with open(r'd:\django_project\yeneta-ai-school\services\gradebookService.ts', 'r') as f:
    lines = f.readlines()
    print(f"Total lines: {len(lines)}")
    for i, line in enumerate(lines[:150], 1):
        print(f'{i:3d}: {line.rstrip()}')
