import sys
with open('components/admin/AdminEnrollmentApprovalManager.tsx', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        print(line.rstrip())
