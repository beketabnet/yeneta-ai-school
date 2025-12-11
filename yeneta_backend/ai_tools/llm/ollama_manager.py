"""
Ollama Manager - Manage Ollama models and server health
Provides model management, health checks, and offline capabilities.
"""

import os
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    logger.warning("Ollama not available. Install with: pip install ollama")


class OllamaManager:
    """
    Manage Ollama server and models.
    Provides health checks, model management, and offline detection.
    """
    
    def __init__(self):
        self.base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.timeout = int(os.getenv('OLLAMA_TIMEOUT', 120))
        
        # Required models
        self.required_models = {
            'text_small': os.getenv('OLLAMA_MODEL_TEXT_SMALL', 'llama3.2:1b'),
            'text_medium': os.getenv('OLLAMA_MODEL_TEXT_MEDIUM', 'gemma2:2b'),
            'multimodal': os.getenv('OLLAMA_MODEL_MULTIMODAL', 'llava:7b'),
            'embedding': os.getenv('OLLAMA_EMBEDDING_MODEL', 'mxbai-embed-large:latest'),
        }
        
        self._last_health_check = None
        self._is_healthy = False
        self._health_check_interval = timedelta(minutes=5)
        
        logger.info(f"OllamaManager initialized at {self.base_url}")
    
    def is_available(self) -> bool:
        """Check if Ollama is available"""
        return OLLAMA_AVAILABLE and self.check_health()
    
    def check_health(self, force: bool = False) -> bool:
        """
        Check Ollama server health.
        
        Args:
            force: Force health check even if cached
        
        Returns:
            True if healthy, False otherwise
        """
        if not OLLAMA_AVAILABLE:
            return False
        
        # Use cached result if recent
        if not force and self._last_health_check:
            if datetime.now() - self._last_health_check < self._health_check_interval:
                return self._is_healthy
        
        try:
            # Try to list models as health check
            ollama.list()
            self._is_healthy = True
            self._last_health_check = datetime.now()
            logger.info("Ollama server is healthy")
            return True
        
        except Exception as e:
            self._is_healthy = False
            self._last_health_check = datetime.now()
            logger.warning(f"Ollama server health check failed: {e}")
            return False
    
    def list_models(self) -> List[Dict]:
        """
        List all installed Ollama models.
        
        Returns:
            List of model information dictionaries
        """
        if not OLLAMA_AVAILABLE:
            return []
        
        try:
            response = ollama.list()
            models = []
            
            if hasattr(response, 'models'):
                for model in response.models:
                    models.append({
                        'name': model.model,
                        'size': getattr(model, 'size', 0),
                        'modified': getattr(model, 'modified_at', None),
                    })
            
            return models
        
        except Exception as e:
            logger.error(f"Failed to list Ollama models: {e}")
            return []
    
    def is_model_installed(self, model_name: str) -> bool:
        """
        Check if a specific model is installed.
        
        Args:
            model_name: Name of the model
        
        Returns:
            True if installed, False otherwise
        """
        models = self.list_models()
        return any(m['name'] == model_name for m in models)
    
    def pull_model(self, model_name: str) -> bool:
        """
        Pull/download a model from Ollama registry.
        
        Args:
            model_name: Name of the model to pull
        
        Returns:
            True if successful, False otherwise
        """
        if not OLLAMA_AVAILABLE:
            logger.error("Ollama not available")
            return False
        
        try:
            logger.info(f"Pulling Ollama model: {model_name}")
            ollama.pull(model_name)
            logger.info(f"Successfully pulled model: {model_name}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to pull model {model_name}: {e}")
            return False
    
    def delete_model(self, model_name: str) -> bool:
        """
        Delete a model from local storage.
        
        Args:
            model_name: Name of the model to delete
        
        Returns:
            True if successful, False otherwise
        """
        if not OLLAMA_AVAILABLE:
            return False
        
        try:
            ollama.delete(model_name)
            logger.info(f"Deleted model: {model_name}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to delete model {model_name}: {e}")
            return False
    
    def check_required_models(self) -> Dict[str, bool]:
        """
        Check if all required models are installed.
        
        Returns:
            Dictionary mapping model type to installation status
        """
        status = {}
        
        for model_type, model_name in self.required_models.items():
            status[model_type] = self.is_model_installed(model_name)
        
        return status
    
    def setup_required_models(self, auto_pull: bool = False) -> Dict[str, str]:
        """
        Setup all required models.
        
        Args:
            auto_pull: Automatically pull missing models
        
        Returns:
            Dictionary with setup status for each model
        """
        status = {}
        
        for model_type, model_name in self.required_models.items():
            if self.is_model_installed(model_name):
                status[model_type] = 'installed'
            elif auto_pull:
                if self.pull_model(model_name):
                    status[model_type] = 'pulled'
                else:
                    status[model_type] = 'failed'
            else:
                status[model_type] = 'missing'
        
        return status
    
    def get_model_info(self, model_name: str) -> Optional[Dict]:
        """
        Get detailed information about a model.
        
        Args:
            model_name: Name of the model
        
        Returns:
            Model information dictionary or None
        """
        if not OLLAMA_AVAILABLE:
            return None
        
        try:
            response = ollama.show(model_name)
            
            return {
                'name': model_name,
                'modelfile': getattr(response, 'modelfile', ''),
                'parameters': getattr(response, 'parameters', ''),
                'template': getattr(response, 'template', ''),
                'details': getattr(response, 'details', {}),
            }
        
        except Exception as e:
            logger.error(f"Failed to get model info for {model_name}: {e}")
            return None
    
    def test_model(self, model_name: str, prompt: str = "Hello") -> bool:
        """
        Test if a model can generate responses.
        
        Args:
            model_name: Name of the model
            prompt: Test prompt
        
        Returns:
            True if model works, False otherwise
        """
        if not OLLAMA_AVAILABLE:
            return False
        
        try:
            response = ollama.generate(
                model=model_name,
                prompt=prompt,
                options={'num_predict': 10}
            )
            
            return bool(response.get('response'))
        
        except Exception as e:
            logger.error(f"Model test failed for {model_name}: {e}")
            return False
    
    def get_status(self) -> Dict:
        """
        Get comprehensive Ollama status.
        
        Returns:
            Status dictionary with all information
        """
        if not OLLAMA_AVAILABLE:
            return {
                'available': False,
                'error': 'Ollama library not installed',
                'models': [],
                'required_models': {},
            }
        
        is_healthy = self.check_health()
        
        if not is_healthy:
            return {
                'available': False,
                'error': 'Ollama server not responding',
                'base_url': self.base_url,
                'models': [],
                'required_models': {},
            }
        
        models = self.list_models()
        required_status = self.check_required_models()
        
        return {
            'available': True,
            'base_url': self.base_url,
            'models': models,
            'model_count': len(models),
            'required_models': required_status,
            'all_required_installed': all(required_status.values()),
        }
    
    def get_recommendations(self) -> List[str]:
        """
        Get recommendations for Ollama setup.
        
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        if not OLLAMA_AVAILABLE:
            recommendations.append(
                "Install Ollama Python library: pip install ollama"
            )
            recommendations.append(
                "Install Ollama server: https://ollama.com/download"
            )
            return recommendations
        
        if not self.check_health():
            recommendations.append(
                f"Start Ollama server (expected at {self.base_url})"
            )
            recommendations.append(
                "Run: ollama serve"
            )
            return recommendations
        
        required_status = self.check_required_models()
        
        for model_type, is_installed in required_status.items():
            if not is_installed:
                model_name = self.required_models[model_type]
                recommendations.append(
                    f"Pull {model_type} model: ollama pull {model_name}"
                )
        
        if not recommendations:
            recommendations.append("✅ All Ollama models are installed and ready!")
        
        return recommendations


# Singleton instance
ollama_manager = OllamaManager()
