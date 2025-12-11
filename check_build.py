with open(r'd:\django_project\yeneta-ai-school\build_output.log', 'r') as f:
    content = f.read()
    print("=== BUILD OUTPUT ===")
    if 'error' in content.lower():
        lines = content.split('\n')
        print("\nErrors found:")
        for line in lines:
            if 'error' in line.lower():
                print(line)
    else:
        print("No errors found")
        
    print("\n=== Last 30 lines ===")
    lines = content.split('\n')
    for line in lines[-30:]:
        if line.strip():
            print(line)
