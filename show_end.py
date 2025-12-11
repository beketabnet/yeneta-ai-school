with open('components/teacher/GradebookManager.tsx', 'r') as f:
    lines = f.readlines()
    total = len(lines)
    start = max(0, total - 150)
    for line in lines[start:]:
        print(line.rstrip())
