"""
API Key Manager for handling multiple API keys with token limit tracking and failover.
Supports OpenAI, Gemini, and SERP API keys.
"""

import os
import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


@dataclass
class APIKeyConfig:
    """Configuration for a single API key"""
    key: str
    provider: str  # 'openai', 'gemini', 'serp'
    model: Optional[str] = None
    max_tokens_per_minute: int = 90000
    max_tokens_per_day: int = 2000000
    tokens_used_today: int = 0
    tokens_used_this_minute: int = 0
    last_reset_minute: datetime = None
    last_reset_day: datetime = None
    is_active: bool = True
    created_at: datetime = None
    is_valid: bool = True  # Track if key is permanently invalid
    validation_error: Optional[str] = None  # Store validation error message
    last_validated: Optional[datetime] = None  # Last validation check
    
    def __post_init__(self):
        if self.last_reset_minute is None:
            self.last_reset_minute = timezone.now()
        if self.last_reset_day is None:
            self.last_reset_day = timezone.now()
        if self.created_at is None:
            self.created_at = timezone.now()
    
    def reset_minute_counter(self):
        """Reset minute counter if a minute has passed"""
        now = timezone.now()
        # Ensure self.last_reset_minute is aware if now is aware
        if timezone.is_aware(now) and timezone.is_naive(self.last_reset_minute):
            self.last_reset_minute = timezone.make_aware(self.last_reset_minute)
            
        if now - self.last_reset_minute > timedelta(minutes=1):
            self.tokens_used_this_minute = 0
            self.last_reset_minute = now
    
    def reset_day_counter(self):
        """Reset day counter if a day has passed"""
        now = timezone.now()
        # Ensure self.last_reset_day is aware if now is aware
        if timezone.is_aware(now) and timezone.is_naive(self.last_reset_day):
            self.last_reset_day = timezone.make_aware(self.last_reset_day)
            
        if now - self.last_reset_day > timedelta(days=1):
            self.tokens_used_today = 0
            self.last_reset_day = now
    
    def can_use(self, tokens_needed: int = 1000) -> bool:
        """Check if this key can be used for the given token count"""
        if not self.is_active:
            return False
        
        # Check if key is permanently invalid
        if not self.is_valid:
            return False
        
        self.reset_minute_counter()
        self.reset_day_counter()
        
        if self.tokens_used_this_minute + tokens_needed > self.max_tokens_per_minute:
            return False
        if self.tokens_used_today + tokens_needed > self.max_tokens_per_day:
            return False
        
        return True
    
    def add_tokens(self, tokens_used: int):
        """Track tokens used"""
        self.tokens_used_this_minute += tokens_used
        self.tokens_used_today += tokens_used
    
    def get_usage_percentage(self) -> Dict[str, float]:
        """Get current usage percentage"""
        self.reset_minute_counter()
        self.reset_day_counter()
        
        return {
            'minute_usage': (self.tokens_used_this_minute / self.max_tokens_per_minute) * 100,
            'day_usage': (self.tokens_used_today / self.max_tokens_per_day) * 100,
        }


