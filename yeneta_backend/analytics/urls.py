from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import engagement_views

router = DefaultRouter()
router.register(r'engagement-trends-data', views.EngagementTrendViewSet, basename='engagement-trend')
router.register(r'learning-outcomes-data', views.LearningOutcomeViewSet, basename='learning-outcome')
router.register(r'engagement-sessions', engagement_views.EngagementSessionViewSet, basename='engagement-session')
router.register(r'engagement-summaries', engagement_views.EngagementSummaryViewSet, basename='engagement-summary')

urlpatterns = [
    path('', include(router.urls)),
    path('engagement-trends/', views.engagement_trends_view, name='engagement_trends'),
    path('learning-outcomes/', views.learning_outcomes_view, name='learning_outcomes'),
    
    # Live engagement monitoring
    path('live-engagement/', engagement_views.live_engagement_view, name='live_engagement'),
    path('engagement-trends-enhanced/', engagement_views.engagement_trends_view_enhanced, name='engagement_trends_enhanced'),
    path('student-engagement-history/', engagement_views.student_engagement_history_view, name='student_engagement_history'),
    path('generate-daily-summary/', engagement_views.generate_daily_summary_view, name='generate_daily_summary'),
]
