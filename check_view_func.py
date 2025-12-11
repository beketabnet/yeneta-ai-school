with open('yeneta_backend/academics/views.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if 'def teacher_enrolled_subjects' in line:
            for j in range(i, min(i+50, len(lines))):
                print(f'{j+1}: {lines[j]}', end='')
            break
