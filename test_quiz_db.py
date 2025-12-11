import os
import django
import sys

# Setup Django environment
sys.path.append('d:\\django_project\\yeneta-ai-school')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from academics.models_quiz import OnlineQuiz
from users.models import User

def test_create_quiz():
    try:
        # Get a teacher user (assuming one exists, or create one)
        teacher = User.objects.filter(role='Teacher').first()
        if not teacher:
            print("No teacher found. Creating a dummy teacher.")
            teacher = User.objects.create_user(username='test_teacher', password='password', role='Teacher')

        # Try creating a quiz with the new fields
        quiz = OnlineQuiz.objects.create(
            title="Test Quiz DB Fix 2",
            description="Testing database schema again",
            subject="Math",
            grade_level="Grade 10",
            teacher=teacher,
            difficulty="Hard",  # New field
            use_rag=True        # New field
        )
        print(f"Successfully created quiz: {quiz.title} (ID: {quiz.id})")
        print(f"Difficulty: {quiz.difficulty}, Use RAG: {quiz.use_rag}")
        
        # Clean up
        quiz.delete()
        print("Test quiz deleted.")
        
    except Exception as e:
        print(f"Error creating quiz: {e}")

if __name__ == "__main__":
    test_create_quiz()
