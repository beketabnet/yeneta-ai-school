#!/usr/bin/env python
with open('components/teacher/gradebook/GradebookManagerTableNew.tsx', 'r') as f:
    content = f.read()
    lines = content.split('\n')
    for i, line in enumerate(lines[:300], 1):
        print(f'{i}: {line}')
