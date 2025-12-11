
import os
import django
import sys
from django.db import connection

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

def check_table():
    table_name = 'academics_apikey'
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=%s;", [table_name])
        if cursor.fetchone():
            print(f"Table '{table_name}' EXISTS.")
        else:
            print(f"Table '{table_name}' does NOT exist.")

if __name__ == "__main__":
    check_table()
