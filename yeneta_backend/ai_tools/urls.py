from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router for ViewSets
router = DefaultRouter()
router.register(r'saved-lesson-plans', views.SavedLessonPlanViewSet, basename='saved-lesson-plan')
router.register(r'saved-rubrics', views.SavedRubricViewSet, basename='saved-rubric')
router.register(r'saved-lessons', views.SavedLessonViewSet, basename='saved-lesson')
router.register(r'shared-files', views.SharedFileViewSet, basename='shared-file')

urlpatterns = [
    # AI Endpoints
    path('tutor/', views.tutor_view, name='ai_tutor'),
    path('tutor-configuration/', views.tutor_configuration_view, name='tutor_configuration'),
    path('generate-tutor-welcome/', views.generate_tutor_welcome_message_view, name='generate_tutor_welcome'),
    path('lesson-planner/', views.lesson_planner_view, name='lesson_planner'),
    path('generate-teacher-note/', views.generate_teacher_note_view, name='generate_teacher_note'),
    path('generate-ai-teacher-lesson/', views.generate_ai_teacher_lesson_view, name='generate_ai_teacher_lesson'),
    path('student-insights/', views.student_insights_view, name='student_insights'),
    path('generate-rubric/', views.generate_rubric_view, name='generate_rubric'),
    path('export-rubric/', views.export_rubric_view, name='export_rubric'),
    path('grade-submission/', views.grade_submission_view, name='grade_submission'),
    path('check-authenticity/', views.check_authenticity_view, name='check_authenticity'),
    path('evaluate-practice-answer/', views.evaluate_practice_answer_view, name='evaluate_practice_answer'),
    path('summarize-conversation/', views.summarize_conversation_view, name='summarize_conversation'),
    path('analyze-alert/', views.analyze_alert_view, name='analyze_alert'),
    
    # Practice Labs - Adaptive AI Coaching System
    path('generate-practice-question/', views.generate_practice_question_view, name='generate_practice_question'),
    path('evaluate-practice-answer-adaptive/', views.evaluate_practice_answer_adaptive_view, name='evaluate_practice_answer_adaptive'),
    path('get-diagnostic-test/', views.get_diagnostic_test_view, name='get_diagnostic_test'),
    path('evaluate-diagnostic-test/', views.evaluate_diagnostic_test_view, name='evaluate_diagnostic_test'),
    path('get-session-reflection/', views.get_session_reflection_view, name='get_session_reflection'),
    
    # Practice Labs - Enhanced Features (Research Document)
    path('generate-two-layer-hints/', views.generate_two_layer_hints_view, name='generate_two_layer_hints'),
    path('calculate-zpd-score/', views.calculate_zpd_score_view, name='calculate_zpd_score'),
    path('detect-misconceptions/', views.detect_misconceptions_view, name='detect_misconceptions'),
    path('get-badges/', views.get_badges_view, name='get_badges'),
    path('get-missions/', views.get_missions_view, name='get_missions'),
    
    # System & Analytics Endpoints
    path('system-status/', views.system_status_view, name='system_status'),
    path('cost-analytics/', views.cost_analytics_view, name='cost_analytics'),
    path('cost-summary/', views.cost_summary_view, name='cost_summary'),
    path('web-search/', views.web_search_view, name='web_search'),
    
    # Chapter Content Extraction
    path('extract-chapter-content/', views.extract_chapter_content_view, name='extract_chapter_content'),
    path('extract-curriculum-content/', views.extract_curriculum_content_view, name='extract_curriculum_content'),
    path('extract-chapters/', views.extract_chapters_view, name='extract_chapters'),
    
    # Assignment Description Generation
    path('generate-assignment-description/', views.generate_assignment_description_view, name='generate_assignment_description'),
    
    # File Text Extraction
    path('extract-file-text/', views.extract_file_text_view, name='extract_file_text'),

    # General AI Endpoints
    path('chat/', views.chat_view, name='chat'),
    path('generate-content/', views.generate_content_view, name='generate_content'),
    path('generate-image/', views.generate_image_view, name='generate_image'),
    
    # Explicit export path to debug 404
    path('saved-lessons/<int:pk>/export/', views.debug_export_view, name='saved_lesson_export_manual'),

    # Include router URLs for ViewSets
    path('', include(router.urls)),
    
    # Catch-all for debugging
    # re_path(r'^.*export/$', views.debug_export_view),
]

print("DEBUG: RELOADING ai_tools.urls MODULE --------------------------------------------------")
