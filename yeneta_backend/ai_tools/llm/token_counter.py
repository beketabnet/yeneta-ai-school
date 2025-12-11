"""
Token Counter - Accurate token counting for cost optimization
Supports tiktoken for OpenAI models and estimation for others.
"""

import os
from typing import Optional, Dict
import logging

try:
    import tiktoken
    TIKTOKEN_AVAILABLE = True
except ImportError:
    TIKTOKEN_AVAILABLE = False
    logging.warning("tiktoken not available. Using estimation for token counting.")

from .models import LLMModel

logger = logging.getLogger(__name__)


class TokenCounter:
    """
    Token counter for accurate cost estimation and optimization.
    Uses tiktoken for OpenAI models and estimation for others.
    """
    
    def __init__(self):
        self.encoders: Dict[str, any] = {}
        self._init_encoders()
    
    def _init_encoders(self):
        """Initialize tiktoken encoders for OpenAI models"""
        if not TIKTOKEN_AVAILABLE:
            return
        
        try:
            # GPT-4o uses cl100k_base encoding
            self.encoders['gpt-4o'] = tiktoken.get_encoding("cl100k_base")
            self.encoders['gpt-4o-mini'] = tiktoken.get_encoding("cl100k_base")
            logger.info("Initialized tiktoken encoders for OpenAI models")
        except Exception as e:
            logger.error(f"Failed to initialize tiktoken encoders: {e}")
    
    def count_tokens(self, text: str, model: Optional[LLMModel] = None) -> int:
        """
        Count tokens in text for a specific model.
        
        Args:
            text: Input text to count tokens
            model: LLM model to use for counting (optional, defaults to generic estimation)
        
        Returns:
            Number of tokens
        """
        if not text:
            return 0
        
        # If no model specified, use generic estimation
        if model is None:
            return self._estimate_tokens_generic(text)
        
        # Use tiktoken for OpenAI models
        if model.value.startswith('gpt') and TIKTOKEN_AVAILABLE:
            try:
                encoder = self.encoders.get(model.value)
                if encoder:
                    return len(encoder.encode(text))
            except Exception as e:
                logger.warning(f"tiktoken encoding failed: {e}. Using estimation.")
        
        # Estimation for other models
        return self._estimate_tokens(text, model)
    
    def _estimate_tokens_generic(self, text: str) -> int:
        """
        Generic token estimation when model is not specified.
        Uses conservative 4 characters per token estimate.
        """
        if not text:
            return 0
        return int(len(text) / 4)
    
    def _estimate_tokens(self, text: str, model: LLMModel) -> int:
        """
        Estimate token count using heuristics.
        
        Different models have different tokenization:
        - English: ~4 chars per token
        - Code: ~3 chars per token
        - Amharic/Oromo: ~2-3 chars per token (more efficient)
        """
        if not text:
            return 0
        
        # Base estimation: 4 characters per token (conservative)
        char_count = len(text)
        
        # Adjust for model type
        if model.value.startswith('gemini'):
            # Gemini is slightly more efficient
            return int(char_count / 4.5)
        elif model.value.startswith(('llama', 'gemma', 'llava')):
            # Ollama models vary, use conservative estimate
            return int(char_count / 4)
        else:
            # Default estimation
            return int(char_count / 4)
    
    def count_messages_tokens(
        self,
        messages: list,
        model: LLMModel,
        system_prompt: Optional[str] = None
    ) -> int:
        """
        Count tokens in a list of messages (chat format).
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            model: LLM model to use for counting
            system_prompt: Optional system prompt
        
        Returns:
            Total token count
        """
        total_tokens = 0
        
        # Count system prompt
        if system_prompt:
            total_tokens += self.count_tokens(system_prompt, model)
            total_tokens += 4  # System message overhead
        
        # Count each message
        for message in messages:
            content = message.get('content', '')
            total_tokens += self.count_tokens(content, model)
            total_tokens += 4  # Message overhead (role, etc.)
        
        # Add base overhead for chat completion
        total_tokens += 3
        
        return total_tokens
    
    def estimate_cost(
        self,
        input_tokens: int,
        output_tokens: int,
        model: LLMModel
    ) -> float:
        """
        Estimate cost in USD for a given token count.
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: LLM model used
        
        Returns:
            Estimated cost in USD
        """
        costs = model.get_cost_per_1k_tokens(model)
        
        input_cost = (input_tokens / 1000) * costs['input']
        output_cost = (output_tokens / 1000) * costs['output']
        
        return input_cost + output_cost
    
    def truncate_text(
        self,
        text: str,
        max_tokens: int,
        model: Optional[LLMModel] = None
    ) -> str:
        """
        Truncate text to fit within token limit.
        
        Args:
            text: Text to truncate
            max_tokens: Maximum number of tokens
            model: LLM model for token counting (optional)
        
        Returns:
            Truncated text
        """
        if not text:
            return text
        
        current_tokens = self.count_tokens(text, model)
        
        if current_tokens <= max_tokens:
            return text
        
        # Calculate target character count
        chars_per_token = len(text) / current_tokens if current_tokens > 0 else 4
        target_chars = int(max_tokens * chars_per_token * 0.95)  # 5% buffer
        
        if target_chars >= len(text):
            return text
        
        # Simple truncation from end
        return text[:target_chars] + "..."
    
    def optimize_prompt(
        self,
        prompt: str,
        model: LLMModel,
        max_tokens: int = 8000
    ) -> str:
        """
        Optimize prompt to fit within token limit.
        Truncates from the middle to preserve context.
        
        Args:
            prompt: Input prompt
            model: LLM model
            max_tokens: Maximum allowed tokens
        
        Returns:
            Optimized prompt
        """
        current_tokens = self.count_tokens(prompt, model)
        
        if current_tokens <= max_tokens:
            return prompt
        
        logger.warning(
            f"Prompt exceeds {max_tokens} tokens ({current_tokens}). Truncating."
        )
        
        # Calculate target character count
        chars_per_token = len(prompt) / current_tokens
        target_chars = int(max_tokens * chars_per_token * 0.95)  # 5% buffer
        
        if target_chars >= len(prompt):
            return prompt
        
        # Truncate from middle, keep beginning and end
        keep_start = int(target_chars * 0.6)
        keep_end = int(target_chars * 0.4)
        
        truncated = (
            prompt[:keep_start] +
            "\n\n[... content truncated for length ...]\n\n" +
            prompt[-keep_end:]
        )
        
        return truncated
    
    def get_token_budget(
        self,
        monthly_budget_usd: float,
        model: LLMModel,
        input_output_ratio: float = 0.5
    ) -> Dict[str, int]:
        """
        Calculate token budget based on monthly USD budget.
        
        Args:
            monthly_budget_usd: Monthly budget in USD
            model: LLM model
            input_output_ratio: Ratio of input to output tokens (0.5 = equal)
        
        Returns:
            Dict with 'input_tokens' and 'output_tokens' budgets
        """
        costs = model.get_cost_per_1k_tokens(model)
        
        # Calculate weighted average cost per 1K tokens
        avg_cost_per_1k = (
            costs['input'] * input_output_ratio +
            costs['output'] * (1 - input_output_ratio)
        )
        
        if avg_cost_per_1k == 0:
            # Free model (Ollama)
            return {
                'input_tokens': float('inf'),
                'output_tokens': float('inf'),
            }
        
        # Total tokens available
        total_tokens = (monthly_budget_usd / avg_cost_per_1k) * 1000
        
        return {
            'input_tokens': int(total_tokens * input_output_ratio),
            'output_tokens': int(total_tokens * (1 - input_output_ratio)),
        }


# Singleton instance
token_counter = TokenCounter()
