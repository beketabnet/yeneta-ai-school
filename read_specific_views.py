with open('D:/django_project/yeneta-ai-school/yeneta_backend/academics/views.py') as f:
    lines = f.readlines()
    # Find and print teacher_enrolled_subjects and related functions
    for i, line in enumerate(lines[1440:1600], start=1440):
        print(f"{i:4d}→{line}", end='')
