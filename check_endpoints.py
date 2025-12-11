with open('yeneta_backend/academics/views.py', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if 'def teacher_enrolled_subjects' in line:
            print('=== teacher_enrolled_subjects ===')
            print(''.join(lines[i:min(i+15, len(lines))]))
            print()

with open('yeneta_backend/academics/services_grade_entry.py', 'r') as f:
    content = f.read()
    idx = content.find('get_teacher_enrolled_subjects')
    if idx != -1:
        print('=== Backend Service Implementation ===')
        print(content[idx:idx+1000])
