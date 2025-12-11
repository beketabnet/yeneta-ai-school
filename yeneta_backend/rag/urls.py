from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'vector-stores', views.VectorStoreViewSet, basename='vector-store')
router.register(r'exam-vector-stores', views.ExamVectorStoreViewSet, basename='exam-vector-store')

urlpatterns = [
    path('', include(router.urls)),
    path('curriculum-config/', views.get_curriculum_config, name='curriculum-config'),
]
