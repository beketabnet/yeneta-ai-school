#!/usr/bin/env python
with open('yeneta_backend/academics/views.py', 'r') as f:
    content = f.read()
    lines = content.split('\n')
    for i, line in enumerate(lines[:1000], 1):
        print(f'{i}: {line}')
