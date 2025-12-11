with open(r'd:\django_project\yeneta-ai-school\yeneta_backend\academics\views.py', 'r') as f:
    lines = f.readlines()
    print(f"Total lines: {len(lines)}")
    
    # Search for student-grades and enrolled subjects endpoints
    for i, line in enumerate(lines):
        if 'student.grades' in line.lower() or 'StudentGrade' in line or 'enrolled' in line.lower():
            # Print surrounding context
            start = max(0, i-2)
            end = min(len(lines), i+3)
            for j in range(start, end):
                prefix = ">>> " if j == i else "    "
                print(f'{prefix}{j+1:4d}: {lines[j].rstrip()}')
            print("    ---")
