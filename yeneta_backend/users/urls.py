from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'families', views.FamilyViewSet, basename='family')
router.register(r'family-memberships', views.FamilyMembershipViewSet, basename='family_membership')
router.register(r'documents', views.UserDocumentViewSet, basename='user_documents')

urlpatterns = [
    # Authentication
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    
    # User management
    path('me/', views.current_user_view, name='current_user'),
    path('', views.UserListView.as_view(), name='user_list'),
    path('<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('<int:pk>/status/', views.update_user_status_view, name='update_user_status'),
    
    # Role-specific endpoints
    path('students/', views.students_list_view, name='students_list'),
    path('my-children/', views.my_children_view, name='my_children'),
    path('unlinked-students/', views.unlinked_students_view, name='unlinked_students'),
    path('link-child/', views.link_child_view, name='link_child'),
    
    # Family management
    path('student-families/', views.student_families_view, name='student_families'),
    path('search-families/', views.search_families_view, name='search_families'),
    
    # Router endpoints
    path('', include(router.urls)),
]
