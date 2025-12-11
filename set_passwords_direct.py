import sqlite3
from django.contrib.auth.hashers import make_password

db_path = 'yeneta_backend/db.sqlite3'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

test_users = [
    ('teacher@yeneta.com', 'password'),
    ('student@yeneta.com', 'password'),
    ('parent@yeneta.com', 'password'),
]

for email, password in test_users:
    # Generate Django password hash
    hashed_password = make_password(password)
    
    # Update user password
    cursor.execute("UPDATE users SET password = ? WHERE email = ?", (hashed_password, email))
    conn.commit()
    print(f"[OK] Updated password for {email}")

conn.close()
print("\nPassword setup complete!")
