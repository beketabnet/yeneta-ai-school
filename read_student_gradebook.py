with open('components/student/gradebook/ApprovedCoursesGradebook.tsx', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines[:150]):
        print(f'{i+1}: {line.rstrip()}')
