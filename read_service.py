with open('yeneta_backend/academics/services_grade_entry_enhanced.py', 'r') as f:
    content = f.read()

start_idx = content.find('def get_teacher_enrolled_subjects_with_students')
if start_idx > -1:
    end_idx = content.find('\n    @staticmethod\n', start_idx + 1)
    if end_idx == -1:
        end_idx = content.find('\n    def ', start_idx + 1)
    if end_idx == -1:
        end_idx = len(content)
    
    func_content = content[start_idx:end_idx]
    with open('service_output.txt', 'w') as out:
        out.write(func_content)
    print(f"Written {len(func_content)} bytes to service_output.txt")
else:
    print("Function not found")
