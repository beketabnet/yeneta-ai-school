with open('D:/django_project/yeneta-ai-school/components/teacher/gradebook/EnrolledSubjectsTable.tsx') as f:
    lines = f.readlines()
    print(f"Total lines: {len(lines)}")
    # Print last 10 lines
    print("".join(lines[-10:]))
