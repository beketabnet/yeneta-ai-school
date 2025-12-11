#!/usr/bin/env python
with open('tests/gradebook-manager-realtime.spec.ts', 'r') as f:
    content = f.read()
    with open('all_tests_output.txt', 'w') as out:
        out.write(content)
    print("Test file saved to all_tests_output.txt")
    print(f"Total length: {len(content)} characters")
