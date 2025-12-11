"""
Updated LLM Service with Smart API Key Selection
Integrates with APIKeySelector for intelligent key management
"""

import os
import logging
from typing import Optional
from .api_key_selector import APIKeySelector
from .api_key_models import APIKey

logger = logging.getLogger(__name__)


class SmartLLMService:
    """LLM service with intelligent API key selection"""
    
    def __init__(self):
        self.selector = APIKeySelector()
        self._init_providers()
    
    def _init_providers(self):
        """Initialize LLM providers"""
        try:
            import openai
            self.has_openai = True
        except ImportError:
            logger.warning("OpenAI library not installed")
            self.has_openai = False
        
        try:
            import google.generativeai as genai
            self.has_gemini = True
        except ImportError:
            logger.warning("Google Generative AI library not installed")
            self.has_gemini = False
        
        try:
            import ollama
            self.has_ollama = True
        except ImportError:
            logger.warning("Ollama library not installed")
            self.has_ollama = False
    
    def generate_text(
        self,
        prompt: str,
        provider: str = 'auto',
        tokens_needed: int = 1000,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> str:
        """
        Generate text using smart key selection
        
        Args:
            prompt: The input prompt
            provider: 'openai', 'gemini', 'ollama', or 'auto'
            tokens_needed: Estimated tokens needed for this request
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
        
        Returns:
            Generated text
        """
        if provider == 'auto':
            provider = self._select_best_provider(tokens_needed)
        
        try:
            if provider == 'openai':
                return self._generate_openai(prompt, tokens_needed, temperature, max_tokens, **kwargs)
            elif provider == 'gemini':
                return self._generate_gemini(prompt, tokens_needed, temperature, max_tokens, **kwargs)
            elif provider == 'ollama':
                return self._generate_ollama(prompt, tokens_needed, temperature, max_tokens, **kwargs)
            else:
                raise ValueError(f"Unknown provider: {provider}")
        except Exception as e:
            logger.error(f"Failed to generate with {provider}: {str(e)}")
            # Try fallback
            if provider != 'ollama':
                logger.info("Attempting fallback to Ollama")
                return self._generate_ollama(prompt, tokens_needed, temperature, max_tokens, **kwargs)
            raise
    
    def _generate_openai(
        self,
        prompt: str,
        tokens_needed: int,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> str:
        """Generate using OpenAI with smart key selection"""
        if not self.has_openai:
            raise RuntimeError("OpenAI not available")
        
        # Select best available key
        api_key: Optional[APIKey] = self.selector.select_best_key('openai', tokens_needed)
        if not api_key:
            raise RuntimeError("No available OpenAI keys")
        
        try:
            import openai
            client = openai.OpenAI(api_key=api_key.key_value)
            
            response = client.chat.completions.create(
                model=api_key.model_name or 'gpt-4o-mini',
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            # Track usage
            tokens_used = response.usage.total_tokens
            api_key.add_token_usage(tokens_used)
            
            logger.info(f"OpenAI: Used {tokens_used} tokens with key {api_key.id}")
            
            return response.choices[0].message.content
        
        except Exception as e:
            error_str = str(e).lower()
            if any(phrase in error_str for phrase in ['rate_limit', 'quota', '429', '503']):
                logger.warning(f"Rate limit hit for OpenAI key {api_key.id}, deactivating")
                self.selector.deactivate_key_on_rate_limit(api_key.id, str(e))
            raise
    
    def _generate_gemini(
        self,
        prompt: str,
        tokens_needed: int,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> str:
        """Generate using Gemini with smart key selection"""
        if not self.has_gemini:
            raise RuntimeError("Gemini not available")
        
        # Select best available key
        api_key: Optional[APIKey] = self.selector.select_best_key('gemini', tokens_needed)
        if not api_key:
            raise RuntimeError("No available Gemini keys")
        
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key.key_value)
            
            gen_model = genai.GenerativeModel(
                model_name=api_key.model_name or 'gemini-1.5-flash-latest'
            )
            
            response = gen_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
                **kwargs
            )
            
            # Track usage (estimate)
            api_key.add_token_usage(max_tokens)
            
            logger.info(f"Gemini: Used ~{max_tokens} tokens with key {api_key.id}")
            
            return response.text
        
        except Exception as e:
            error_str = str(e).lower()
            if any(phrase in error_str for phrase in ['rate_limit', 'quota', '429', '503']):
                logger.warning(f"Rate limit hit for Gemini key {api_key.id}, deactivating")
                self.selector.deactivate_key_on_rate_limit(api_key.id, str(e))
            raise
    
    def _generate_ollama(
        self,
        prompt: str,
        tokens_needed: int,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> str:
        """Generate using Ollama (local/offline)"""
        if not self.has_ollama:
            raise RuntimeError("Ollama not available")
        
        try:
            import ollama
            
            model_name = os.getenv('OLLAMA_MODEL_TEXT_MEDIUM', 'gemma2:9b')
            
            response = ollama.generate(
                model=model_name,
                prompt=prompt,
                stream=False,
                options={
                    'temperature': temperature,
                    'num_predict': max_tokens,
                }
            )
            
            logger.info(f"Ollama: Generated response with {model_name}")
            
            return response['response']
        
        except Exception as e:
            logger.error(f"Ollama generation failed: {str(e)}")
            raise
    
    def _select_best_provider(self, tokens_needed: int) -> str:
        """
        Select best provider based on availability
        Priority: Ollama (free) > Gemini (subsidized) > OpenAI (paid)
        """
        # Check Ollama
        if self.has_ollama:
            try:
                import ollama
                return 'ollama'
            except:
                pass
        
        # Check Gemini
        if self.has_gemini:
            available = self.selector.get_available_keys('gemini', tokens_needed)
            if available:
                return 'gemini'
        
        # Check OpenAI
        if self.has_openai:
            available = self.selector.get_available_keys('openai', tokens_needed)
            if available:
                return 'openai'
        
        # Fallback to Ollama
        return 'ollama'
    
    def get_provider_status(self) -> dict:
        """Get status of all providers"""
        return self.selector.get_all_providers_status()
    
    def get_available_keys_for_provider(self, provider: str, tokens_needed: int = 1000) -> list:
        """Get list of available keys for a provider"""
        keys = self.selector.get_available_keys(provider, tokens_needed)
        return [{
            'id': k.id,
            'model': k.model_name,
            'usage_day': k.get_usage_percentage_day(),
            'usage_minute': k.get_usage_percentage_minute(),
        } for k in keys]


# Global instance
_llm_service = None


def get_smart_llm_service() -> SmartLLMService:
    """Get or create the global smart LLM service instance"""
    global _llm_service
    if _llm_service is None:
        _llm_service = SmartLLMService()
    return _llm_service
