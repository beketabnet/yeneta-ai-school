with open('yeneta_backend/academics/services_grade_entry_enhanced.py', 'r') as f:
    lines = f.readlines()

# Print lines around line 96
for i in range(85, 115):
    if i < len(lines):
        print('{}: {}'.format(i+1, lines[i]), end='')
