import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from communications.models import StudentAssignment
from academics.models import StudentGrade

User = get_user_model()

def verify_sync():
    print("Verifying StudentAssignment -> StudentGrade synchronization...")
    
    # 1. Setup Test Data
    # Get or create a student and teacher
    student, _ = User.objects.get_or_create(username='sync_test_student', defaults={'role': 'Student', 'email': 'student@test.com'})
    teacher, _ = User.objects.get_or_create(username='sync_test_teacher', defaults={'role': 'Teacher', 'email': 'teacher@test.com'})
    student.set_password('password')
    student.save()
    teacher.set_password('password')
    teacher.save()
    
    subject = "Sync Test Subject"
    topic = "Sync Test Assignment"
    
    # Clean up existing data
    StudentAssignment.objects.filter(student=student, assignment_topic=topic).delete()
    StudentGrade.objects.filter(student=student, title=topic).delete()
    
    print("Created test users and cleaned up old data.")
    
    # 2. Create StudentAssignment
    assignment = StudentAssignment.objects.create(
        student=student,
        teacher=teacher,
        assignment_topic=topic,
        document_type='essay',
        subject=subject,
        grade_level='Grade 12'
    )
    print(f"Created assignment: {assignment}")
    
    # Verify no grade exists yet
    grades_count = StudentGrade.objects.filter(student=student, title=topic).count()
    if grades_count != 0:
        print("FAIL: StudentGrade should not exist yet.")
        return
    print("Verified no grade exists before grading.")
    
    # 3. Grade the Assignment
    print("Grading assignment...")
    assignment.grade = 85.5
    assignment.is_graded = True
    assignment.feedback = "Good job!"
    assignment.save() # This should trigger the signal
    
    # 4. Verify Sync
    try:
        synced_grade = StudentGrade.objects.get(student=student, title=topic)
        print(f"FOUND Synced Grade: {synced_grade.score}")
        
        if synced_grade.score == 85.5:
            print("PASS: Score matches.")
        else:
            print(f"FAIL: Score mismatch. Expected 85.5, got {synced_grade.score}")
            
        if synced_grade.assignment_type == 'essay':
            print("PASS: Assignment type mapped correctly.")
        else:
            print(f"FAIL: Assignment type mismatch. Expected 'essay', got '{synced_grade.assignment_type}'")
            
        if synced_grade.subject == subject:
             print("PASS: Subject matches.")
        
    except StudentGrade.DoesNotExist:
        print("FAIL: StudentGrade was NOT created by the signal.")
    except Exception as e:
        print(f"ERROR: {str(e)}")

    # 5. Clean up
    # assignment.delete()
    # StudentGrade.objects.filter(student=student, title=topic).delete()
    # student.delete()
    # teacher.delete()

if __name__ == "__main__":
    verify_sync()
