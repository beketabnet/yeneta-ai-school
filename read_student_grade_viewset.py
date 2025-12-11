with open('yeneta_backend/academics/views.py', 'r') as f:
    lines = f.readlines()
    # Find StudentGradeViewSet starting at line 1178
    start = 1177
    # Read until the next class definition or end of file
    output = []
    for i in range(start, min(start + 250, len(lines))):
        output.append(f"{i+1}: {lines[i].rstrip()}")
    print('\n'.join(output))
