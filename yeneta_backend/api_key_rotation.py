"""
API Key Rotation and Failover Logic
Handles automatic failover when API keys reach rate limits
"""

import logging
from typing import Optional, Callable, Any, Dict
from functools import wraps
from django.utils import timezone
from api_key_manager import get_api_key_manager, APIKeyConfig

logger = logging.getLogger(__name__)


class APIKeyRotationError(Exception):
    """Raised when no available API keys are found"""
    pass


class APIKeyRotator:
    """Manages API key rotation with automatic failover"""
    
    def __init__(self):
        self.manager = get_api_key_manager()
        self.retry_count = 0
        self.max_retries = 3
    
    def get_key_for_provider(self, provider: str, tokens_needed: int = 1000, model: Optional[str] = None) -> APIKeyConfig:
        """Get an available API key with automatic failover"""
        key = self.manager.get_available_key(provider, tokens_needed, model)
        
        if not key:
            raise APIKeyRotationError(
                f"No available {provider} keys for {tokens_needed} tokens. "
                f"All keys have reached their rate limits."
            )
        
        return key
    
    def execute_with_fallback(
        self,
        provider: str,
        operation: Callable,
        tokens_needed: int = 1000,
        model: Optional[str] = None,
        *args,
        **kwargs
    ) -> Any:
        """Execute an operation with automatic failover to next available key"""
        available_keys = self.manager.get_all_available_keys(provider, tokens_needed)
        
        if not available_keys:
            raise APIKeyRotationError(
                f"No available {provider} keys. All keys have reached their rate limits or are invalid."
            )
        
        last_error = None
        
        for key_config in available_keys:
            try:
                logger.info(f"Attempting {provider} operation with key: {key_config.key[:10]}...")
                
                # Validate key if not validated recently (within last hour)
                should_validate = (
                    key_config.last_validated is None or 
                    (timezone.now() - key_config.last_validated).total_seconds() > 3600
                )
                
                if should_validate:
                    logger.info(f"Validating {provider} key before use...")
                    is_valid, validation_error = self.manager.validate_key(provider, key_config.key)
                    
                    if not is_valid:
                        logger.warning(f"Key validation failed: {validation_error}")
                        self.manager.mark_key_invalid(provider, key_config.key, validation_error)
                        continue  # Try next key
                    
                    key_config.last_validated = timezone.now()
                    logger.info(f"Key validation successful")
                
                # Execute operation
                # Pass key_model if available to allow DB override of model name
                result = operation(key_config.key, *args, key_model=key_config.model, **kwargs)
                
                # Track successful token usage
                tokens_used = kwargs.get('tokens_used', tokens_needed)
                self.manager.track_token_usage(provider, key_config.key, tokens_used)
                
                logger.info(f"Successfully completed {provider} operation")
                return result
                
            except Exception as e:
                last_error = e
                error_message = str(e).lower()
                
                # Categorize error type
                is_invalid_key = any(phrase in error_message for phrase in [
                    'api key not valid',
                    'api_key_invalid',
                    'invalid api key',
                    'invalid key',
                    'authentication failed',
                    'unauthorized',
                    '401',
                    'please pass a valid api key',
                    'reason: "api_key_invalid"',
                    'bad request' # Sometimes 400 Bad Request is returned for invalid keys
                ])
                
                is_rate_limit = any(phrase in error_message for phrase in [
                    'rate limit',
                    'quota',
                    'exceeded',
                    '429',
                    '503',
                    'resource exhausted'
                ])
                
                if is_invalid_key:
                    logger.error(f"Invalid API key detected for {provider}: {str(e)}")
                    self.manager.mark_key_invalid(provider, key_config.key, str(e))
                    continue  # Try next key
                    
                elif is_rate_limit:
                    logger.warning(f"Rate limit hit for {provider} key {key_config.key[:10]}... Deactivating and trying next key")
                    self.manager.deactivate_key(provider, key_config.key)
                    continue  # Try next key
                    
                else:
                    # For non-rate-limit, non-invalid-key errors, re-raise immediately
                    logger.error(f"Non-recoverable error with {provider}: {str(e)}")
                    raise
        
        # All keys failed
        logger.error(f"All {provider} keys exhausted after {len(available_keys)} attempts")
        raise APIKeyRotationError(
            f"All {provider} keys failed. Last error: {str(last_error)}"
        )
    
    def handle_rate_limit(self, provider: str, key: str):
        """Handle rate limit error for a specific key"""
        self.manager.deactivate_key(provider, key)
        logger.warning(f"Deactivated {provider} key due to rate limit: {key[:10]}...")
        
        # Check if there are other available keys
        available = self.manager.get_all_available_keys(provider)
        if available:
            logger.info(f"Fallback available: {len(available)} other {provider} keys available")
        else:
            logger.error(f"No fallback {provider} keys available!")
    
    def get_provider_status(self) -> Dict:
        """Get status of all providers and their keys"""
        return self.manager.get_provider_status()
    
    def reset_key(self, provider: str, key: str):
        """Manually reset a deactivated key"""
        self.manager.reactivate_key(provider, key)
        logger.info(f"Reactivated {provider} key: {key[:10]}...")


def with_api_key_rotation(provider: str, tokens_needed: int = 1000, model: Optional[str] = None):
    """
    Decorator for functions that need API key rotation
    
    Usage:
        @with_api_key_rotation('openai', tokens_needed=2000)
        def call_openai_api(api_key, prompt):
            # Use api_key to call OpenAI
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            rotator = APIKeyRotator()
            try:
                key_config = rotator.get_key_for_provider(provider, tokens_needed, model)
                result = func(key_config.key, *args, **kwargs)
                
                # Track token usage if provided
                if 'tokens_used' in kwargs:
                    rotator.manager.track_token_usage(provider, key_config.key, kwargs['tokens_used'])
                
                return result
            except APIKeyRotationError as e:
                logger.error(f"API key rotation failed: {str(e)}")
                raise
        
        return wrapper
    return decorator


# Global rotator instance
_rotator = None


def get_api_key_rotator() -> APIKeyRotator:
    """Get or create the global API key rotator instance"""
    global _rotator
    if _rotator is None:
        _rotator = APIKeyRotator()
    return _rotator
