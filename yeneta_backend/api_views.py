"""
API Views for API Key Management
Provides endpoints for monitoring and managing API keys
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from api_key_rotation import get_api_key_rotator
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def api_key_status(request):
    """
    Get status of all API keys
    
    Returns:
        {
            'openai': {
                'total_keys': int,
                'active_keys': int,
                'stats': [...]
            },
            'gemini': {...},
            'serp': {...}
        }
    """
    try:
        rotator = get_api_key_rotator()
        status_data = rotator.get_provider_status()
        return Response(status_data)
    except Exception as e:
        logger.error(f"Error fetching API key status: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def reset_api_key(request):
    """
    Reset a deactivated API key
    
    Request body:
        {
            'provider': 'openai|gemini|serp',
            'key': 'api-key-string'
        }
    """
    try:
        provider = request.data.get('provider')
        key = request.data.get('key')
        
        if not provider or not key:
            return Response(
                {'error': 'provider and key are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rotator = get_api_key_rotator()
        rotator.reset_key(provider, key)
        
        logger.info(f"Admin reset {provider} key: {key[:10]}...")
        
        return Response({
            'message': f'Successfully reset {provider} key',
            'status': rotator.get_provider_status()
        })
    except Exception as e:
        logger.error(f"Error resetting API key: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def api_key_usage_report(request):
    """
    Get detailed usage report for all API keys
    
    Query parameters:
        - provider: Filter by provider (optional)
        - days: Number of days to report (default: 7)
    """
    try:
        provider = request.query_params.get('provider')
        rotator = get_api_key_rotator()
        status_data = rotator.get_provider_status()
        
        if provider:
            if provider not in status_data:
                return Response(
                    {'error': f'Unknown provider: {provider}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            status_data = {provider: status_data[provider]}
        
        # Calculate summary statistics
        summary = {
            'total_providers': len(status_data),
            'total_keys': sum(p['total_keys'] for p in status_data.values()),
            'active_keys': sum(p['active_keys'] for p in status_data.values()),
            'providers': status_data
        }
        
        return Response(summary)
    except Exception as e:
        logger.error(f"Error generating usage report: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
