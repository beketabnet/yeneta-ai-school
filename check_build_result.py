with open(r'd:\django_project\yeneta-ai-school\build_output.log', 'r') as f:
    content = f.read()
    lines = content.split('\n')
    print("Last 10 lines of build output:")
    for line in lines[-10:]:
        if line.strip():
            print(line)
    
    if 'error' in content.lower():
        print("\nERROR FOUND:")
        for line in lines:
            if 'error' in line.lower():
                print(line)
    else:
        print("\nBuild successful - no errors found")
