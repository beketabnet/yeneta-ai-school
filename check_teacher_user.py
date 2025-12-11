import sqlite3

db_path = 'yeneta_backend/db.sqlite3'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if teacher user exists
cursor.execute("SELECT id, username, email, role FROM users WHERE role = 'Teacher' LIMIT 1")
result = cursor.fetchone()
if result:
    print(f"Found teacher user: {result}")
else:
    print("No teacher user found")

# List all users
cursor.execute("SELECT id, username, email, role FROM users LIMIT 10")
all_users = cursor.fetchall()
print(f"\nAll users ({len(all_users)} shown):")
for user in all_users:
    print(f"  {user}")

conn.close()
