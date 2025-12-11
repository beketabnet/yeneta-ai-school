with open('yeneta_backend/academics/models.py', 'r') as f:
    lines = f.readlines()
    for i in range(233, 283):  # Lines 234-284
        print(f"{i+1:3d}: {lines[i].rstrip()}")
