"""
LLM Service - Unified interface for all LLM providers
Handles OpenAI, Google Gemini, and Ollama with error handling and retries.
"""

import os
import time
import logging
from typing import Optional, Generator, Union, Dict, Any
from datetime import datetime
import json
import re

# Import LLM providers
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logging.warning("OpenAI not available. Install with: pip install openai")

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logging.warning("Google Generative AI not available. Install with: pip install google-generativeai")

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    logging.warning("Ollama not available. Install with: pip install ollama")

from .models import LLMModel, LLMTier, LLMRequest, LLMResponse, TaskType, UserRole
from .token_counter import token_counter

logger = logging.getLogger(__name__)


# Model context window limits (in tokens)
MODEL_CONTEXT_LIMITS = {
    'gemini-1.5-flash': 1_000_000,  # 1M tokens
    'gemini-1.5-pro': 2_000_000,    # 2M tokens  
    'gemini-pro': 32_000,            # 32K tokens (older model)
    'gemma2:2b': 8_192,              # 8K tokens
    'llama3.2': 128_000,             # 128K tokens
    'llama3.1': 128_000,             # 128K tokens
    'gpt-4o': 128_000,               # 128K tokens
    'gpt-4o-mini': 128_000,          # 128K tokens
}


class LLMService:
    """
    Unified LLM service supporting multiple providers.
    Handles initialization, generation, streaming, and error recovery.
    """
    
    def __init__(self):
        self.openai_available = OPENAI_AVAILABLE
        self.genai_available = GENAI_AVAILABLE
        self.ollama_available = OLLAMA_AVAILABLE
        
        self._init_openai()
        self._init_gemini()
        self._init_ollama()
        
        logger.info(
            f"LLMService initialized. Available: "
            f"OpenAI={self.openai_available}, "
            f"Gemini={self.genai_available}, "
            f"Ollama={self.ollama_available}"
        )
    
    def _init_openai(self):
        """Initialize OpenAI client"""
        if not OPENAI_AVAILABLE:
            return
        
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            openai.api_key = api_key
            org_id = os.getenv('OPENAI_ORG_ID')
            if org_id:
                openai.organization = org_id
            logger.info("OpenAI client initialized")
        else:
            self.openai_available = False
            logger.warning("OpenAI API key not found")
    
    def _init_gemini(self):
        """Initialize Google Gemini client"""
        if not GENAI_AVAILABLE:
            return
        
        # We allow initialization even without env key because we might use DB keys
        # The actual configure() call happens per-request in _generate_gemini
        self.genai_available = True
        logger.info("Google Gemini client initialized (using API Key Rotation)")
    
    def _prepare_context_for_model(self, context: str, model: LLMModel, max_output_tokens: int = 4000) -> str:
        """
        Prepare context for a specific model by truncating if necessary.
        
        Args:
            context: The full context string
            model: Target LLM model
            max_output_tokens: Expected maximum output tokens (reserve space)
        
        Returns:
            Truncated context that fits within model limits
        """
        model_name = model.value
        max_context_tokens = MODEL_CONTEXT_LIMITS.get(model_name, 8192)
        
        # Reserve space for output (typically 50% or max_output_tokens, whichever is smaller)
        reserved_output = min(max_context_tokens // 2, max_output_tokens)
        max_input_tokens = max_context_tokens - reserved_output
        
        # Count current tokens
        current_tokens = token_counter.count_tokens(context, model)
        
        if current_tokens <= max_input_tokens:
            logger.info(f"Context fits within {model_name} limits: {current_tokens}/{max_input_tokens} tokens")
            return context
        
        # Need to truncate - use character-based approximation (1 token ≈ 4 chars)
        chars_per_token = 4
        target_chars = max_input_tokens * chars_per_token
        
        if len(context) > target_chars:
            # Smart Truncation: Keep Start (Intro/Objectives) and End (Summary/Exercises)
            # Split budget: 60% for start, 40% for end
            start_chars = int(target_chars * 0.6)
            end_chars = target_chars - start_chars - 100 # Reserve space for marker
            
            if end_chars < 100: # If budget is too small, just take start
                truncated = context[:target_chars]
            else:
                truncated = context[:start_chars]
                truncated += "\n\n[... Content Truncated to fit model context limit ...]\n\n"
                truncated += context[-end_chars:]
            
            logger.warning(
                f"Context truncated for {model_name}: {current_tokens} -> ~{max_input_tokens} tokens "
                f"({len(context)} -> {len(truncated)} chars). Preserved start & end."
            )
            return truncated
        
        return context
    
    def _init_ollama(self):
        """Initialize Ollama client"""
        if not OLLAMA_AVAILABLE:
            return
        
        self.ollama_base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.ollama_timeout = int(os.getenv('OLLAMA_TIMEOUT', 120))
        
        # Test Ollama connection
        try:
            ollama.list()
            logger.info(f"Ollama client initialized at {self.ollama_base_url}")
        except Exception as e:
            self.ollama_available = False
            logger.warning(f"Ollama not available: {e}")
    
    def generate(self, request: LLMRequest) -> LLMResponse:
        """
        Generate text using the specified model.
        
        Args:
            request: LLMRequest with all generation parameters
        
        Returns:
            LLMResponse with generated content and metadata
        """
        start_time = time.time()
        model = self._get_model_from_request(request)
        
        try:
            # Route to appropriate provider
            if model.value.startswith(('llama', 'gemma', 'llava')):
                content, input_tokens, output_tokens = self._generate_ollama(request, model)
            elif model.value.startswith('gemini'):
                content, input_tokens, output_tokens = self._generate_gemini(request, model)
            elif model.value.startswith('gpt'):
                content, input_tokens, output_tokens = self._generate_openai(request, model)
            else:
                raise ValueError(f"Unsupported model: {model}")
            
            # Calculate metrics
            latency_ms = (time.time() - start_time) * 1000
            cost_usd = token_counter.estimate_cost(input_tokens, output_tokens, model)
            
            return LLMResponse(
                content=content,
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost_usd=cost_usd,
                latency_ms=latency_ms,
                success=True,
            )
        
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            logger.error(f"LLM generation failed: {e}")
            
            return LLMResponse(
                content="",
                model=model,
                input_tokens=0,
                output_tokens=0,
                cost_usd=0.0,
                latency_ms=latency_ms,
                success=False,
                error_message=str(e),
            )
    
    def generate_json(self, prompt: str, model: Optional[LLMModel] = None, context_text: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Dict:
        """
        Generate structured JSON output from the LLM.
        
        Args:
            prompt: The prompt requesting JSON output
            model: Optional model override
            
        Returns:
            Parsed JSON dictionary
        """
        # Create request
        request = LLMRequest(
            prompt=prompt,
            task_type=TaskType.CONTENT_GENERATION, # Default to content generation
            temperature=0.2, # Lower temperature for structured output
            user_id=1, # Default system user
            user_role=UserRole.TEACHER, # Default role
            max_tokens=8192, # Ensure sufficient tokens for JSON output

            context_text=context_text,
            metadata=metadata or {}
        )
        
        if model:
            request.metadata = {'preferred_model': model}
        else:
            # Default to Gemini Pro for better JSON adherence and larger context
            request.metadata = {'preferred_model': LLMModel.GEMINI_PRO}
            
        # Generate
        response = self.generate(request)
        
        if not response.success:
            raise RuntimeError(f"LLM generation failed: {response.error_message}")
        
        content = response.content
        
        # Extract JSON from markdown code blocks if present
        # First try standard closed block
        json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
        if json_match:
            content = json_match.group(1)
        else:
            # Try finding just code blocks without language specifier
            json_match = re.search(r'```\s*([\{\[].*?[\}\]])\s*```', content, re.DOTALL)
            if json_match:
                content = json_match.group(1)
            else:
                # Handle unclosed markdown blocks (common in truncated responses)
                # Check if it starts with ```json or ``` and strip it
                if content.strip().startswith('```'):
                    # Find the first newline after ```
                    first_newline = content.find('\n')
                    if first_newline != -1:
                        content = content[first_newline+1:]
                    else:
                        # If no newline, just strip the first 3 chars
                        content = content.replace('```json', '').replace('```', '')

                # Try finding just the first { and last } (most aggressive)
                start = content.find('{')
                end = content.rfind('}')
                if start != -1:
                    if end != -1 and start < end:
                        content = content[start:end+1]
                    else:
                        # If no closing brace, take everything from start
                        content = content[start:]
                else:
                    # Try array format
                    start = content.find('[')
                    end = content.rfind(']')
                    if start != -1:
                        if end != -1 and start < end:
                            content = content[start:end+1]
                        else:
                            content = content[start:]
        
        # Strip any remaining whitespace
        content = content.strip()
        
        try:
            parsed = json.loads(content)
            if not isinstance(parsed, dict):
                # If it's a list, try to wrap it if it looks like questions
                if isinstance(parsed, list):
                    logger.warning("LLM returned a list instead of a dict. Wrapping in 'questions' key.")
                    return {"questions": parsed}
                raise ValueError(f"Parsed JSON is not a dictionary, got {type(parsed)}")
            return parsed
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"JSON parse failed: {e}")
            logger.warning(f"Problematic content (first 500 chars): {content[:500]}")
            
            # Try ast.literal_eval first (handles single quotes)
            try:
                import ast
                result = ast.literal_eval(content)
                logger.info("Successfully parsed using ast.literal_eval")
                
                if not isinstance(result, dict):
                    if isinstance(result, list):
                        return {"questions": result}
                    raise ValueError(f"Parsed AST is not a dictionary, got {type(result)}")
                    
                return result
            except Exception as ast_error:
                logger.warning(f"ast.literal_eval also failed: {ast_error}")
                
            try:
                # Attempt repair
                repaired_content = self._repair_json(content)
                result = json.loads(repaired_content)
                
                if not isinstance(result, dict):
                    if isinstance(result, list):
                        return {"questions": result}
                    raise ValueError(f"Parsed repaired JSON is not a dictionary, got {type(result)}")
                    
                logger.info("Successfully parsed after JSON repair")
                return result
            except Exception as repair_error:
                logger.error(f"Failed to parse JSON after repair: {repair_error}")
                logger.error(f"Original content:\n{content[:1000]}")
                raise RuntimeError(f"Failed to parse JSON response: {e}")

    def _repair_json(self, json_str: str) -> str:
        """Attempt to repair malformed JSON string using stack-based logic"""
        # 1. Locate start of JSON
        first_brace = json_str.find('{')
        first_bracket = json_str.find('[')
        
        if first_brace == -1 and first_bracket == -1:
            return json_str
            
        if first_brace != -1 and first_bracket != -1:
            start_pos = min(first_brace, first_bracket)
        elif first_brace != -1:
            start_pos = first_brace
        else:
            start_pos = first_bracket
        
        if start_pos > 0:
            logger.info(f"Stripping {start_pos} chars of non-JSON content")
            json_str = json_str[start_pos:]

        # 2. Stack-based repair for truncation and nesting
        stack = []
        in_string = False
        escape = False
        
        for i, char in enumerate(json_str):
            if escape:
                escape = False
                continue
                
            if char == '\\':
                escape = True
                continue
                
            if char == '"':
                in_string = not in_string
                continue
                
            if not in_string:
                if char == '{':
                    stack.append('}')
                elif char == '[':
                    stack.append(']')
                elif char == '}' or char == ']':
                    if stack:
                        if stack[-1] == char:
                            stack.pop()
                        else:
                            # Mismatched closer - ignore or handle?
                            pass
        
        # 3. Close unclosed string
        if in_string:
            json_str += '"'
            
        # 4. Remove trailing comma if present (before closing)
        json_str = json_str.strip()
        if json_str.endswith(','):
            json_str = json_str[:-1]
            
        # 5. Handle trailing colon (e.g. "key":)
        if json_str.endswith(':'):
             json_str += ' null'

        # 6. Close remaining structures
        while stack:
            closer = stack.pop()
            json_str += closer
            
        # 7. Final cleanup of internal trailing commas (regex)
        json_str = re.sub(r',\s*([\]}])', r'\1', json_str)
        
        # 8. Insert missing commas between objects/arrays (common LLM error)
        # Replace }{ with }, {
        json_str = re.sub(r'}\s*{', '}, {', json_str)
        # Replace ][ with ], [
        json_str = re.sub(r']\s*\[', '], [', json_str)
        
        # 9. Quote fix (legacy support)
        json_str = re.sub(r":\s*'([^']*)'" , r': "\1"', json_str)
        json_str = re.sub(r"'([^']+)':" , r'"\1":', json_str)
        
        return json_str

    def _get_model_from_request(self, request: LLMRequest) -> LLMModel:
        """Determine which model to use (can be overridden by router via metadata)"""
        # Check if router specified a preferred model via metadata
        if request.metadata and 'preferred_model' in request.metadata:
            return request.metadata['preferred_model']
        
        # Otherwise, use default based on task type
        if request.task_type.value in ['tutoring', 'translation']:
            return LLMModel.OLLAMA_GEMMA2_2B
        elif request.task_type.value in ['lesson_planning', 'grading']:
            return LLMModel.GEMINI_PRO
        else:
            return LLMModel.GEMINI_FLASH
    
    def _generate_ollama(
        self,
        request: LLMRequest,
        model: LLMModel
    ) -> tuple[str, int, int]:
        """Generate using Ollama"""
        if not self.ollama_available:
            raise RuntimeError("Ollama is not available")
        
        # Build prompt
        full_prompt = request.prompt
        
        # Add context if provided (truncated for model)
        if request.context_text:
            # Reserve tokens for prompt and output
            prompt_tokens = token_counter.count_tokens(request.prompt, model)
            reserved_tokens = (request.max_tokens or 2000) + prompt_tokens + 100
            
            # Truncate context
            truncated_context = self._prepare_context_for_model(
                request.context_text, 
                model, 
                reserved_tokens
            )
            full_prompt += f"\n\n=== CONTEXT ===\n{truncated_context}\n"

        if request.system_prompt:
            full_prompt = f"{request.system_prompt}\n\n{full_prompt}"
        
        # Final check for total length (though _prepare_context should have handled it)
        full_prompt = self._prepare_context_for_model(full_prompt, model, request.max_tokens or 2000)
        
        # Count input tokens
        input_tokens = token_counter.count_tokens(full_prompt, model)
        
        try:
            response = ollama.generate(
                model=model.value,
                prompt=full_prompt,
                options={
                    'temperature': request.temperature,
                    'num_predict': request.max_tokens,
                },
                stream=False,
            )
            
            content = response['response']
            output_tokens = token_counter.count_tokens(content, model)
            
            return content, input_tokens, output_tokens
        
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise
    
    def _generate_gemini(
        self,
        request: LLMRequest,
        model: LLMModel
    ) -> tuple[str, int, int]:
        """Generate using Google Gemini with automatic key rotation and Ollama fallback"""
        if not self.genai_available:
            raise RuntimeError("Google Gemini is not available")
        
        # Import here to avoid circular imports
        from api_key_rotation import get_api_key_rotator, APIKeyRotationError
        rotator = get_api_key_rotator()
        
        def _call_gemini_api(api_key, *args, key_model=None, **kwargs):
            # Configure with specific key
            genai.configure(api_key=api_key)
            
            # Use model from key config if available, otherwise use requested model
            model_name = key_model if key_model else model.value
            # logger.info(f"Using Gemini model: {model_name}")
            
            gemini_model = genai.GenerativeModel(model_name)
            
            # Build prompt
            full_prompt = request.prompt
            
            # Add context if provided
            if request.context_text:
                full_prompt += f"\n\n=== CONTEXT ===\n{request.context_text}\n"
                
            if request.system_prompt:
                full_prompt = f"{request.system_prompt}\n\n{full_prompt}"
            
            # Configure safety settings to avoid blocking legitimate educational content
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_NONE",
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_NONE",
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE",
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE",
                },
            ]

            # Generate
            response = gemini_model.generate_content(
                full_prompt,
                generation_config=genai.GenerationConfig(
                    temperature=request.temperature,
                    max_output_tokens=request.max_tokens,
                ),
                safety_settings=safety_settings
            )
            
            # Check if response has valid parts
            if not response.parts:
                # Check finish reason
                finish_reason = "UNKNOWN"
                finish_code = 0
                
                if response.candidates and response.candidates[0].finish_reason:
                    finish_code = response.candidates[0].finish_reason
                    # Map common codes
                    # 1=STOP, 2=MAX_TOKENS, 3=SAFETY, 4=RECITATION, 5=OTHER
                    reason_map = {
                        1: "STOP",
                        2: "MAX_TOKENS (Content Truncated or Empty)",
                        3: "SAFETY (Blocked by Safety Settings)",
                        4: "RECITATION (Copyright/Plagiarism Block)",
                        5: "OTHER"
                    }
                    finish_reason = reason_map.get(finish_code, f"UNKNOWN_CODE_{finish_code}")
                
                error_msg = f"Gemini returned no content. Finish reason: {finish_reason}"
                logger.error(f"❌ Gemini Generation Blocked: {error_msg}")
                raise ValueError(error_msg)
                
            return response.text
            
        try:
            # Calculate input tokens first
            full_prompt = request.prompt
            if request.context_text:
                full_prompt += f"\n\n=== CONTEXT ===\n{request.context_text}\n"
            if request.system_prompt:
                full_prompt = f"{request.system_prompt}\n\n{full_prompt}"
            input_tokens = token_counter.count_tokens(full_prompt, model)
            
            # Execute with rotation
            content = rotator.execute_with_fallback(
                provider='gemini',
                operation=_call_gemini_api,
                tokens_needed=input_tokens + (request.max_tokens or 1000),
                model=model.value
            )
            
            output_tokens = token_counter.count_tokens(content, model)
            return content, input_tokens, output_tokens
            
        except Exception as e:
            logger.warning(f"Gemini generation failed with all keys: {e}")
            
            # Try Ollama fallback if available
            if self.ollama_available:
                try:
                    logger.info("Falling back to Ollama due to Gemini failure")
                    
                    # Smart model selection based on task
                    from ai_tools.llm.ollama_model_selector import get_ollama_model_selector
                    selector = get_ollama_model_selector()
                    available_models = selector.get_available_models()
                    
                    # Try up to 3 different models if one fails (e.g. OOM)
                    failed_models = set()
                    max_attempts = 3
                    
                    for attempt in range(max_attempts):
                        # Filter out failed models
                        current_available = [m for m in available_models if m not in failed_models]
                        if not current_available:
                            logger.warning("No more Ollama models available to try")
                            break
                            
                        selected_model = selector.select_best_model(
                            task_type=request.task_type,
                            complexity=request.complexity,
                            available_models=current_available,
                            prefer_speed=False
                        )
                        
                        if selected_model.value in failed_models:
                            # Should not happen due to filtering, but safety check
                            break
                            
                        logger.info(f"🎯 Selected Ollama model (Attempt {attempt+1}/{max_attempts}): {selected_model.value}")
                        
                        try:
                            # Check if this is a quiz generation task
                            is_quiz_task = any(keyword in request.prompt.lower() for keyword in ['quiz', 'questions', 'generate', 'assessment'])
                            
                            if is_quiz_task:
                                logger.info("Detected quiz generation task - using Ollama optimizer")
                                try:
                                    from ai_tools.ollama_quiz_optimizer import get_ollama_optimizer
                                    optimizer = get_ollama_optimizer()
                                    
                                    # Enhance the prompt with Ollama-specific instructions
                                    # Extract quiz params from metadata
                                    num_questions = request.metadata.get('num_questions', 15)
                                    question_types = request.metadata.get('question_types', ['multiple_choice'])
                                    difficulty = request.metadata.get('difficulty', 'Medium')

                                    # Enhance the prompt with Ollama-specific instructions
                                    enhanced_prompt = optimizer.build_ollama_specific_prompt(
                                        base_prompt=request.prompt,
                                        num_questions=num_questions,
                                        question_types=question_types,
                                        difficulty=difficulty,
                                        is_batch=False
                                    )
                                    
                                    # Create enhanced request
                                    enhanced_request = LLMRequest(
                                        prompt=enhanced_prompt,
                                        user_id=request.user_id,
                                        user_role=request.user_role,
                                        task_type=request.task_type,
                                        complexity=request.complexity,
                                        system_prompt=request.system_prompt,
                                        temperature=request.temperature,
                                        max_tokens=request.max_tokens,
                                        stream=request.stream,
                                        requires_multimodal=request.requires_multimodal,
                                        use_rag=request.use_rag,
                                        context_documents=request.context_documents,
                                        context_text=request.context_text,
                                        metadata=request.metadata
                                    )
                                    
                                    return self._generate_ollama(enhanced_request, selected_model)
                                except ImportError as import_error:
                                    logger.warning(f"Could not import Ollama optimizer: {import_error}")
                                    return self._generate_ollama(request, selected_model)
                            else:
                                # Standard Ollama fallback for non-quiz tasks
                                return self._generate_ollama(request, selected_model)
                                
                        except Exception as model_error:
                            logger.warning(f"Ollama model {selected_model.value} failed: {model_error}")
                            failed_models.add(selected_model.value)
                            # Continue to next iteration to try another model
                            continue
                    
                    # If we exit the loop without returning, all attempts failed
                    raise RuntimeError(f"All Ollama fallback attempts failed. Models tried: {failed_models}")

                except Exception as ollama_error:
                    logger.error(f"Ollama fallback completely failed: {ollama_error}")
                    raise RuntimeError(f"Gemini failed and Ollama fallback failed. Original error: {e}") from e
            else:
                logger.warning("Ollama fallback skipped because Ollama is not available (check logs for init failure).")
            
            raise
    
    def _generate_openai(
        self,
        request: LLMRequest,
        model: LLMModel
    ) -> tuple[str, int, int]:
        """Generate using OpenAI"""
        if not self.openai_available:
            raise RuntimeError("OpenAI is not available")
        
        try:
            # Build messages
            messages = []
            if request.system_prompt:
                messages.append({"role": "system", "content": request.system_prompt})
            
            content_prompt = request.prompt
            if request.context_text:
                content_prompt += f"\n\n=== CONTEXT ===\n{request.context_text}\n"
            
            messages.append({"role": "user", "content": content_prompt})
            
            # Count input tokens
            input_tokens = token_counter.count_messages_tokens(
                messages, model, request.system_prompt
            )
            
            # Generate
            response = openai.ChatCompletion.create(
                model=model.value,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            )
            
            content = response.choices[0].message.content
            output_tokens = token_counter.count_tokens(content, model)
            
            return content, input_tokens, output_tokens
        
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            raise
    
    def generate_stream(self, request: LLMRequest) -> Generator[str, None, None]:
        """
        Generate text with streaming response.
        
        Args:
            request: LLMRequest with streaming enabled
        
        Yields:
            Chunks of generated text
        """
        model = self._get_model_from_request(request)
        
        try:
            if model.value.startswith(('llama', 'gemma', 'llava')):
                yield from self._generate_ollama_stream(request, model)
            elif model.value.startswith('gemini'):
                yield from self._generate_gemini_stream(request, model)
            elif model.value.startswith('gpt'):
                yield from self._generate_openai_stream(request, model)
            else:
                raise ValueError(f"Unsupported model for streaming: {model}")
        
        except Exception as e:
            logger.error(f"Streaming generation failed: {e}")
            yield f"Error: {str(e)}"
    
    def _generate_ollama_stream(
        self,
        request: LLMRequest,
        model: LLMModel
    ) -> Generator[str, None, None]:
        """Stream generation from Ollama"""
        if not self.ollama_available:
            yield "Error: Ollama is not available"
            return
        
        full_prompt = request.prompt
        if request.system_prompt:
            full_prompt = f"{request.system_prompt}\n\n{request.prompt}"
        
        try:
            stream = ollama.generate(
                model=model.value,
                prompt=full_prompt,
                options={
                    'temperature': request.temperature,
                    'num_predict': request.max_tokens,
                },
                stream=True,
            )
            
            for chunk in stream:
                if 'response' in chunk:
                    yield chunk['response']
        
        except Exception as e:
            logger.error(f"Ollama streaming failed: {e}")
            yield f"Error: {str(e)}"
    
    def _generate_gemini_stream(
        self,
        request: LLMRequest,
        model: LLMModel
    ) -> Generator[str, None, None]:
        """Stream generation from Gemini"""
        if not self.genai_available:
            yield "Error: Google Gemini is not available"
            return
        
        try:
            gemini_model = genai.GenerativeModel(model.value)
            
            full_prompt = request.prompt
            if request.system_prompt:
                full_prompt = f"{request.system_prompt}\n\n{request.prompt}"
            
            response = gemini_model.generate_content(
                full_prompt,
                generation_config=genai.GenerationConfig(
                    temperature=request.temperature,
                    max_output_tokens=request.max_tokens,
                ),
                stream=True,
            )
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        
        except Exception as e:
            logger.error(f"Gemini streaming failed: {e}")
            yield f"Error: {str(e)}"
    
    def _generate_openai_stream(
        self,
        request: LLMRequest,
        model: LLMModel
    ) -> Generator[str, None, None]:
        """Stream generation from OpenAI"""
        if not self.openai_available:
            yield "Error: OpenAI is not available"
            return
        
        try:
            messages = []
            if request.system_prompt:
                messages.append({"role": "system", "content": request.system_prompt})
            messages.append({"role": "user", "content": request.prompt})
            
            response = openai.ChatCompletion.create(
                model=model.value,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                stream=True,
            )
            
            for chunk in response:
                if chunk.choices[0].delta.get('content'):
                    yield chunk.choices[0].delta.content
        
        except Exception as e:
            logger.error(f"OpenAI streaming failed: {e}")
            yield f"Error: {str(e)}"
    
    def check_connectivity(self) -> Dict[str, bool]:
        """Check connectivity status for all providers"""
        status = {
            'ollama': False,
            'gemini': False,
            'openai': False,
        }
        
        # Check Ollama
        if self.ollama_available:
            try:
                ollama.list()
                status['ollama'] = True
            except:
                pass
        
        # Check Gemini
        if self.genai_available:
            try:
                # Simple API call to check connectivity
                status['gemini'] = True
            except:
                pass
        
        # Check OpenAI
        if self.openai_available:
            try:
                # Simple API call to check connectivity
                status['openai'] = True
            except:
                pass
        
        return status


# Singleton instance
llm_service = LLMService()
