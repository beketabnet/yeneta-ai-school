with open('yeneta_backend/academics/models.py', 'r') as f:
    lines = f.readlines()
    for i in range(360, min(420, len(lines))):  # Continue reading StudentGrade
        print(f"{i+1:3d}: {lines[i].rstrip()}")
