with open('components/teacher/gradebook/EnrolledSubjectsTable.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Print lines around 180-200
for i in range(178, min(202, len(lines))):
    print('{}: {}'.format(i+1, lines[i]), end='')
