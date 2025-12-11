"""
Unified LLM Service with Multi-Provider Support
Handles OpenAI, Gemini, and Ollama with automatic failover
"""

import os
import logging
from typing import Optional, List, Dict, Any
from api_key_rotation import get_api_key_rotator, APIKeyRotationError

logger = logging.getLogger(__name__)


class LLMService:
    """Unified service for LLM operations with multi-provider support"""
    
    def __init__(self):
        self.rotator = get_api_key_rotator()
        self._init_providers()
    
    def _init_providers(self):
        """Initialize LLM providers"""
        try:
            import openai
            self.openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEYS', '').split(',')[0])
            self.has_openai = True
        except ImportError:
            logger.warning("OpenAI library not installed")
            self.has_openai = False
        
        try:
            import google.generativeai as genai
            gemini_keys = os.getenv('GEMINI_API_KEYS', '').split(',')
            if gemini_keys and gemini_keys[0].strip():
                genai.configure(api_key=gemini_keys[0].strip())
            self.has_gemini = True
        except ImportError:
            logger.warning("Google Generative AI library not installed")
            self.has_gemini = False
        
        try:
            import ollama
            self.ollama_base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
            self.has_ollama = True
        except ImportError:
            logger.warning("Ollama library not installed")
            self.has_ollama = False
    
    def generate_text(
        self,
        prompt: str,
        provider: str = 'auto',
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> str:
        """
        Generate text using the specified provider with automatic failover
        
        Args:
            prompt: The input prompt
            provider: 'openai', 'gemini', 'ollama', or 'auto' for automatic selection
            model: Specific model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
        
        Returns:
            Generated text
        """
        if provider == 'auto':
            provider = self._select_best_provider(max_tokens)
        
        try:
            if provider == 'openai':
                return self._generate_openai(prompt, model, temperature, max_tokens, **kwargs)
            elif provider == 'gemini':
                return self._generate_gemini(prompt, model, temperature, max_tokens, **kwargs)
            elif provider == 'ollama':
                return self._generate_ollama(prompt, model, temperature, max_tokens, **kwargs)
            else:
                raise ValueError(f"Unknown provider: {provider}")
        except APIKeyRotationError as e:
            logger.error(f"Failed to generate text with {provider}: {str(e)}")
            # Try fallback provider
            if provider != 'ollama':
                logger.info("Attempting fallback to Ollama")
                return self._generate_ollama(prompt, model, temperature, max_tokens, **kwargs)
            raise
    
    def _generate_openai(
        self,
        prompt: str,
        model: Optional[str],
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> str:
        """Generate text using OpenAI"""
        if not self.has_openai:
            raise RuntimeError("OpenAI not available")
        
        try:
            key_config = self.rotator.get_key_for_provider('openai', max_tokens, model)
            
            import openai
            client = openai.OpenAI(api_key=key_config.key)
            
            response = client.chat.completions.create(
                model=model or key_config.model or 'gpt-4o-mini',
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            # Track token usage
            tokens_used = response.usage.total_tokens
            self.rotator.manager.track_token_usage('openai', key_config.key, tokens_used)
            
            return response.choices[0].message.content
        
        except Exception as e:
            if 'rate_limit' in str(e).lower() or '429' in str(e):
                self.rotator.handle_rate_limit('openai', key_config.key)
            raise
    
    def _generate_gemini(
        self,
        prompt: str,
        model: Optional[str],
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> str:
        """Generate text using Google Gemini"""
        if not self.has_gemini:
            raise RuntimeError("Gemini not available")
        
        try:
            key_config = self.rotator.get_key_for_provider('gemini', max_tokens, model)
            
            import google.generativeai as genai
            genai.configure(api_key=key_config.key)
            
            gen_model = genai.GenerativeModel(
                model_name=model or key_config.model or 'gemini-1.5-flash-latest'
            )
            
            response = gen_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
                **kwargs
            )
            
            # Track token usage (Gemini doesn't always provide exact counts)
            self.rotator.manager.track_token_usage('gemini', key_config.key, max_tokens)
            
            return response.text
        
        except Exception as e:
            if 'rate_limit' in str(e).lower() or '429' in str(e):
                self.rotator.handle_rate_limit('gemini', key_config.key)
            raise
    
    def _generate_ollama(
        self,
        prompt: str,
        model: Optional[str],
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> str:
        """Generate text using Ollama (local/offline)"""
        if not self.has_ollama:
            raise RuntimeError("Ollama not available")
        
        try:
            import ollama
            
            model_name = model or os.getenv('OLLAMA_MODEL_TEXT_MEDIUM', 'gemma2:9b')
            
            response = ollama.generate(
                model=model_name,
                prompt=prompt,
                stream=False,
                options={
                    'temperature': temperature,
                    'num_predict': max_tokens,
                }
            )
            
            return response['response']
        
        except Exception as e:
            logger.error(f"Ollama generation failed: {str(e)}")
            raise
    
    def _select_best_provider(self, tokens_needed: int) -> str:
        """Select the best provider based on availability and cost"""
        # Priority: Ollama (free) > Gemini (subsidized) > OpenAI (paid)
        
        if self.has_ollama:
            try:
                import ollama
                return 'ollama'
            except:
                pass
        
        if self.has_gemini:
            available = self.rotator.manager.get_all_available_keys('gemini', tokens_needed)
            if available:
                return 'gemini'
        
        if self.has_openai:
            available = self.rotator.manager.get_all_available_keys('openai', tokens_needed)
            if available:
                return 'openai'
        
        # Fallback to Ollama even if not preferred
        return 'ollama'
    
    def get_provider_status(self) -> Dict[str, Any]:
        """Get status of all providers"""
        return self.rotator.get_provider_status()


# Global instance
_llm_service = None


def get_llm_service() -> LLMService:
    """Get or create the global LLM service instance"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
