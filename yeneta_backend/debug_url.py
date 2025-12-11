
import os
import django
from django.urls import resolve, reverse

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from ai_tools.models import SavedLesson
from django.contrib.auth import get_user_model

User = get_user_model()

def check_url():
    path = '/api/ai-tools/saved-lessons/23/export/'
    try:
        match = resolve(path)
        print(f"URL '{path}' resolves to: {match.func.__name__} in {match.view_name}")
    except Exception as e:
        print(f"URL '{path}' failed to resolve: {e}")

    try:
        lesson = SavedLesson.objects.get(id=23)
        print(f"Lesson 23 exists: {lesson.title} by {lesson.created_by}")
    except SavedLesson.DoesNotExist:
        print("Lesson 23 does not exist")

if __name__ == '__main__':
    check_url()
