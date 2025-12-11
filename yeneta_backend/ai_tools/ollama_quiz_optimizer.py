"""
Ollama Quiz Optimizer
Specialized prompt engineering for smaller/local LLMs (e.g., Llama 3, Gemma 2)
to ensure valid JSON output and strict adherence to question counts.
"""

import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

class OllamaQuizOptimizer:
    """Optimizes prompts for Ollama models to ensure better compliance."""
    
    def build_ollama_specific_prompt(
        self,
        base_prompt: str,
        num_questions: int,
        question_types: Optional[List[str]] = None,
        difficulty: str = "Medium",
        is_batch: bool = False
    ) -> str:
        """
        Rebuilds the prompt to be more digestible for smaller models.
        Focuses on:
        1. Strict JSON structure
        2. Explicit Question Count
        3. Diversity of angles
        4. Strict Question Type & Difficulty Enforcement
        """
        
        # Default if not provided
        if not question_types:
            question_types = ["multiple_choice"]
            
        # Extract core context if present (simple heuristic)
        context_marker = "=== CURRICULUM CONTENT ==="
        context = ""
        if context_marker in base_prompt:
            parts = base_prompt.split(context_marker)
            if len(parts) > 1:
                context = parts[1].strip()
        
        # Build a cleaner, stricter prompt
        optimized_prompt = []
        
        optimized_prompt.append("### INSTRUCTION ###")
        optimized_prompt.append(f"You are a strict Quiz Generator. Your ONLY goal is to generate EXACTLY {num_questions} unique questions based on the text below.")
        optimized_prompt.append("You must output valid JSON only. No conversational text.")
        optimized_prompt.append("")
        
        optimized_prompt.append(f"### REQUIREMENTS ({num_questions} QUESTIONS) ###")
        optimized_prompt.append(f"1. Generate EXACTLY {num_questions} questions.")
        optimized_prompt.append("2. Output MUST be a JSON object with a 'questions' array.")
        optimized_prompt.append(f"3. ALLOWED QUESTION TYPES: {', '.join(question_types)} ONLY.")
        if len(question_types) == 1:
            optimized_prompt.append(f"   - ALL questions must be '{question_types[0]}'.")
        optimized_prompt.append(f"4. DIFFICULTY: {difficulty}. Adjust complexity accordingly.")
        optimized_prompt.append("5. Questions must be DIVERSE (mix of Facts, Concepts, Vocabulary, Inference).")
        optimized_prompt.append("6. NO duplicates.")
        optimized_prompt.append("7. NO assignment-type questions (e.g. 'Interview...', 'Group discussion...').")
        optimized_prompt.append("")
        
        optimized_prompt.append("### JSON STRUCTURE EXAMPLE ###")
        optimized_prompt.append("```json")
        optimized_prompt.append("{")
        optimized_prompt.append('  "questions": [')
        
        # Generate dynamic example based on requested types
        example_types = question_types[:2] # Show up to 2 examples
        
        for i, q_type in enumerate(example_types):
            optimized_prompt.append('    {')
            if q_type == 'multiple_choice':
                optimized_prompt.append('      "text": "What is the main cause of...?",')
                optimized_prompt.append('      "type": "multiple_choice",')
                optimized_prompt.append('      "options": ["A", "B", "C", "D"],')
                optimized_prompt.append('      "correct_answer": "A",')
            elif q_type == 'true_false':
                optimized_prompt.append('      "text": "True or False: The sky is blue.",')
                optimized_prompt.append('      "type": "true_false",')
                optimized_prompt.append('      "correct_answer": "True",')
            elif q_type == 'short_answer':
                optimized_prompt.append('      "text": "Explain why...",')
                optimized_prompt.append('      "type": "short_answer",')
                optimized_prompt.append('      "correct_answer": "Because...",')
            elif q_type == 'essay':
                optimized_prompt.append('      "text": "Discuss the impact of...",')
                optimized_prompt.append('      "type": "essay",')
                optimized_prompt.append('      "correct_answer": "Sample essay response...",')
            elif q_type == 'work_out':
                optimized_prompt.append('      "text": "Calculate the force...",')
                optimized_prompt.append('      "type": "work_out",')
                optimized_prompt.append('      "correct_answer": "10N",')
                
            optimized_prompt.append('      "points": 1.0')
            optimized_prompt.append('    }' + (',' if i < len(example_types) - 1 else ''))

        optimized_prompt.append('    // ... continue for exactly ' + str(num_questions) + ' questions')
        optimized_prompt.append('  ]')
        optimized_prompt.append("}")
        optimized_prompt.append("```")
        optimized_prompt.append("")
        
        optimized_prompt.append("### DIVERSITY ANGLES ###")
        optimized_prompt.append("- Angle 1: Factual Details (Names, Dates, Lists)")
        optimized_prompt.append("- Angle 2: Conceptual (Why/How)")
        optimized_prompt.append("- Angle 3: Vocabulary (Definitions, Synonyms)")
        optimized_prompt.append("- Angle 4: Application (Scenarios)")
        optimized_prompt.append("- Angle 5: Inference (Implied meaning)")
        optimized_prompt.append("")
        
        if context:
            optimized_prompt.append("### TEXT CONTENT ###")
            optimized_prompt.append(context)
            optimized_prompt.append("")
            
        optimized_prompt.append("### FINAL COMMAND ###")
        optimized_prompt.append(f"Generate the JSON object with {num_questions} questions now.")
        
        return "\n".join(optimized_prompt)

_optimizer = OllamaQuizOptimizer()

def get_ollama_optimizer() -> OllamaQuizOptimizer:
    return _optimizer
