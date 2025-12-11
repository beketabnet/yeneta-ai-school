with open(r'd:\django_project\yeneta-ai-school\services\apiService.ts', 'r') as f:
    lines = f.readlines()
    print('=== API Service Configuration ===\n')
    
    for i, line in enumerate(lines[:150], 1):
        if 'baseURL' in line or 'BASE_URL' in line or 'create' in line.lower() or 'axios' in line.lower():
            print(f'{i:3d}: {line.rstrip()}')
