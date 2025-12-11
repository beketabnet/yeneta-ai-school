"""
LLM Router - Intelligent routing for Multi-LLM strategy
Routes requests to optimal model based on task, user, cost, and connectivity.
"""

import os
import logging
from typing import Optional
from datetime import datetime

from .models import (
    LLMModel, LLMTier, TaskType, TaskComplexity, UserRole,
    LLMRequest, LLMResponse, LLMUsage
)
from .llm_service import llm_service
from .cost_tracker import cost_tracker
from .token_counter import token_counter
from .rag_service import rag_service

logger = logging.getLogger(__name__)


class LLMRouter:
    """
    Intelligent LLM router implementing Multi-LLM strategy.
    Routes requests to optimal model based on multiple factors.
    """
    
    def __init__(self):
        self.default_tier = os.getenv('DEFAULT_LLM_TIER', 'gemini-flash')
        self.enable_ollama_fallback = os.getenv('ENABLE_OLLAMA_FALLBACK', 'True') == 'True'
        self.enable_cost_optimization = os.getenv('ENABLE_COST_OPTIMIZATION', 'True') == 'True'
        
        logger.info(
            f"LLMRouter initialized. Default: {self.default_tier}, "
            f"Ollama fallback: {self.enable_ollama_fallback}"
        )
    
    def route_request(self, request: LLMRequest) -> LLMModel:
        """
        Route request to optimal LLM model.
        
        Decision factors:
        1. Connectivity status (offline → Ollama)
        2. User budget limits
        3. Task type and complexity
        4. User role
        5. Cost optimization settings
        
        Args:
            request: LLMRequest with task details
        
        Returns:
            Selected LLMModel
        """
        
        # Check connectivity
        connectivity = llm_service.check_connectivity()
        is_offline = not any(connectivity.values())
        
        # TIER 1: Offline mode - Always use Ollama
        if is_offline or not connectivity.get('gemini', False):
            if self.enable_ollama_fallback and connectivity.get('ollama', False):
                logger.info("Routing to Ollama (offline/fallback mode)")
                return self._select_ollama_model(request)
            else:
                logger.warning("No LLM providers available!")
                # Return Ollama anyway, will fail gracefully
                return LLMModel.OLLAMA_GEMMA2_2B
        
        # Check user budget limits
        if self.enable_cost_optimization:
            if not cost_tracker.check_user_limit(request.user_id, request.user_role):
                logger.warning(
                    f"User {request.user_id} exceeded daily limit. "
                    f"Routing to free tier (Ollama)"
                )
                return self._select_ollama_model(request)
        
        # Route based on task type and user role
        return self._route_by_task_and_role(request, connectivity)
    
    def _route_by_task_and_role(
        self,
        request: LLMRequest,
        connectivity: dict
    ) -> LLMModel:
        """Route based on task type, complexity, and user role"""
        
        task = request.task_type
        role = request.user_role
        complexity = request.complexity
        
        # TIER 1: Student tutoring (basic) - Use Ollama for cost savings
        if (role == UserRole.STUDENT and 
            task == TaskType.TUTORING and 
            complexity == TaskComplexity.BASIC):
            logger.info("Routing student basic tutoring to Ollama")
            return self._select_ollama_model(request)
        
        # TIER 2: Teacher tools - Use Gemini (free/subsidized)
        if role == UserRole.TEACHER:
            if task in [TaskType.LESSON_PLANNING, TaskType.RUBRIC_GENERATION]:
                logger.info("Routing teacher high-value task to Gemini Pro")
                return LLMModel.GEMINI_PRO
            
            if task in [TaskType.GRADING, TaskType.STUDENT_INSIGHTS]:
                logger.info("Routing teacher task to Gemini Pro")
                return LLMModel.GEMINI_PRO
            
            if task in [TaskType.CONVERSATION_SUMMARY, TaskType.TRANSLATION]:
                logger.info("Routing teacher simple task to Gemini Flash")
                return LLMModel.GEMINI_FLASH
        
        # TIER 2: Student tutoring (medium/advanced) - Use Gemini Flash
        if (role == UserRole.STUDENT and 
            task == TaskType.TUTORING and 
            complexity in [TaskComplexity.MEDIUM, TaskComplexity.ADVANCED]):
            logger.info("Routing student advanced tutoring to Gemini Flash")
            return LLMModel.GEMINI_FLASH

        # TIER 2: Student Lesson Planning - Use Gemini Pro (safer than Flash default)
        if (role == UserRole.STUDENT and 
            task == TaskType.LESSON_PLANNING):
            logger.info("Routing student lesson planning to Gemini Pro")
            return LLMModel.GEMINI_PRO
        
        # TIER 3: Premium features - Use OpenAI (if available and budget allows)
        if task == TaskType.CONTENT_GENERATION and request.requires_multimodal:
            budget_remaining = cost_tracker.get_budget_remaining()
            if budget_remaining > 1.0 and connectivity.get('openai', False):
                logger.info("Routing multimodal content to OpenAI GPT-4o")
                return LLMModel.GPT4O_MINI  # Use mini for cost efficiency
            else:
                logger.info("Routing multimodal content to Gemini Pro (budget/availability)")
                return LLMModel.GEMINI_PRO
        
        # TIER 2: Default to Gemini Flash (good balance of quality and cost)
        logger.info("Routing to default: Gemini Flash")
        return LLMModel.GEMINI_FLASH
    
    def _select_ollama_model(self, request: LLMRequest) -> LLMModel:
        """Select appropriate Ollama model based on requirements"""
        if request.requires_multimodal:
            return LLMModel.OLLAMA_LLAVA_7B
        
        # Use smaller model for simple tasks
        if request.complexity == TaskComplexity.BASIC:
            return LLMModel.OLLAMA_LLAMA_1B
        
        # Use medium model for most tasks
        return LLMModel.OLLAMA_GEMMA2_2B
    
    def process_request(self, request: LLMRequest) -> LLMResponse:
        """
        Process LLM request with routing, RAG, generation, and tracking.
        
        Args:
            request: LLMRequest with all parameters
        
        Returns:
            LLMResponse with generated content and metadata
        """
        start_time = datetime.now()
        
        # Route to optimal model
        selected_model = self.route_request(request)
        
        # Enforce router selection by setting it in metadata
        if request.metadata is None:
            request.metadata = {}
        request.metadata['preferred_model'] = selected_model
        
        # Apply RAG if enabled and context documents provided
        if request.use_rag and request.prompt:
            logger.info("Applying RAG to enhance prompt")
            
            # Retrieve relevant context
            rag_context = rag_service.retrieve_context(
                query=request.prompt,
                model=selected_model
            )
            
            # Enhance prompt with context
            if rag_context.documents:
                enhanced_system, enhanced_query = rag_service.enhance_prompt(
                    query=request.prompt,
                    context=rag_context,
                    system_prompt=request.system_prompt
                )
                
                # Update request with enhanced prompts
                request.system_prompt = enhanced_system
                request.prompt = enhanced_query
                
                # Add RAG metadata
                if request.metadata is None:
                    request.metadata = {}
                request.metadata['rag_documents'] = len(rag_context.documents)
                request.metadata['rag_tokens'] = rag_context.total_tokens
                
                logger.info(
                    f"RAG enhanced prompt with {len(rag_context.documents)} documents, "
                    f"{rag_context.total_tokens} tokens"
                )
        
        # Generate response
        response = llm_service.generate(request)
        
        # Track usage
        if response.success:
            usage = LLMUsage(
                user_id=request.user_id,
                user_role=request.user_role,
                model=response.model,
                task_type=request.task_type,
                input_tokens=response.input_tokens,
                output_tokens=response.output_tokens,
                cost_usd=response.cost_usd,
                latency_ms=response.latency_ms,
                timestamp=start_time,
                success=True,
                metadata=request.metadata,
            )
            cost_tracker.track_usage(usage)
        
        return response
    
    def process_json_request(self, request: LLMRequest) -> dict:
        """
        Process LLM request expecting JSON output.
        Routes to optimal model and uses robust JSON generation.
        
        Args:
            request: LLMRequest with all parameters
        
        Returns:
            Dict containing the parsed JSON response
        """
        start_time = datetime.now()
        
        # Route to optimal model
        selected_model = self.route_request(request)
        
        # Apply RAG if enabled and context documents provided
        if request.use_rag and request.prompt:
            logger.info("Applying RAG to enhance prompt for JSON generation")
            
            # Retrieve relevant context
            rag_context = rag_service.retrieve_context(
                query=request.prompt,
                model=selected_model
            )
            
            # Enhance prompt with context
            if rag_context.documents:
                enhanced_system, enhanced_query = rag_service.enhance_prompt(
                    query=request.prompt,
                    context=rag_context,
                    system_prompt=request.system_prompt
                )
                
                # Update request with enhanced prompts
                request.system_prompt = enhanced_system
                request.prompt = enhanced_query
                
                # Add RAG metadata
                if request.metadata is None:
                    request.metadata = {}
                request.metadata['rag_documents'] = len(rag_context.documents)
                request.metadata['rag_tokens'] = rag_context.total_tokens
        
        # Generate JSON using robust service method
        # Note: generate_json handles retries and cleaning internally
        json_response = llm_service.generate_json(
            prompt=request.prompt,
            model=selected_model,
            context_text=request.system_prompt,
            metadata=request.metadata
        )
        
        # Track usage (estimated since generate_json returns dict, not LLMResponse)
        # In a real implementation, generate_json should probably return an object with usage stats
        # For now, we'll skip detailed usage tracking for this path or implement it if needed
        
        return json_response
    
    def process_request_stream(self, request: LLMRequest):
        """
        Process LLM request with streaming response.
        
        Args:
            request: LLMRequest with streaming enabled
        
        Yields:
            Chunks of generated text
        """
        # Route to optimal model
        selected_model = self.route_request(request)
        
        # Stream response
        yield from llm_service.generate_stream(request)
    
    def get_routing_info(self, request: LLMRequest) -> dict:
        """
        Get routing information without executing request.
        Useful for debugging and transparency.
        
        Args:
            request: LLMRequest to analyze
        
        Returns:
            Dict with routing decision details
        """
        selected_model = self.route_request(request)
        tier = LLMModel.get_tier(selected_model)
        costs = LLMModel.get_cost_per_1k_tokens(selected_model)
        
        # Estimate tokens and cost
        estimated_input_tokens = token_counter.count_tokens(request.prompt, selected_model)
        if request.system_prompt:
            estimated_input_tokens += token_counter.count_tokens(
                request.system_prompt, selected_model
            )
        
        estimated_output_tokens = request.max_tokens
        estimated_cost = token_counter.estimate_cost(
            estimated_input_tokens,
            estimated_output_tokens,
            selected_model
        )
        
        return {
            'selected_model': selected_model.value,
            'tier': tier.value,
            'task_type': request.task_type.value,
            'user_role': request.user_role.value,
            'complexity': request.complexity.value,
            'estimated_input_tokens': estimated_input_tokens,
            'estimated_output_tokens': estimated_output_tokens,
            'estimated_cost_usd': estimated_cost,
            'cost_per_1k_input': costs['input'],
            'cost_per_1k_output': costs['output'],
            'user_daily_cost': cost_tracker.get_user_cost_today(request.user_id),
            'user_daily_limit': cost_tracker.daily_limits.get(request.user_role, 1.0),
            'monthly_budget_used': cost_tracker.get_budget_percentage_used(),
        }
    
    def get_tier_statistics(self) -> dict:
        """Get statistics on tier usage"""
        return cost_tracker.get_tier_distribution()
    
    def get_cost_analytics(self) -> dict:
        """Get comprehensive cost analytics"""
        return cost_tracker.get_analytics_summary()
    
    def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        tier_preference: str = 'tier2',
        fallback_to_ollama: bool = True,
        user_id: str = 'system',
        user_role: UserRole = UserRole.TEACHER,
        task_type: TaskType = TaskType.CONTENT_GENERATION
    ) -> dict:
        """
        Convenience method for simple text generation with automatic fallback.
        
        Args:
            prompt: User prompt
            system_prompt: System prompt (optional)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            tier_preference: Preferred tier ('tier1', 'tier2', 'tier3')
            fallback_to_ollama: Use Ollama if preferred tier fails
            user_id: User identifier
            user_role: User role
            task_type: Type of task
        
        Returns:
            Dict with 'success', 'response', 'model', 'cost_usd'
        """
        # Map tier preference to model
        tier_model_map = {
            'tier1': LLMModel.OLLAMA_GEMMA2_9B,
            'tier2': LLMModel.GEMINI_FLASH,
            'tier3': LLMModel.GPT4O_MINI
        }
        
        preferred_model = tier_model_map.get(tier_preference, LLMModel.GEMINI_FLASH)
        
        # Create request (model is passed via metadata)
        request = LLMRequest(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            user_id=user_id,
            user_role=user_role,
            task_type=task_type,
            complexity=TaskComplexity.MEDIUM,
            metadata={'preferred_model': preferred_model}
        )
        
        try:
            # Try preferred model
            response = llm_service.generate(request)
            
            if response.success:
                return {
                    'success': True,
                    'response': response.content,
                    'model': response.model.value,
                    'cost_usd': response.cost_usd,
                    'tokens': response.input_tokens + response.output_tokens
                }
            
            # If failed and fallback enabled, try Ollama
            if fallback_to_ollama:
                logger.warning(f"Primary model failed, falling back to Ollama")
                request.metadata['preferred_model'] = LLMModel.OLLAMA_GEMMA2_9B
                response = llm_service.generate(request)
                
                if response.success:
                    return {
                        'success': True,
                        'response': response.content,
                        'model': response.model.value,
                        'cost_usd': 0.0,
                        'tokens': response.input_tokens + response.output_tokens,
                        'fallback': True
                    }
            
            return {
                'success': False,
                'error': response.error or 'Generation failed',
                'model': None
            }
            
        except Exception as e:
            logger.error(f"Text generation error: {e}")
            
            # Try Ollama as last resort
            if fallback_to_ollama:
                try:
                    request.model = LLMModel.OLLAMA_GEMMA2_2B  # Use smaller model
                    response = llm_service.generate(request)
                    
                    if response.success:
                        return {
                            'success': True,
                            'response': response.text,
                            'model': response.model.value,
                            'cost_usd': 0.0,
                            'tokens': response.input_tokens + response.output_tokens,
                            'fallback': True,
                            'fallback_reason': str(e)
                        }
                except Exception as fallback_error:
                    logger.error(f"Ollama fallback also failed: {fallback_error}")
            
            return {
                'success': False,
                'error': str(e),
                'model': None
            }


# Singleton instance
llm_router = LLMRouter()
