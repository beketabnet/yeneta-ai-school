import sqlite3

db_path = 'yeneta_backend/db.sqlite3'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check password for teacher
cursor.execute("SELECT id, username, email, role, password FROM users WHERE role = 'Teacher' LIMIT 3")
users = cursor.fetchall()
print("Teacher users:")
for user in users:
    print(f"  ID: {user[0]}, Username: {user[1]}, Email: {user[2]}, Password: {user[4][:50] if user[4] else 'None'}")

conn.close()
