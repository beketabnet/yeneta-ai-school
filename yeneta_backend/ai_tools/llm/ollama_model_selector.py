"""
Smart Ollama Model Selector
Intelligently selects the best Ollama model based on task complexity and available models.
"""

import logging
from typing import Optional, List
from .models import LLMModel, TaskType, TaskComplexity

logger = logging.getLogger(__name__)


class OllamaModelSelector:
    """Smart model selection for Ollama based on task requirements"""
    
    # Model tiers ordered by quality (best to worst)
    QUALITY_TIERS = {
        'premium': [
            LLMModel.OLLAMA_GPT_OSS_20B,  # Best quality, slowest
        ],
        'high': [
            LLMModel.OLLAMA_LLAMA3_1,  # Good balance
            LLMModel.OLLAMA_LLAMA3_2,  # Good balance, faster
        ],
        'medium': [
            LLMModel.OLLAMA_GEMMA2_2B,  # Lightweight, decent quality
        ],
        'fast': [
            LLMModel.OLLAMA_LLAMA_1B,  # Fastest, lowest quality
        ]
    }
    
    # Task type to quality tier mapping
    TASK_QUALITY_REQUIREMENTS = {
        TaskType.QUESTION_GENERATION: 'premium',  # Quiz generation needs best quality
        TaskType.LESSON_PLANNING: 'high',
        TaskType.GRADING: 'high',
        TaskType.CONTENT_GENERATION: 'high',
        TaskType.TUTORING: 'medium',
        TaskType.CONVERSATION_SUMMARY: 'medium',
        TaskType.TRANSLATION: 'medium',
        TaskType.STUDENT_INSIGHTS: 'fast',
        TaskType.ALERT_ANALYSIS: 'fast',
    }
    
    # Complexity to quality tier mapping
    COMPLEXITY_QUALITY_REQUIREMENTS = {
        TaskComplexity.EXPERT: 'premium',
        TaskComplexity.ADVANCED: 'high',
        TaskComplexity.MEDIUM: 'medium',
        TaskComplexity.BASIC: 'fast',
    }
    
    @classmethod
    def select_best_model(
        cls,
        task_type: TaskType,
        complexity: TaskComplexity = TaskComplexity.MEDIUM,
        available_models: Optional[List[str]] = None,
        prefer_speed: bool = False
    ) -> LLMModel:
        """Select the best Ollama model for the given task."""
        # Determine required quality tier
        task_tier = cls.TASK_QUALITY_REQUIREMENTS.get(task_type, 'medium')
        complexity_tier = cls.COMPLEXITY_QUALITY_REQUIREMENTS.get(complexity, 'medium')
        
        # Use the higher quality requirement
        tier_priority = ['fast', 'medium', 'high', 'premium']
        required_tier_idx = max(
            tier_priority.index(task_tier),
            tier_priority.index(complexity_tier)
        )
        required_tier = tier_priority[required_tier_idx]
        
        # If prefer_speed is True OR complexity is BASIC (Easy), prioritize faster models
        if prefer_speed or complexity == TaskComplexity.BASIC:
            logger.info("🚀 Speed prioritized: selecting lightweight model")
            # Prioritize Gemma 2 2B or Llama 3.2 (small)
            fast_candidates = [LLMModel.OLLAMA_GEMMA2_2B, LLMModel.OLLAMA_LLAMA3_2, LLMModel.OLLAMA_LLAMA_1B]
            
            if available_models:
                available_set = set(available_models)
                for model in fast_candidates:
                    if model.value in available_set:
                        logger.info(f"Selected fast model: {model.value}")
                        return model
        
        # Otherwise, prioritize quality (GPT-OSS 20B)
        logger.info(f"Task: {task_type.value}, Complexity: {complexity.value} -> Tier: {required_tier}")
        
        # Get models for this tier and fallback tiers
        candidate_models = []
        for tier in tier_priority[required_tier_idx:]:
            candidate_models.extend(cls.QUALITY_TIERS.get(tier, []))
        
        # If available_models provided, filter to only available ones
        if available_models:
            available_set = set(available_models)
            for model in candidate_models:
                if model.value in available_set:
                    logger.info(f"Selected quality model: {model.value}")
                    return model
            
            # Fallback Logic
            # 1. Try GPT-OSS 20B (Best Quality)
            # 2. Try Gemma 2 2B (Best Speed/Reliability balance)
            # 3. Try Llama 3.2
            fallback_order = [
                LLMModel.OLLAMA_GPT_OSS_20B, 
                LLMModel.OLLAMA_GEMMA2_2B, 
                LLMModel.OLLAMA_LLAMA3_2
            ]
            
            for model in fallback_order:
                if model.value in available_set:
                    logger.info(f"Selected fallback model: {model.value}")
                    return model
        else:
            selected = candidate_models[0] if candidate_models else LLMModel.OLLAMA_GPT_OSS_20B
            return selected
        
        return LLMModel.OLLAMA_GPT_OSS_20B
    
    @classmethod
    def get_available_models(cls) -> List[str]:
        """Get list of available Ollama models."""
        try:
            import ollama
            response = ollama.list()
            
            # Handle Ollama ListResponse object (it behaves like a list of models)
            # The error log showed: <class 'ollama._types.ListResponse'>
            models_list = []
            
            # Check if it's the ListResponse object which is iterable directly
            if hasattr(response, 'models'):
                 # New API format
                 raw_models = response.models
            elif isinstance(response, dict) and 'models' in response:
                 # Old API format (dict)
                 raw_models = response['models']
            else:
                 # Assume it's iterable (ListResponse)
                 raw_models = response

            for m in raw_models:
                # Handle both object and dict access
                if hasattr(m, 'model'):
                    models_list.append(m.model)
                elif isinstance(m, dict):
                    models_list.append(m.get('model', m.get('name', '')))
                
            if models_list:
                logger.info(f"Available Ollama models: {models_list}")
                return models_list
            else:
                logger.warning(f"Unexpected Ollama response format: {type(response)}")
                return ['gpt-oss:20b', 'llama3.2', 'llama3.2:1b', 'llama3.1', 'gemma2:2b']
        except Exception as e:
            logger.warning(f"Could not query Ollama: {e}")
            return ['gpt-oss:20b', 'llama3.2', 'llama3.2:1b', 'llama3.1', 'gemma2:2b']


_selector = OllamaModelSelector()

def get_ollama_model_selector() -> OllamaModelSelector:
    return _selector
