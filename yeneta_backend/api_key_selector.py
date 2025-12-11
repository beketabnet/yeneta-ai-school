"""
Smart API Key Selection Logic
Selects the best available API key based on usage and limits
"""

from .api_key_models import APIKey, APIKeyProvider
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class APIKeySelector:
    """Intelligently selects API keys based on availability and usage"""
    
    @staticmethod
    def get_available_keys(provider_name: str, tokens_needed: int = 1000) -> List[APIKey]:
        """
        Get all available keys for a provider sorted by usage
        
        Returns keys sorted by day usage (lowest first) to distribute load
        """
        try:
            provider = APIKeyProvider.objects.get(name=provider_name)
        except APIKeyProvider.DoesNotExist:
            logger.error(f"Provider not found: {provider_name}")
            return []
        
        available_keys = []
        keys = APIKey.objects.filter(
            provider=provider,
            is_active=True,
            status='active'
        ).order_by('tokens_used_today')
        
        for key in keys:
            if key.is_available(tokens_needed):
                available_keys.append(key)
        
        return available_keys
    
    @staticmethod
    def select_best_key(provider_name: str, tokens_needed: int = 1000) -> Optional[APIKey]:
        """
        Select the best available key for a provider
        
        Strategy:
        1. Get all available keys
        2. Sort by day usage percentage (lowest first)
        3. Return the key with lowest usage
        """
        available_keys = APIKeySelector.get_available_keys(provider_name, tokens_needed)
        
        if not available_keys:
            logger.warning(f"No available keys for {provider_name}")
            return None
        
        # Sort by day usage percentage (lowest first)
        best_key = min(available_keys, key=lambda k: k.get_usage_percentage_day())
        
        logger.info(
            f"Selected {provider_name} key with {best_key.get_usage_percentage_day():.1f}% day usage"
        )
        
        return best_key
    
    @staticmethod
    def get_key_by_id(key_id: int) -> Optional[APIKey]:
        """Get a specific key by ID"""
        try:
            return APIKey.objects.get(id=key_id)
        except APIKey.DoesNotExist:
            return None
    
    @staticmethod
    def get_provider_status(provider_name: str) -> dict:
        """Get status of all keys for a provider"""
        try:
            provider = APIKeyProvider.objects.get(name=provider_name)
        except APIKeyProvider.DoesNotExist:
            return {
                'provider': provider_name,
                'error': 'Provider not found',
                'keys': []
            }
        
        keys = APIKey.objects.filter(provider=provider)
        
        status_data = {
            'provider': provider_name,
            'total_keys': keys.count(),
            'active_keys': keys.filter(is_active=True, status='active').count(),
            'keys': []
        }
        
        for key in keys:
            key.reset_minute_counter()
            key.reset_day_counter()
            
            status_data['keys'].append({
                'id': key.id,
                'model_name': key.model_name,
                'status': key.status,
                'is_active': key.is_active,
                'key_preview': key.key_value[:10] + '...',
                'usage_day': key.get_usage_percentage_day(),
                'usage_minute': key.get_usage_percentage_minute(),
                'tokens_today': key.tokens_used_today,
                'tokens_this_minute': key.tokens_used_this_minute,
                'max_tokens_day': key.max_tokens_per_day,
                'max_tokens_minute': key.max_tokens_per_minute,
            })
        
        return status_data
    
    @staticmethod
    def get_all_providers_status() -> dict:
        """Get status of all providers and their keys"""
        providers = APIKeyProvider.objects.all()
        
        all_status = {}
        for provider in providers:
            all_status[provider.name] = APIKeySelector.get_provider_status(provider.name)
        
        return all_status
    
    @staticmethod
    def deactivate_key_on_rate_limit(key_id: int, reason: str = "Rate limit exceeded"):
        """Deactivate a key when rate limit is hit"""
        key = APIKeySelector.get_key_by_id(key_id)
        if key:
            key.deactivate(reason)
            logger.warning(f"Deactivated key {key.id}: {reason}")
    
    @staticmethod
    def reactivate_key(key_id: int):
        """Reactivate a deactivated key"""
        key = APIKeySelector.get_key_by_id(key_id)
        if key:
            key.reactivate()
            logger.info(f"Reactivated key {key.id}")
