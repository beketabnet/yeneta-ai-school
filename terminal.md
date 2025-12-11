(yeneta-ai-school) PS D:\django_project\yeneta-ai-school\yeneta_backend> uv run manage.py runserver
Watching for file changes with StatReloader
Performing system checks...

DEBUG: RELOADING ai_tools.views MODULE --------------------------------------------------
OpenAI API key not found
DEBUG: RELOADING ai_tools.urls MODULE --------------------------------------------------
System check identified no issues (0 silenced).
December 10, 2025 - 17:35:39
Django version 4.2.26, using settings 'yeneta_backend.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.

[10/Dec/2025 17:35:40] "GET /api/users/me/ HTTP/1.1" 200 513
[10/Dec/2025 17:35:40] "GET /api/users/me/ HTTP/1.1" 200 513
[10/Dec/2025 17:36:31] "GET /api/academics/grade-levels/ HTTP/1.1" 200 695
[10/Dec/2025 17:36:31] "GET /api/academics/streams/ HTTP/1.1" 200 165
[10/Dec/2025 17:36:31] "GET /api/academics/regions/ HTTP/1.1" 200 825
[10/Dec/2025 17:36:31] "GET /api/academics/regions/ HTTP/1.1" 200 825
[10/Dec/2025 17:36:31] "GET /api/academics/subjects/ HTTP/1.1" 200 3208
[10/Dec/2025 17:36:31] "GET /api/academics/grade-levels/ HTTP/1.1" 200 695
[10/Dec/2025 17:36:31] "GET /api/academics/streams/ HTTP/1.1" 200 165
[10/Dec/2025 17:36:31] "GET /api/academics/subjects/ HTTP/1.1" 200 3208
[10/Dec/2025 17:36:35] "OPTIONS /api/rag/curriculum-config/?grade=Grade+7 HTTP/1.1" 200 0
[10/Dec/2025 17:36:35] "GET /api/rag/curriculum-config/?grade=Grade+7 HTTP/1.1" 200 331
[10/Dec/2025 17:36:52] "OPTIONS /api/ai-tools/generate-ai-teacher-lesson/ HTTP/1.1" 200 0
❌ Error in RAG processing for AI Teacher lesson: No module named 'ai_tools.lesson_planner_rag_enhancer'
Traceback (most recent call last):
  File "D:\django_project\yeneta-ai-school\yeneta_backend\ai_tools\views.py", line 1404, in generate_ai_teacher_lesson_view
    from .lesson_planner_rag_enhancer import LessonPlannerRAGEnhancer        
ModuleNotFoundError: No module named 'ai_tools.lesson_planner_rag_enhancer'  
Non-recoverable error with gemini: 404 models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.
Gemini generation failed with all keys: 404 models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.     
