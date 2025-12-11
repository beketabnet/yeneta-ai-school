from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, api_key_views, views_quiz

router = DefaultRouter()
router.register(r'assignments', views.AssignmentViewSet, basename='assignment')
router.register(r'submissions', views.SubmissionViewSet, basename='submission')
router.register(r'teacher-course-requests', views.TeacherCourseRequestViewSet, basename='teacher-course-request')
router.register(r'student-enrollment-requests', views.StudentEnrollmentRequestViewSet, basename='student-enrollment-request')
router.register(r'my-enrollment-requests', views.StudentEnrollmentRequestViewSet, basename='my-enrollment-request')
router.register(r'student-grades', views.StudentGradeViewSet, basename='student-grade')
# Quiz Routes
router.register(r'quizzes', views_quiz.OnlineQuizViewSet, basename='online-quiz')
router.register(r'quiz-attempts', views_quiz.QuizAttemptViewSet, basename='quiz-attempt')
router.register(r'master-courses', views.MasterCourseViewSet, basename='master-course')
router.register(r'regions', views.RegionViewSet, basename='region')
router.register(r'grade-levels', views.GradeLevelViewSet, basename='grade-level')
router.register(r'streams', views.StreamViewSet, basename='stream')
router.register(r'subjects', views.SubjectViewSet, basename='subject')
router.register(r'curriculum', views.CurriculumViewSet, basename='curriculum')
# New Router registrations

router.register(r'questions', views_quiz.QuestionViewSet, basename='question')
router.register(r'assignment-types-api', views.AssignmentTypeViewSet, basename='assignment-type')
router.register(r'exam-types-api', views.ExamTypeViewSet, basename='exam-type')


urlpatterns = [
    path('student-grades-history/', views.student_grades_history_view, name='student_grades_history'),
    path('', include(router.urls)),
    path('my-grades/', views.my_grades_view, name='my_grades'),
    path('child-summary/<int:child_id>/', views.child_summary_view, name='child_summary'),
    path('practice-questions/', views.practice_questions_view, name='practice_questions'),
    path('available-courses/', views.available_courses_view, name='available_courses'),
    path('approved-teacher-courses/', views.available_courses_view, name='approved-teacher-courses'),
    path('student-parents/', views.student_parents_view, name='student_parents'),
    path('parent-linked-students/', views.parent_linked_students_view, name='parent_linked_students'),
    path('parent-child-grades/', views.parent_child_grades_view, name='parent_child_grades'),
    path('my-enrollment-requests/', views.my_enrollment_requests_view, name='my_enrollment_requests'),
    path('parent-enrolled-subjects/', views.parent_enrolled_subjects_view, name='parent_enrolled_subjects'),
    path('parent-enrolled-subjects-analytics/', views.parent_enrolled_subjects_analytics_view, name='parent_enrolled_subjects_analytics'),
    path('parent-academic-analytics/', views.parent_academic_analytics_view, name='parent_academic_analytics'),
    path('approved-courses-with-grades/', views.approved_courses_with_grades_view, name='approved_courses_with_grades'),
    path('approved-teachers-for-student/', views.approved_teachers_for_student_view, name='approved_teachers_for_student'),
    path('teacher-active-courses/', views.teacher_active_courses_view, name='teacher_active_courses'),
    path('teacher-enrolled-students/', views.teacher_enrolled_students_view, name='teacher_enrolled_students'),
    path('teacher-gradebook/', views.teacher_gradebook_view, name='teacher_gradebook'),
    path('admin-enrollment-requests/', views.admin_enrollment_requests_view, name='admin_enrollment_requests'),
    path('student-gradebook/', views.student_gradebook_view, name='student_gradebook'),
    path('subject-teacher-info/', views.subject_teacher_info_view, name='subject_teacher_info'),
    path('student-enrolled-subjects/', views.student_enrolled_subjects_view, name='student_enrolled_subjects'),
    path('student-family-grades/', views.student_family_grades_view, name='student_family_grades'),
    path('filter-courses-by-family/', views.filter_courses_by_family, name='filter_courses_by_family'),

    # Grade Entry Endpoints
    path('teacher-enrolled-subjects/', views.teacher_enrolled_subjects, name='teacher_enrolled_subjects'),
    path('subject-students-with-grades/<int:subject_id>/', views.subject_students_with_grades, name='subject_students_with_grades'),
    path('subject-grade-summary/<int:subject_id>/', views.subject_grade_summary, name='subject_grade_summary'),
    path('bulk-grade-entry/', views.bulk_grade_entry, name='bulk_grade_entry'),
    path('subject-assignments-exams/<int:subject_id>/', views.subject_assignments_exams, name='subject_assignments_exams'),
    
    # Enhanced Grade Entry Endpoints
    path('teacher-enrolled-subjects-with-students/', views.teacher_enrolled_subjects_with_students, name='teacher_enrolled_subjects_with_students'),
    path('subject-students-for-grading/<int:subject_id>/', views.subject_students_for_grading, name='subject_students_for_grading'),
    path('student-grades-for-subject/<int:student_id>/', views.student_grades_for_subject, name='student_grades_for_subject'),
    path('save-student-grade/', views.save_student_grade, name='save_student_grade'),
    path('grade-statistics-for-subject/<str:subject_name>/', views.grade_statistics_for_subject, name='grade_statistics_for_subject'),
    
    # API Key Management endpoints
    path('admin/api-keys/', api_key_views.api_keys_handler, name='api-keys-handler'),
    path('admin/api-keys/<int:key_id>/', api_key_views.api_key_detail_handler, name='api-key-detail-handler'),
    path('admin/api-keys/<int:key_id>/deactivate/', api_key_views.deactivate_api_key, name='deactivate-api-key'),
    path('admin/api-keys/<int:key_id>/reactivate/', api_key_views.reactivate_api_key, name='reactivate-api-key'),
    path('admin/api-keys/<int:key_id>/logs/', api_key_views.get_api_key_logs, name='get-api-key-logs'),
    path('admin/api-keys/available/', api_key_views.get_available_keys, name='get-available-keys'),

    path('assignment-types/', views.assignment_types_view, name='assignment_types'),
    path('teacher-student-assignment-topics/', views.teacher_student_assignment_topics_view, name='teacher_student_assignment_topics'),
    path('teacher-student-assignment-submissions/', views.teacher_student_assignment_submissions_view, name='teacher_student_assignment_submissions'),
    
    # Quiz Generation Endpoint
    path('generate-quiz/', views_quiz.generate_quiz_view, name='generate_quiz'),
    
    # Assignment Generation & Parsing
    path('generate-assignment/', views.generate_assignment_view, name='generate_assignment'),
    path('parse-assignment/', views.parse_assignment_view, name='parse_assignment'),

    # Grade Types API
    path('grade-types/', views.grade_types_view, name='grade-types'),
]
