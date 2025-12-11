import sys
with open('components/teacher/GradebookManager.tsx', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines[:150]):
        print(line.rstrip())
