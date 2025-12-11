#!/usr/bin/env python
import sys

with open('yeneta_backend/academics/services_grade_entry_enhanced.py', 'r') as f:
    lines = f.readlines()

# Find the function start and end
start = None
end = None
for i, line in enumerate(lines):
    if 'def get_teacher_enrolled_subjects_with_students' in line:
        start = i
    if start is not None and i > start and (line.startswith('    def ') or line.startswith('    @')):
        end = i
        break

if start is not None:
    if end is None:
        end = len(lines)
    
    for line in lines[start:min(start + 150, end)]:
        print(line, end='')
