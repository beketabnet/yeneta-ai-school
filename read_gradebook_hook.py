#!/usr/bin/env python
with open('hooks/useGradebookManager.ts', 'r') as f:
    content = f.read()
    lines = content.split('\n')
    for i, line in enumerate(lines[:400], 1):
        print(f'{i}: {line}')
