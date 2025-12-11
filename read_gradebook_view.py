with open('yeneta_backend/academics/views.py') as f:
    lines = f.readlines()
    for i in range(1354, min(1430, len(lines))):
        print(f'{i+1}: {lines[i]}', end='')
