from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'messages', views.MessageViewSet, basename='message')
router.register(r'file-notifications', views.SharedFileNotificationViewSet, basename='file-notification')
router.register(r'student-assignments', views.StudentAssignmentViewSet, basename='student-assignment')

router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'contacts', views.CommunicationContactsView, basename='communication-contacts')

urlpatterns = [
    path('', include(router.urls)),
]
