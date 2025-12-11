with open('components/teacher/gradebook/GradeAddingCard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find handleSaveGrade function
for i, line in enumerate(lines):
    if 'const handleSaveGrade' in line:
        # Print the function (approximately 40 lines)
        for j in range(i, min(i + 40, len(lines))):
            print('{}: {}'.format(j+1, lines[j]), end='')
        break
