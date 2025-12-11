with open('yeneta_backend/academics/views.py', 'r') as f:
    lines = f.readlines()
    # Read perform_create at line 1200 and related methods
    for i in range(1199, min(1230, len(lines))):
        print(f"{i+1}: {lines[i].rstrip()}")
