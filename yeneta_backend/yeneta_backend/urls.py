"""
URL configuration for yeneta_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/users/', include('users.urls')),
    path('api/rag/', include('rag.urls')),
    path('api/ai-tools/', include('ai_tools.urls')),  # Changed from 'api/ai/' to 'api/ai-tools/'
    path('api/academics/', include('academics.urls')),
    path('api/communications/', include('communications.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/alerts/', include('alerts.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
