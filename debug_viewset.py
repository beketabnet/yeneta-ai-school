with open('yeneta_backend/academics/views.py') as f:
    lines = f.readlines()
    for i in range(1177, min(1250, len(lines))):
        print(f'{i+1}: {lines[i]}', end='')
