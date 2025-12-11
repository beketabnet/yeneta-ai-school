#!/usr/bin/env python
with open('yeneta_backend/academics/models.py', 'r') as f:
    content = f.read()
    lines = content.split('\n')
    for i, line in enumerate(lines[:600], 1):
        print(f'{i}: {line}')
