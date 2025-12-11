import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from academics.models import StudentEnrollmentRequest, StudentGrade
from django.contrib.auth import get_user_model

User = get_user_model()

def diagnose():
    # Find students with enrollments
    student_ids = StudentEnrollmentRequest.objects.filter(status='approved').values_list('student_id', flat=True).distinct()
    
    found_issues = False
    
    for student_id in student_ids:
        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            continue
            
        # Get courses
        enrollments = StudentEnrollmentRequest.objects.filter(student=student, status='approved')
        courses_dict = {}
        has_grades = StudentGrade.objects.filter(student=student).exists()
        
        if not has_grades:
            continue
            
        print(f"\n--- Diagnosing Student: {student.username} (ID: {student.id}) ---")

        for enrollment in enrollments:
            # Simulate the key used in views.py
            course_key = f"{enrollment.subject}_{enrollment.grade_level}_{enrollment.stream or ''}"
            courses_dict[course_key] = {
                'subject': enrollment.subject,
                'grade_level': enrollment.grade_level,
                'stream': enrollment.stream
            }
            # print(f"  Enrolled Course: Subject='{enrollment.subject}', Level='{enrollment.grade_level}', Stream='{enrollment.stream}'")

        # Get grades
        grades = StudentGrade.objects.filter(student=student)
        
        for grade in grades:
            # Match Logic simulation
            matched = False
            target_course = None
            
            for key, course in courses_dict.items():
                
                # Check Subject
                subj_match = grade.subject == course['subject']
                
                # Check Grade Level (Flexible)
                g_grade = str(grade.grade_level).replace('Grade ', '').replace('Grade', '').strip()
                c_grade = str(course['grade_level']).replace('Grade ', '').replace('Grade', '').strip()
                grade_match = g_grade == c_grade
                
                # Check Stream (Relaxed)
                stream_match = (grade.stream is None or grade.stream == '' or grade.stream == course['stream'])
                
                if subj_match and grade_match and stream_match:
                    matched = True
                    target_course = course
                    break
            
            if matched:
                # Check Classification
                is_assignment = grade.assignment_type or grade.category == 'Assignment'
                is_exam = grade.exam_type or grade.category == 'Exam'
                
                print(f"  [MATCH] Grade ID {grade.id} -> Course '{target_course['subject']}'")
                print(f"          Types: Assign Type='{grade.assignment_type}', Exam Type='{grade.exam_type}', Cat='{grade.category}'")
                print(f"          Classified as: Assignment={bool(is_assignment)}, Exam={bool(is_exam)}")
                
                if not is_assignment and not is_exam:
                     print("          [WARNING] Grade matched but is NEITHER Assignment NOR Exam. Will not count towards overall avg.")
                     found_issues = True
            else:
                found_issues = True
                print(f"  [FAIL]  Grade ID {grade.id}: Subject='{grade.subject}', Level='{grade.grade_level}', Stream='{grade.stream}'")
                # Detailed Breakdown
                candidates = [c for c in courses_dict.values() if c['subject'] == grade.subject]
                if candidates:
                    for course in candidates:
                         print(f"      vs Candidate: Subject='{course['subject']}', Level='{course['grade_level']}', Stream='{course['stream']}'")
                         
                         g_grade = str(grade.grade_level).replace('Grade ', '').replace('Grade', '').strip()
                         c_grade = str(course['grade_level']).replace('Grade ', '').replace('Grade', '').strip()
                         
                         print(f"         - Subject Match: {grade.subject == course['subject']}")
                         print(f"         - Grade Match:   {g_grade == c_grade} ('{g_grade}' vs '{c_grade}')")
                         print(f"         - Stream Match:  {(grade.stream is None or grade.stream == '' or grade.stream == course['stream'])} ('{grade.stream}' vs '{course['stream']}')")
                else:
                    print(f"      No candidate courses found for subject '{grade.subject}'")

    if not found_issues:
        print("\nNo matching failures found with current logic.")
    else:
        print("\nFound matching failures.")

if __name__ == '__main__':
    diagnose()
