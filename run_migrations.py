import subprocess
import sys
import os

# Set the working directory to the project root
os.chdir('d:/django_project/yeneta-ai-school')

def run_command(command):
    print(f"Running: {command}")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_command("python manage.py makemigrations ai_tools")
    run_command("python manage.py migrate")
