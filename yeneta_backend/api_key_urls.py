"""
URL Configuration for API Key Management Endpoints
Add these URLs to your main urls.py under /academics/ path
"""

from django.urls import path
from . import api_key_admin_views

urlpatterns = [
    # List and create API keys
    path('admin/api-keys/', api_key_admin_views.list_api_keys, name='list-api-keys'),
    path('admin/api-keys/', api_key_admin_views.create_api_key, name='create-api-key'),
    
    # Update, deactivate, reactivate, delete API keys
    path('admin/api-keys/<int:key_id>/', api_key_admin_views.update_api_key, name='update-api-key'),
    path('admin/api-keys/<int:key_id>/', api_key_admin_views.delete_api_key, name='delete-api-key'),
    path('admin/api-keys/<int:key_id>/deactivate/', api_key_admin_views.deactivate_api_key, name='deactivate-api-key'),
    path('admin/api-keys/<int:key_id>/reactivate/', api_key_admin_views.reactivate_api_key, name='reactivate-api-key'),
    
    # Get logs for a specific key
    path('admin/api-keys/<int:key_id>/logs/', api_key_admin_views.get_api_key_logs, name='get-api-key-logs'),
    
    # Get available keys for a provider
    path('admin/api-keys/available/', api_key_admin_views.get_available_keys, name='get-available-keys'),
]
