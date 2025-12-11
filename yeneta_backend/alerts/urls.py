from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'smart-alerts', views.SmartAlertViewSet, basename='smart-alert')
router.register(r'student-feedbacks', views.StudentFeedbackViewSet, basename='student-feedback')

urlpatterns = [
    path('', include(router.urls)),
]
