import json

with open(r'd:\django_project\yeneta-ai-school\package.json', 'r') as f:
    data = json.load(f)
    print('Scripts:')
    for key, value in data.get('scripts', {}).items():
        print(f'  {key}: {value}')
