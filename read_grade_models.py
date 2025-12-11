import os
with open('D:/django_project/yeneta-ai-school/yeneta_backend/academics/models.py') as f:
    content = f.read()
    # Find GradeItem, Grade, and StudentGrade classes
    start_idx = content.find('class GradeItem(models.Model)')
    end_idx = content.find('class StudentGrade(models.Model)')
    if start_idx > 0 and end_idx > start_idx:
        print(content[start_idx:end_idx+2000])
