#!/usr/bin/env python
with open('tests/admin-grades-analytics.spec.ts', 'r') as f:
    content = f.read()
    lines = content.split('\n')
    for i, line in enumerate(lines[:500], 1):
        print(f'{i}: {line}')
