"""
LLM Models and Enums
Defines model tiers, available models, and data structures.
"""

from enum import Enum
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from datetime import datetime


class LLMTier(Enum):
    """LLM tier classification for routing and cost optimization"""
    OLLAMA = "ollama"  # Tier 1: Free/Offline
    GEMINI = "gemini"  # Tier 2: Subsidized/Free
    OPENAI = "openai"  # Tier 3: Premium


class LLMModel(Enum):
    """Available LLM models across all providers"""
    
    # Ollama models (Tier 1 - Free/Offline)
    # Ordered by quality/capability (best first)
    OLLAMA_GPT_OSS_20B = "gpt-oss:20b"  # Best quality (when available)
    OLLAMA_LLAMA3_1 = "llama3.1"  # Good balance
    OLLAMA_LLAMA3_2 = "llama3.2"  # Good balance, faster
    OLLAMA_GEMMA2_2B = "gemma2:2b"  # Lightweight
    OLLAMA_LLAMA_1B = "llama3.2:1b"  # Fastest, lowest quality
    OLLAMA_GEMMA2_9B = "gemma2:9b"  # Heavy but good
    OLLAMA_LLAVA_7B = "llava:7b"  # Multimodal
    
    # Gemini models (Tier 2 - Free/Subsidized)
    # Gemini models (Tier 2 - Free/Subsidized)
    # Gemini models (Tier 2 - Free/Subsidized)
    GEMINI_PRO = "gemini-1.5-pro-latest"  # Free tier model
    GEMINI_FLASH = "gemini-2.5-flash-preview-09-2025"  # Latest 1M context model
    GEMINI_FLASH_8B = "gemini-1.5-flash-8b-latest"  # Free tier model
    
    # OpenAI models (Tier 3 - Premium)
    GPT4O = "gpt-4o"
    GPT4O_MINI = "gpt-4o-mini"
    DALLE3 = "dall-e-3"
    
    @classmethod
    def get_tier(cls, model: 'LLMModel') -> LLMTier:
        """Get the tier for a given model"""
        if model.value.startswith(('llama', 'gemma', 'llava')):
            return LLMTier.OLLAMA
        elif model.value.startswith('gemini'):
            return LLMTier.GEMINI
        elif model.value.startswith(('gpt', 'dall')):
            return LLMTier.OPENAI
        else:
            raise ValueError(f"Unknown model tier for: {model}")
    
    @classmethod
    def get_cost_per_1k_tokens(cls, model: 'LLMModel') -> Dict[str, float]:
        """Get cost per 1K tokens for input and output"""
        costs = {
            # Ollama - Free
            cls.OLLAMA_LLAMA_1B: {"input": 0.0, "output": 0.0},
            cls.OLLAMA_GEMMA2_2B: {"input": 0.0, "output": 0.0},
            cls.OLLAMA_GEMMA2_9B: {"input": 0.0, "output": 0.0},
            cls.OLLAMA_LLAVA_7B: {"input": 0.0, "output": 0.0},
            
            # Gemini - Free/Subsidized (using free tier pricing)
            cls.GEMINI_PRO: {"input": 0.00125, "output": 0.005},
            cls.GEMINI_FLASH: {"input": 0.000075, "output": 0.0003},
            cls.GEMINI_FLASH_8B: {"input": 0.0000375, "output": 0.00015},
            
            # OpenAI - Premium
            cls.GPT4O: {"input": 0.0025, "output": 0.01},
            cls.GPT4O_MINI: {"input": 0.00015, "output": 0.0006},
            cls.DALLE3: {"input": 0.04, "output": 0.08},  # per image
        }
        return costs.get(model, {"input": 0.0, "output": 0.0})


class TaskType(Enum):
    """Types of AI tasks for routing decisions"""
    TUTORING = "tutoring"
    LESSON_PLANNING = "lesson_planning"
    GRADING = "grading"
    RUBRIC_GENERATION = "rubric_generation"
    CONTENT_GENERATION = "content_generation"
    STUDENT_INSIGHTS = "student_insights"
    AUTHENTICITY_CHECK = "authenticity_check"
    CONVERSATION_SUMMARY = "conversation_summary"
    ALERT_ANALYSIS = "alert_analysis"
    WEB_SEARCH = "web_search"
    TRANSLATION = "translation"
    QUESTION_GENERATION = "question_generation"
    PRACTICE_EVALUATION = "practice_evaluation"


class TaskComplexity(Enum):
    """Complexity levels for task routing"""
    BASIC = "basic"
    MEDIUM = "medium"
    ADVANCED = "advanced"
    EXPERT = "expert"


class UserRole(Enum):
    """User roles for routing and cost allocation"""
    STUDENT = "Student"
    TEACHER = "Teacher"
    PARENT = "Parent"
    ADMIN = "Admin"
    SYSTEM = "System"


@dataclass
class LLMUsage:
    """Track LLM usage for cost monitoring and analytics"""
    user_id: int
    user_role: UserRole
    model: LLMModel
    task_type: TaskType
    input_tokens: int
    output_tokens: int
    cost_usd: float
    latency_ms: float
    timestamp: datetime = field(default_factory=datetime.now)
    success: bool = True
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            'user_id': self.user_id,
            'user_role': self.user_role.value,
            'model': self.model.value,
            'task_type': self.task_type.value,
            'input_tokens': self.input_tokens,
            'output_tokens': self.output_tokens,
            'cost_usd': self.cost_usd,
            'latency_ms': self.latency_ms,
            'timestamp': self.timestamp.isoformat(),
            'success': self.success,
            'error_message': self.error_message,
            'metadata': self.metadata,
        }


@dataclass
class LLMRequest:
    """Standard request format for LLM operations"""
    prompt: str
    user_id: int
    user_role: UserRole
    task_type: TaskType
    complexity: TaskComplexity = TaskComplexity.MEDIUM
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 2000
    stream: bool = False
    requires_multimodal: bool = False
    use_rag: bool = False
    context_documents: Optional[list] = None
    context_text: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    images: Optional[List[Dict[str, str]]] = None
    tools: Optional[list] = None


@dataclass
class LLMResponse:
    """Standard response format from LLM operations"""
    content: str
    model: LLMModel
    input_tokens: int
    output_tokens: int
    cost_usd: float
    latency_ms: float
    success: bool = True
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    function_calls: Optional[List[Dict[str, Any]]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            'content': self.content,
            'model': self.model.value,
            'input_tokens': self.input_tokens,
            'output_tokens': self.output_tokens,
            'cost_usd': self.cost_usd,
            'latency_ms': self.latency_ms,
            'success': self.success,
            'error_message': self.error_message,
            'metadata': self.metadata,
        }
