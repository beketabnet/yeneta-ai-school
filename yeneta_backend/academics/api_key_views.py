"""
Admin API Views for API Key Management
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .api_key_models import APIKey, APIKeyProvider, APIKeyLog
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def list_api_keys(request):
    """List all API keys with usage statistics"""
    try:
        provider_filter = request.query_params.get('provider')
        
        if provider_filter:
            keys = APIKey.objects.filter(provider__name=provider_filter)
        else:
            keys = APIKey.objects.all()
        
        data = []
        for key in keys:
            key.reset_minute_counter()
            key.reset_day_counter()
            
            # Determine tier based on token limits
            tier = 'free' if key.max_tokens_per_day <= 1000000 else 'paid'
            
            data.append({
                'id': key.id,
                'provider': key.provider.name,
                'provider_display': key.provider.display_name,
                'model_name': key.model_name,
                'tier': tier,
                'status': key.status,
                'is_active': key.is_active,
                'key_preview': key.key_value[:10] + '...',
                'key_value': key.key_value,
                'max_tokens_per_minute': key.max_tokens_per_minute,
                'max_tokens_per_day': key.max_tokens_per_day,
                'tokens_used_today': key.tokens_used_today,
                'tokens_used_this_minute': key.tokens_used_this_minute,
                'usage_percentage_day': round(key.get_usage_percentage_day(), 2),
                'usage_percentage_minute': round(key.get_usage_percentage_minute(), 2),
                'created_at': key.created_at.isoformat(),
                'updated_at': key.updated_at.isoformat(),
            })
        
        return Response({
            'count': len(data),
            'keys': data
        })
    except Exception as e:
        logger.error(f"Error listing API keys: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def create_api_key(request):
    """Create a new API key"""
    try:
        provider_name = request.data.get('provider')
        key_value = request.data.get('key_value')
        model_name = request.data.get('model_name')
        tier = request.data.get('tier', 'free')
        
        # Set default limits based on tier
        if tier == 'free':
            max_tokens_per_minute = request.data.get('max_tokens_per_minute', 60000)
            max_tokens_per_day = request.data.get('max_tokens_per_day', 1000000)
        else:
            max_tokens_per_minute = request.data.get('max_tokens_per_minute', 90000)
            max_tokens_per_day = request.data.get('max_tokens_per_day', 2000000)
        
        if not all([provider_name, key_value, model_name]):
            return Response(
                {'error': 'provider, key_value, and model_name are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if provider is valid
        valid_providers = dict(APIKeyProvider.PROVIDER_CHOICES)
        if provider_name not in valid_providers:
            return Response(
                {'error': f'Unknown provider: {provider_name}. Valid choices are: {", ".join(valid_providers.keys())}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create provider
        provider, created = APIKeyProvider.objects.get_or_create(
            name=provider_name,
            defaults={'display_name': valid_providers[provider_name]}
        )
        
        # Check for duplicate
        if APIKey.objects.filter(provider=provider, key_value=key_value).exists():
            return Response(
                {'error': 'This API key already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        api_key = APIKey.objects.create(
            provider=provider,
            key_value=key_value,
            model_name=model_name,
            max_tokens_per_minute=max_tokens_per_minute,
            max_tokens_per_day=max_tokens_per_day,
            created_by=request.user
        )
        
        APIKeyLog.objects.create(
            api_key=api_key,
            action='created',
            reason=f'Created by {request.user.username}'
        )
        
        logger.info(f"API key created: {provider_name} - {model_name}")
        
        return Response({
            'id': api_key.id,
            'provider': api_key.provider.name,
            'model_name': api_key.model_name,
            'status': api_key.status,
            'message': 'API key created successfully'
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Error creating API key: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def update_api_key(request, key_id):
    """Update an API key"""
    try:
        api_key = APIKey.objects.get(id=key_id)
        
        # Update fields
        if 'model_name' in request.data:
            api_key.model_name = request.data['model_name']
        if 'max_tokens_per_minute' in request.data:
            api_key.max_tokens_per_minute = request.data['max_tokens_per_minute']
        if 'max_tokens_per_day' in request.data:
            api_key.max_tokens_per_day = request.data['max_tokens_per_day']
        if 'status' in request.data:
            api_key.status = request.data['status']
        
        api_key.save()
        
        APIKeyLog.objects.create(
            api_key=api_key,
            action='updated',
            reason=f'Updated by {request.user.username}'
        )
        
        return Response({
            'id': api_key.id,
            'message': 'API key updated successfully'
        })
    
    except APIKey.DoesNotExist:
        return Response(
            {'error': 'API key not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error updating API key: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def deactivate_api_key(request, key_id):
    """Deactivate an API key"""
    try:
        api_key = APIKey.objects.get(id=key_id)
        reason = request.data.get('reason', 'Manual deactivation by admin')
        
        api_key.deactivate(reason)
        
        return Response({
            'id': api_key.id,
            'message': 'API key deactivated successfully'
        })
    
    except APIKey.DoesNotExist:
        return Response(
            {'error': 'API key not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error deactivating API key: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def reactivate_api_key(request, key_id):
    """Reactivate an API key"""
    try:
        api_key = APIKey.objects.get(id=key_id)
        api_key.reactivate()
        
        return Response({
            'id': api_key.id,
            'message': 'API key reactivated successfully'
        })
    
    except APIKey.DoesNotExist:
        return Response(
            {'error': 'API key not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error reactivating API key: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def delete_api_key(request, key_id):
    """Delete an API key"""
    try:
        api_key = APIKey.objects.get(id=key_id)
        
        APIKeyLog.objects.create(
            api_key=api_key,
            action='deleted',
            reason=f'Deleted by {request.user.username}'
        )
        
        api_key.delete()
        
        return Response({
            'message': 'API key deleted successfully'
        })
    
    except APIKey.DoesNotExist:
        return Response(
            {'error': 'API key not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error deleting API key: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_api_key_logs(request, key_id):
    """Get logs for a specific API key"""
    try:
        api_key = APIKey.objects.get(id=key_id)
        logs = APIKeyLog.objects.filter(api_key=api_key)[:100]  # Last 100 logs
        
        data = [{
            'id': log.id,
            'action': log.action,
            'tokens_used': log.tokens_used,
            'reason': log.reason,
            'created_at': log.created_at.isoformat()
        } for log in logs]
        
        return Response({
            'count': len(data),
            'logs': data
        })
    
    except APIKey.DoesNotExist:
        return Response(
            {'error': 'API key not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error fetching API key logs: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_available_keys(request):
    """Get available API keys for a provider"""
    try:
        provider_name = request.query_params.get('provider')
        tokens_needed = int(request.query_params.get('tokens_needed', 1000))
        
        if not provider_name:
            return Response(
                {'error': 'provider parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            provider = APIKeyProvider.objects.get(name=provider_name)
        except APIKeyProvider.DoesNotExist:
            return Response(
                {'error': f'Unknown provider: {provider_name}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        available_keys = []
        keys = APIKey.objects.filter(provider=provider, is_active=True, status='active')
        
        for key in keys:
            if key.is_available(tokens_needed):
                available_keys.append({
                    'id': key.id,
                    'model_name': key.model_name,
                    'key_preview': key.key_value[:10] + '...',
                    'usage_percentage_day': round(key.get_usage_percentage_day(), 2),
                    'usage_percentage_minute': round(key.get_usage_percentage_minute(), 2),
                })
        
        return Response({
            'provider': provider_name,
            'tokens_needed': tokens_needed,
            'available_count': len(available_keys),
            'keys': available_keys
        })
    
    except Exception as e:
        logger.error(f"Error fetching available keys: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def api_keys_handler(request):
    """Handle both GET (list) and POST (create) for API keys"""
    if request.method == 'GET':
        return list_api_keys(request)
    elif request.method == 'POST':
        return create_api_key(request)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def api_key_detail_handler(request, key_id):
    """Handle GET, PUT, and DELETE for individual API keys"""
    if request.method == 'GET':
        # Get single key details
        try:
            api_key = APIKey.objects.get(id=key_id)
            api_key.reset_minute_counter()
            api_key.reset_day_counter()
            
            tier = 'free' if api_key.max_tokens_per_day <= 1000000 else 'paid'
            
            return Response({
                'id': api_key.id,
                'provider': api_key.provider.name,
                'provider_display': api_key.provider.display_name,
                'model_name': api_key.model_name,
                'tier': tier,
                'status': api_key.status,
                'is_active': api_key.is_active,
                'key_preview': api_key.key_value[:10] + '...',
                'max_tokens_per_minute': api_key.max_tokens_per_minute,
                'max_tokens_per_day': api_key.max_tokens_per_day,
                'tokens_used_today': api_key.tokens_used_today,
                'tokens_used_this_minute': api_key.tokens_used_this_minute,
                'usage_percentage_day': round(api_key.get_usage_percentage_day(), 2),
                'usage_percentage_minute': round(api_key.get_usage_percentage_minute(), 2),
                'created_at': api_key.created_at.isoformat(),
                'updated_at': api_key.updated_at.isoformat(),
            })
        except APIKey.DoesNotExist:
            return Response(
                {'error': 'API key not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    elif request.method == 'PUT':
        return update_api_key(request, key_id)
    elif request.method == 'DELETE':
        return delete_api_key(request, key_id)
