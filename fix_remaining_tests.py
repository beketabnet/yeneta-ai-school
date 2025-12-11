#!/usr/bin/env python
with open('tests/gradebook-manager-realtime.spec.ts', 'r') as f:
    content = f.read()
    
# Find the "Manual refresh button works" test and get its exact content to see what line we're on
lines = content.split('\n')
for i, line in enumerate(lines[223:245], 224):
    print(f'{i}: {line}')
