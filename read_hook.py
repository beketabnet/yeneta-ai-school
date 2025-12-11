with open('hooks/useStudentGradesEnhanced.ts') as f:
    lines = f.readlines()
    # Print from line 120 onwards to see the fetch function
    for i in range(119, min(150, len(lines))):
        print(f'{i+1}: {lines[i]}', end='')
