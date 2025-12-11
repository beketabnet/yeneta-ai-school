with open('yeneta_backend/academics/views.py', 'r') as f:
    lines = f.readlines()[:50]  # Check first 50 lines for imports
    for i, line in enumerate(lines):
        print(f"{i+1}: {line.rstrip()}")
