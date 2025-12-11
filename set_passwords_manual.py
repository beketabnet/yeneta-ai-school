import sqlite3
import hashlib
import os
from base64 import b64encode

def make_password_pbkdf2(password, salt=None, iterations=600000):
    """Generate Django PBKDF2 password hash"""
    if salt is None:
        salt = os.urandom(12)
    
    hash_obj = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, iterations)
    b64_salt = b64encode(salt).decode('ascii')
    b64_hash = b64encode(hash_obj).decode('ascii')
    return f'pbkdf2_sha256${iterations}${b64_salt}${b64_hash}'

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
    hashed_password = make_password_pbkdf2(password)
    
    # Update user password
    cursor.execute("UPDATE users SET password = ? WHERE email = ?", (hashed_password, email))
    conn.commit()
    print(f"[OK] Updated password for {email}")

conn.close()
print("\nPassword setup complete!")
