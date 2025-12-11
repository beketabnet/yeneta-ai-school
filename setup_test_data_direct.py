#!/usr/bin/env python
import sqlite3
import os
from datetime import datetime
from pathlib import Path

# Find the database file
db_path = Path('yeneta_backend/db.sqlite3')

if not db_path.exists():
    print(f"Database not found at {db_path}")
    print("Attempting to find database...")
    for root, dirs, files in os.walk('yeneta_backend'):
        for file in files:
            if file.endswith('.sqlite3'):
                db_path = Path(root) / file
                print(f"Found database at {db_path}")
                break

if not db_path.exists():
    print("Could not find database file. Exiting.")
    exit(1)

print(f"Using database: {db_path}")

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Define current timestamp
now = datetime.now().isoformat()

# Get the teacher and admin users
cursor.execute("SELECT id FROM users WHERE username = 'teacher' AND role = 'Teacher'")
teacher_result = cursor.fetchone()
if not teacher_result:
    print("Teacher user not found. Ensure setup_test_users.py has been run.")
    exit(1)

teacher_id = teacher_result[0]

cursor.execute("SELECT id FROM users WHERE username = 'admin' AND role = 'Admin'")
admin_result = cursor.fetchone()
if not admin_result:
    print("Admin user not found.")
    exit(1)

admin_id = admin_result[0]

# Get or create students
student_names = [
    ('student1', 'Abebe', 'Kebede'),
    ('student2', 'Almaz', 'Tadesse'),
    ('student3', 'Biruk', 'Getachew'),
    ('student4', 'Chaltu', 'Mekonnen'),
    ('student5', 'Dawit', 'Yoseph'),
]

student_ids = []
for username, first_name, last_name in student_names:
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    student_result = cursor.fetchone()
    
    if not student_result:
        # Create student
        cursor.execute("""
            INSERT INTO users (username, email, first_name, last_name, role, grade_level, is_active, is_superuser, is_staff, password, date_joined)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            username,
            f'{username}@yeneta.ai',
            first_name,
            last_name,
            'Student',
            'Grade 6',
            1,
            0,  # is_superuser
            0,  # is_staff
            '',  # Empty password
            now
        ))
        conn.commit()
        student_ids.append(cursor.lastrowid)
        print(f"[OK] Created student: {first_name} {last_name}")
    else:
        student_ids.append(student_result[0])
        print(f"[OK] Found student: {first_name} {last_name}")

# Create teacher course requests (approved)
subjects = ['Mathematics', 'English', 'Science', 'History', 'Geography']
grades = ['KG', '1', '2', '3', '4', '5']

for subject in subjects[:3]:
    for grade in grades[:4]:
        # Check if course request already exists
        cursor.execute("""
            SELECT id FROM academics_teachercourserequest
            WHERE teacher_id = ? AND subject = ? AND grade_level = ?
        """, (teacher_id, subject, grade))
        
        course_result = cursor.fetchone()
        
        if not course_result:
            cursor.execute("""
                INSERT INTO academics_teachercourserequest 
                (teacher_id, subject, grade_level, stream, status, requested_at, reviewed_at, reviewed_by_id, review_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                teacher_id,
                subject,
                grade,
                None,
                'approved',
                now,
                now,
                admin_id,
                'Approved for testing'
            ))
            conn.commit()
            print(f"[OK] Created approved course: {subject} - Grade {grade}")

# Create student enrollment requests (approved)
for i, student_id in enumerate(student_ids):
    for subject in subjects[:3]:
        cursor.execute("""
            SELECT id FROM academics_studentenrollmentrequest
            WHERE student_id = ? AND teacher_id = ? AND subject = ?
        """, (student_id, teacher_id, subject))
        
        enrollment_result = cursor.fetchone()
        
        if not enrollment_result:
            cursor.execute("""
                INSERT INTO academics_studentenrollmentrequest
                (student_id, teacher_id, subject, grade_level, stream, status, requested_at, reviewed_at, reviewed_by_id, review_notes, family_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                student_id,
                teacher_id,
                subject,
                f'Grade {(i % 6) + 1}',
                None,
                'approved',
                now,
                now,
                admin_id,
                'Approved for testing',
                None
            ))
            conn.commit()
            student_name = next((name[1] + ' ' + name[2] for name in student_names if name[0] == f'student{student_ids.index(student_id) + 1}'), 'Unknown')
            print(f"[OK] Created enrollment for student {student_id} in {subject}")

# Create sample grades
assignment_types = ['Assignment', 'Quiz']

for student_id in student_ids:
    for subject in subjects[:3]:
        for assignment_type in assignment_types:
            # Create grades with deterministic scores based on student and subject
            score = (hash(f"{student_id}_{subject}_{assignment_type}") % 50) + 60
            
            cursor.execute("""
                SELECT id FROM student_grades
                WHERE student_id = ? AND subject = ? AND assignment_type = ?
            """, (student_id, subject, assignment_type))
            
            grade_result = cursor.fetchone()
            
            if not grade_result:
                cursor.execute("""
                    INSERT INTO student_grades
                    (student_id, subject, assignment_type, exam_type, score, max_score, feedback, graded_by_id, graded_at, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    student_id,
                    subject,
                    assignment_type,
                    None,
                    score,
                    100,
                    f'Good work on {assignment_type}',
                    teacher_id,
                    now,
                    now,
                    now
                ))
                conn.commit()
                print(f"[OK] Created grade: Student {student_id} - {subject} - {assignment_type}: {score}")

conn.close()
print("\n[OK] Test data setup complete!")
print(f"Created {len(student_ids)} students")
print("Students are enrolled in courses and have grades entered")
