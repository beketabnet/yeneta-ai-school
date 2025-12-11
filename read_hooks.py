import os

hooks_to_read = [
    'hooks/useTeacherEnrolledStudents.ts',
    'hooks/useTeacherGradebook.ts',
    'hooks/useTeacherSubjectGrades.ts',
    'hooks/useAdminEnrollmentRequests.ts'
]

for hook_file in hooks_to_read:
    if os.path.exists(hook_file):
        print(f"\n{'='*60}")
        print(f"FILE: {hook_file}")
        print('='*60)
        with open(hook_file, 'r') as f:
            print(f.read())
