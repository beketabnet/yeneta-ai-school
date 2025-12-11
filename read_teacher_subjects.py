with open(r'd:\django_project\yeneta-ai-school\yeneta_backend\academics\views.py', 'r') as f:
    lines = f.readlines()
    # Find teacher_enrolled_subjects function and read it
    for i, line in enumerate(lines):
        if 'def teacher_enrolled_subjects' in line:
            # Read from this line onwards for about 50 lines
            for j in range(i, min(i+50, len(lines))):
                print(f'{j+1:4d}: {lines[j].rstrip()}')
            break
