"""
API Key Initialization from Environment Variables
Loads and manages API keys from .env configuration
"""

import os
import logging
from academics.api_key_models import APIKey, APIKeyProvider

logger = logging.getLogger(__name__)


class APIKeyInitializer:
    """Initialize API keys from environment variables"""
    
    @staticmethod
    def init_providers():
        """Create default providers if they don't exist"""
        providers = [
            ('gemini', 'Google Gemini'),
            ('openai', 'OpenAI'),
            ('serp', 'SERP API'),
        ]
        
        for name, display_name in providers:
            APIKeyProvider.objects.get_or_create(
                name=name,
                defaults={'display_name': display_name}
            )
        
        logger.info("API providers initialized")
    
    @staticmethod
    def load_gemini_keys_from_env():
        """Load Gemini keys from environment variables"""
        try:
            provider = APIKeyProvider.objects.get(name='gemini')
        except APIKeyProvider.DoesNotExist:
            logger.error("Gemini provider not found")
            return
        
        # Free tier keys
        free_key = os.getenv('GEMINI_API_KEY')
        if free_key and free_key.strip():
            model = os.getenv('GEMINI_MODEL_FLASH', 'gemini-2.0-flash')
            APIKeyInitializer._create_or_update_key(
                provider=provider,
                key_value=free_key,
                model_name=model,
                tier='free',
                max_tokens_per_minute=60000,
                max_tokens_per_day=1000000,
            )
        
        # Paid tier keys
        paid_key = os.getenv('GOOGLE_CLOUD_API_KEY')
        if paid_key and paid_key.strip():
            model = os.getenv('GEMINI_MODEL_PRO', 'gemini-1.5-pro-latest')
            APIKeyInitializer._create_or_update_key(
                provider=provider,
                key_value=paid_key,
                model_name=model,
                tier='paid',
                max_tokens_per_minute=90000,
                max_tokens_per_day=2000000,
            )
        
        # Load additional free tier keys
        APIKeyInitializer.load_additional_free_gemini_keys(provider)
        
        logger.info("Gemini keys loaded from environment")
    
    @staticmethod
    def load_additional_free_gemini_keys(provider):
        """Load additional free tier Gemini API keys"""
        free_keys = [
            'AIzaSyArQs7u3F12zp7vuujMRGAFROxhzeCIaNU',
            'AIzaSyBHDc1i_eQbBCpxyTyFfcfePQOuSfLvD9g',
            'AIzaSyAPgvkH1jhikWdGH3Zm5pPCMLEt16BrI9E',
            'AIzaSyByuhV4HS2CD8d1kG2InR7sm1vc75XZI40',
        ]
        
        model = os.getenv('GEMINI_MODEL_FLASH', 'gemini-2.0-flash')
        
        for key_value in free_keys:
            APIKeyInitializer._create_or_update_key(
                provider=provider,
                key_value=key_value,
                model_name=model,
                tier='free',
                max_tokens_per_minute=60000,
                max_tokens_per_day=1000000,
            )
        
        logger.info(f"Loaded {len(free_keys)} additional free tier Gemini keys")
    
    @staticmethod
    def load_openai_keys_from_env():
        """Load OpenAI keys from environment variables"""
        try:
            provider = APIKeyProvider.objects.get(name='openai')
        except APIKeyProvider.DoesNotExist:
            logger.error("OpenAI provider not found")
            return
        
        # Paid tier key
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key and api_key.strip():
            model = os.getenv('OPENAI_MODEL_GPT4O', 'gpt-4o')
            APIKeyInitializer._create_or_update_key(
                provider=provider,
                key_value=api_key,
                model_name=model,
                tier='paid',
                max_tokens_per_minute=90000,
                max_tokens_per_day=2000000,
            )
        
        logger.info("OpenAI keys loaded from environment")
    
    @staticmethod
    def load_serp_keys_from_env():
        """Load SERP API keys from environment variables"""
        try:
            provider = APIKeyProvider.objects.get(name='serp')
        except APIKeyProvider.DoesNotExist:
            logger.error("SERP provider not found")
            return
        
        api_key = os.getenv('SERP_API_KEY')
        if api_key and api_key.strip():
            APIKeyInitializer._create_or_update_key(
                provider=provider,
                key_value=api_key,
                model_name='serp-search',
                tier='free',
                max_tokens_per_minute=100,
                max_tokens_per_day=100000,
            )
        
        logger.info("SERP keys loaded from environment")
    
    @staticmethod
    def _create_or_update_key(provider, key_value, model_name, tier, max_tokens_per_minute, max_tokens_per_day):
        """Create or update an API key"""
        try:
            key, created = APIKey.objects.get_or_create(
                provider=provider,
                key_value=key_value,
                defaults={
                    'model_name': model_name,
                    'max_tokens_per_minute': max_tokens_per_minute,
                    'max_tokens_per_day': max_tokens_per_day,
                    'is_active': True,
                    'status': 'active',
                }
            )
            
            if created:
                logger.info(f"Created {tier} tier {provider.name} key: {model_name}")
            else:
                logger.info(f"Found existing {tier} tier {provider.name} key: {model_name}")
            
            return key
        except Exception as e:
            logger.error(f"Error creating/updating key: {str(e)}")
            return None
    
    @staticmethod
    def init_all():
        """Initialize all API keys from environment"""
        logger.info("Initializing API keys from environment...")
        APIKeyInitializer.init_providers()
        APIKeyInitializer.load_gemini_keys_from_env()
        APIKeyInitializer.load_openai_keys_from_env()
        APIKeyInitializer.load_serp_keys_from_env()
        logger.info("API key initialization complete")
