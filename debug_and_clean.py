import os
import shutil
import sys

def clean_pycache(root_dir):
    print(f"Cleaning pycache in {root_dir}")
    deleted_dirs = 0
    deleted_files = 0
    
    for root, dirs, files in os.walk(root_dir):
        if '__pycache__' in dirs:
            pycache_path = os.path.join(root, '__pycache__')
            print(f"Removing {pycache_path}")
            try:
                shutil.rmtree(pycache_path)
                deleted_dirs += 1
            except Exception as e:
                print(f"Error removing {pycache_path}: {e}")
            dirs.remove('__pycache__')  # Don't visit __pycache__ directories

        for file in files:
            if file.endswith('.pyc') or file.endswith('.pyo'):
                file_path = os.path.join(root, file)
                print(f"Removing {file_path}")
                try:
                    os.remove(file_path)
                    deleted_files += 1
                except Exception as e:
                    print(f"Error removing {file_path}: {e}")

    print(f"Cleaned {deleted_dirs} __pycache__ directories and {deleted_files} .pyc files.")

def verify_file_content():
    file_path = os.path.join('yeneta_backend', 'ai_tools', 'views.py')
    print(f"\nVerifying content of {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'failed to exxtract' in content:
                print("❌ FOUND TYPO 'exxtract' IN FILE ON DISK!")
            elif 'failed to extract' in content:
                print("✅ Found correct spelling 'extract' in file on disk.")
            else:
                print("❓ Could not find the warning message in the file at all.")
                
            if 'logger.warning' in content:
                 print("Logger warning is present.")
    except Exception as e:
        print(f"Error reading file: {e}")

if __name__ == "__main__":
    base_dir = os.getcwd()
    clean_pycache(base_dir)
    verify_file_content()
