#!/usr/bin/env python
with open('components/teacher/gradebook/GradeTypeModal.tsx', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines[:200], 1):
        print(f'{i}: {line}', end='')