class APIKeyManager:
    """Manager for handling multiple API keys with failover logic"""
    
    def __init__(self):
        self.keys: Dict[str, List[APIKeyConfig]] = {
            'openai': [],
            'gemini': [],
            'serp': []
        }
        self._load_keys_from_env()
        self._load_keys_from_db()
    
    def _load_keys_from_db(self):
        """Load API keys from the database"""
        try:
            from academics.api_key_models import APIKey
            
            # Get all active keys
            db_keys = APIKey.objects.filter(is_active=True, status='active')
            
            for db_key in db_keys:
                provider_name = db_key.provider.name
                if provider_name in self.keys:
                    # Check if key already exists (from env) to avoid duplicates
                    if any(k.key == db_key.key_value for k in self.keys[provider_name]):
                        continue
                        
                    # Use model from DB, or fallback if invalid/missing
                    model_name = db_key.model_name
                    # You might want to validate against LLMModel enum here if strictness is required
                    # For now, we allow any string to support new models without code changes
                    
                    key_config = APIKeyConfig(
                        key=db_key.key_value,
                        provider=provider_name,
                        model=model_name,
                        max_tokens_per_minute=db_key.max_tokens_per_minute,
                        max_tokens_per_day=db_key.max_tokens_per_day,
                        tokens_used_today=db_key.tokens_used_today,
                        tokens_used_this_minute=db_key.tokens_used_this_minute,
                        last_reset_minute=db_key.last_reset_minute,
                        last_reset_day=db_key.last_reset_day,
                        is_active=db_key.is_active,
                        created_at=db_key.created_at
                    )
                    
                    # CRITICAL FIX: Reset counters based on timestamps to prevent stale data
                    key_config.reset_minute_counter()
                    key_config.reset_day_counter()
                    
                    self.keys[provider_name].append(key_config)
            
            logger.info(f"Loaded keys from DB. Total keys: OpenAI={len(self.keys['openai'])}, Gemini={len(self.keys['gemini'])}, SERP={len(self.keys['serp'])}")
            
        except Exception as e:
            logger.error(f"Error loading keys from database: {str(e)}")
            # Continue with env keys if DB fails
    
    def _load_keys_from_env(self):
        """Load API keys from environment variables"""
        # Load OpenAI keys
        openai_keys = os.getenv('OPENAI_API_KEYS', '').split(',')
        for i, key in enumerate(openai_keys):
            key = key.strip()
            if key:
                model = os.getenv(f'OPENAI_MODEL_{i}', 'gpt-4o-mini')
                self.keys['openai'].append(APIKeyConfig(
                    key=key,
                    provider='openai',
                    model=model,
                    max_tokens_per_minute=int(os.getenv(f'OPENAI_MAX_TOKENS_PER_MINUTE_{i}', '90000')),
                    max_tokens_per_day=int(os.getenv(f'OPENAI_MAX_TOKENS_PER_DAY_{i}', '2000000'))
                ))
        
        # Load Gemini keys
        gemini_keys = os.getenv('GEMINI_API_KEYS', '').split(',')
        for i, key in enumerate(gemini_keys):
            key = key.strip()
            if key:
                model = os.getenv(f'GEMINI_MODEL_{i}', 'gemini-pro')
                self.keys['gemini'].append(APIKeyConfig(
                    key=key,
                    provider='gemini',
                    model=model,
                    max_tokens_per_minute=int(os.getenv(f'GEMINI_MAX_TOKENS_PER_MINUTE_{i}', '60000')),
                    max_tokens_per_day=int(os.getenv(f'GEMINI_MAX_TOKENS_PER_DAY_{i}', '1000000'))
                ))
        
        # Load SERP keys
        serp_keys = os.getenv('SERP_API_KEYS', '').split(',')
        for i, key in enumerate(serp_keys):
            key = key.strip()
            if key:
                self.keys['serp'].append(APIKeyConfig(
                    key=key,
                    provider='serp',
                    max_tokens_per_minute=int(os.getenv(f'SERP_MAX_TOKENS_PER_MINUTE_{i}', '100')),
                    max_tokens_per_day=int(os.getenv(f'SERP_MAX_TOKENS_PER_DAY_{i}', '100000'))
                ))
    
    def get_available_key(self, provider: str, tokens_needed: int = 1000, model: Optional[str] = None) -> Optional[APIKeyConfig]:
        """Get an available API key for the given provider"""
        if provider not in self.keys:
            logger.error(f"Unknown provider: {provider}")
            return None
        
        available_keys = self.keys[provider]
        
        # Filter by model if specified
        if model:
            available_keys = [k for k in available_keys if k.model == model]
        
        # Find first available key
        for key_config in available_keys:
            if key_config.can_use(tokens_needed):
                return key_config
        
        logger.warning(f"No available {provider} keys for {tokens_needed} tokens")
        return None
    
    def get_all_available_keys(self, provider: str, tokens_needed: int = 1000) -> List[APIKeyConfig]:
        """Get all available API keys for the given provider"""
        if provider not in self.keys:
            return []
        
        return [k for k in self.keys[provider] if k.can_use(tokens_needed)]
    
    def track_token_usage(self, provider: str, key: str, tokens_used: int):
        """Track token usage for a specific key"""
        if provider not in self.keys:
            return
        
        for key_config in self.keys[provider]:
            if key_config.key == key:
                key_config.add_tokens(tokens_used)
                
                # Sync to database for persistence
                try:
                    from academics.api_key_models import APIKey
                    db_key = APIKey.objects.filter(
                        provider__name=provider,
                        key_value=key
                    ).first()
                    if db_key:
                        db_key.add_token_usage(tokens_used)
                        logger.debug(f"Synced {tokens_used} tokens to DB for {provider} key")
                except Exception as e:
                    logger.warning(f"Failed to sync token usage to DB: {e}")
                
                return
    
    def deactivate_key(self, provider: str, key: str):
        """Deactivate a key (e.g., due to rate limit or error)"""
        if provider not in self.keys:
            return
        
        for key_config in self.keys[provider]:
            if key_config.key == key:
                key_config.is_active = False
                logger.warning(f"Deactivated {provider} key: {key[:10]}...")
                return
    
    def reactivate_key(self, provider: str, key: str):
        """Reactivate a previously deactivated key"""
        if provider not in self.keys:
            return
        
        for key_config in self.keys[provider]:
            if key_config.key == key:
                key_config.is_active = True
                logger.info(f"Reactivated {provider} key: {key[:10]}...")
                return
    
    def mark_key_invalid(self, provider: str, key: str, error_message: str):
        """Mark a key as permanently invalid (e.g., API_KEY_INVALID error)"""
        if provider not in self.keys:
            return
        
        for key_config in self.keys[provider]:
            if key_config.key == key:
                key_config.is_valid = False
                key_config.is_active = False
                key_config.validation_error = error_message
                key_config.last_validated = timezone.now()
                logger.error(f"Marked {provider} key as INVALID: {key[:10]}... Error: {error_message}")
                return
    
    def sync_to_database(self):
        """Sync in-memory token usage back to database"""
        try:
            from academics.api_key_models import APIKey
            
            synced_count = 0
            for provider, keys in self.keys.items():
                for key_config in keys:
                    db_key = APIKey.objects.filter(
                        provider__name=provider,
                        key_value=key_config.key
                    ).first()
                    
                    if db_key:
                        db_key.tokens_used_today = key_config.tokens_used_today
                        db_key.tokens_used_this_minute = key_config.tokens_used_this_minute
                        db_key.last_reset_minute = key_config.last_reset_minute
                        db_key.last_reset_day = key_config.last_reset_day
                        db_key.is_active = key_config.is_active
                        db_key.save()
                        synced_count += 1
            
            logger.info(f"Synced {synced_count} API keys to database")
        except Exception as e:
            logger.error(f"Failed to sync API keys to database: {e}")
    
    def validate_key(self, provider: str, key: str) -> Tuple[bool, Optional[str]]:
        """Validate an API key by making a test call"""
        try:
            if provider == 'gemini':
                import google.generativeai as genai
                genai.configure(api_key=key)
                # Simple test: list models
                models = genai.list_models()
                return True, None
            elif provider == 'openai':
                import openai
                openai.api_key = key
                # Simple test: list models
                openai.Model.list()
                return True, None
            else:
                # For other providers, assume valid
                return True, None
        except Exception as e:
            error_msg = str(e)
            logger.warning(f"Key validation failed for {provider}: {error_msg}")
            return False, error_msg
    
    def get_key_stats(self, provider: str) -> List[Dict]:
        """Get statistics for all keys of a provider"""
        if provider not in self.keys:
            return []
        
        stats = []
        for key_config in self.keys[provider]:
            stats.append({
                'key': key_config.key[:10] + '...',
                'model': key_config.model,
                'is_active': key_config.is_active,
                'usage': key_config.get_usage_percentage(),
                'tokens_today': key_config.tokens_used_today,
                'tokens_this_minute': key_config.tokens_used_this_minute,
            })
        
        return stats
    
    def get_provider_status(self) -> Dict:
        """Get overall status of all providers"""
        return {
            'openai': {
                'total_keys': len(self.keys['openai']),
                'active_keys': sum(1 for k in self.keys['openai'] if k.is_active),
                'stats': self.get_key_stats('openai')
            },
            'gemini': {
                'total_keys': len(self.keys['gemini']),
                'active_keys': sum(1 for k in self.keys['gemini'] if k.is_active),
                'stats': self.get_key_stats('gemini')
            },
            'serp': {
                'total_keys': len(self.keys['serp']),
                'active_keys': sum(1 for k in self.keys['serp'] if k.is_active),
                'stats': self.get_key_stats('serp')
            }
        }


# Global instance
_api_key_manager = None


def get_api_key_manager() -> APIKeyManager:
    """Get or create the global API key manager instance"""
    global _api_key_manager
    if _api_key_manager is None:
        _api_key_manager = APIKeyManager()
    return _api_key_manager
