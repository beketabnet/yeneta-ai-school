with open('yeneta_backend/academics/models.py', 'r') as f:
    lines = f.readlines()
    for i in range(92, 140):  # Lines 93-140
        print(f"{i+1:3d}: {lines[i].rstrip()}")
