with open('yeneta_backend/academics/views.py', 'r') as f:
    lines = f.readlines()
    in_viewset = False
    for i, line in enumerate(lines, 1):
        if 'class StudentEnrollmentRequestViewSet' in line:
            in_viewset = True
            print(f'StudentEnrollmentRequestViewSet starts at line {i}')
        if in_viewset and i <= 300:
            print(f'{i}: {line}', end='')
        if in_viewset and 'def approve' in line:
            for j in range(20):
                if i + j < len(lines):
                    print(f'{i+j}: {lines[i+j-1]}', end='')
            break
