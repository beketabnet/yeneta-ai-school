#!/usr/bin/env python
with open('components/teacher/gradebook/TeacherGradebookManagerNew.tsx', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines[:500], 1):
        print(f'{i}: {line}', end='')
