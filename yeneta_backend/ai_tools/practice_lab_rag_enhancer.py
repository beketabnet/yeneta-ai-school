"""
Practice Lab RAG Enhancer for adaptive question generation.
Optimizes curriculum and exam content retrieval for the Practice Labs feature.
"""
import logging
from typing import Dict, List, Optional, Tuple, Any

logger = logging.getLogger(__name__)


class PracticeLabRAGEnhancer:
    """Enhances RAG queries and prompts for Practice Labs with adaptive learning support."""
    
    @classmethod
    def analyze_topic_for_chapter(cls, topic: str, subject: str = "", grade_level: str = "") -> Optional[Dict]:
        """
        Analyze topic to detect chapter/unit references.
        Reuses the robust logic from TutorRAGEnhancer.
        """
        from ai_tools.tutor_rag_enhancer import TutorRAGEnhancer
        
        # Combine topic with subject and grade for better detection
        combined_text = f"{topic} {subject} {grade_level}"
        
        # Use existing chapter detection
        chapter_info = TutorRAGEnhancer.extract_chapter_info(combined_text)
        
        if chapter_info:
            logger.info(f"📖 Detected chapter in practice topic: {chapter_info['number']}")
        
        return chapter_info
    
    @classmethod
    def build_practice_query(
        cls,
        topic: str,
        subject: str,
        grade_level: str,
        difficulty: str,
        chapter_info: Optional[Dict] = None,
        exam_mode: bool = False
    ) -> str:
        """
        Build optimized query for practice question generation.
        """
        query_parts = []
        
        if exam_mode:
            query_parts.append(f"Grade {grade_level} {subject} exam questions about {topic}")
        else:
            query_parts.append(f"{subject} Grade {grade_level} {topic}")
        
        # Add chapter variants if available
        if chapter_info and chapter_info.get('variants'):
            query_parts.extend(chapter_info['variants'][:3])
        
        # Add context keywords
        query_parts.append(f"Difficulty: {difficulty}")
        query_parts.append("practice questions exercises assessment")
        
        if exam_mode:
            query_parts.append("national exam matric model exam")
        else:
            query_parts.append("curriculum textbook content")
            
        enhanced_query = " ".join(query_parts)
        
        logger.info(f"🔍 Practice generation query: {enhanced_query[:150]}...")
        
        return enhanced_query
    
    @classmethod
    def format_practice_context(
        cls,
        documents: List[Dict],
        topic: str,
        chapter_info: Optional[Dict] = None,
        max_chars: int = 8000
    ) -> Tuple[str, List[str]]:
        """
        Format curriculum/exam content for practice generation.
        """
        if not documents:
            return "", []
        
        # Check if we have full chapter content
        has_full_chapter = any(doc.get('full_chapter', False) for doc in documents)
        
        context_parts = []
        sources = []
        total_chars = 0
        
        # Header
        context_parts.append("=== REFERENCE CONTENT FOR QUESTION GENERATION ===")
        
        if has_full_chapter:
            context_parts.append("The following is COMPLETE CHAPTER content from official Ethiopian curriculum textbooks:")
        else:
            context_parts.append("The following content is from official Ethiopian curriculum textbooks or exams:")
        
        context_parts.append("")
        
        # Add documents
        for i, doc in enumerate(documents[:5], 1):
            source = doc.get('source', 'Unknown')
            content = doc.get('content', '')
            is_full_chapter = doc.get('full_chapter', False)
            exam_year = doc.get('metadata', {}).get('exam_year')
            
            if not content:
                continue
            
            # Build source header
            if is_full_chapter:
                chapter_num = doc.get('chapter_number', '')
                chapter_title = doc.get('title', f'Chapter {chapter_num}')
                
                source_header = f"[COMPLETE CHAPTER {chapter_num}: {chapter_title}]"
                source_header += f"\n[Source: {source}]"
            elif exam_year:
                source_header = f"[EXAM QUESTION - Year: {exam_year}]"
                source_header += f"\n[Source: {source}]"
            else:
                source_header = f"[Source {i}: {source}]"
            
            # Calculate available space
            remaining_chars = max_chars - total_chars - len(source_header) - 100
            
            if remaining_chars < 500 and not is_full_chapter:
                break
            
            # Content handling
            if is_full_chapter:
                # Full chapter content is already smartly truncated by the extractor if needed
                pass
            else:
                # Standard truncation for chunks
                if len(content) > remaining_chars:
                    content = content[:remaining_chars] + "..."
            
            # Add to context
            context_parts.append(source_header)
            context_parts.append(content)
            context_parts.append("")
            
            sources.append(source)
            total_chars += len(source_header) + len(content)
            
            # If we have full chapter, that's usually sufficient
            if is_full_chapter:
                break
        
        # Footer with instructions
        context_parts.append("=== END REFERENCE CONTENT ===")
        context_parts.append("")
        
        if has_full_chapter and chapter_info:
            context_parts.append(f"📚 COMPLETE CHAPTER {chapter_info['number']} CONTENT PROVIDED")
            context_parts.append("Use this content to generate an accurate question based strictly on the material.")
        else:
            context_parts.append("Use the above content to generate a question that aligns with Ethiopian education standards.")
        
        context_parts.append("")
        
        formatted_context = "\n".join(context_parts)
        
        return formatted_context, list(set(sources))

    @classmethod
    def get_question_style_guidance(
        cls,
        difficulty: str,
        grade_level: Any,
        coach_personality: str,
        adaptive_difficulty: bool,
        use_exam_rag: bool,
        use_curriculum_rag: bool,
        practice_mode: str = 'standard'
    ) -> str:
        """
        Determine appropriate question types and styles based on multiple factors.
        Moved from views.py to Enhancer for modularity.
        """
        # Ensure grade_level is handled correctly (could be string or int)
        try:
            grade_int = int(grade_level)
        except (ValueError, TypeError):
            grade_int = 9  # Default
            
        # Define question type pools based on difficulty
        question_types = {
            'easy': {
                'weights': 'Prefer: 50% Multiple Choice, 30% True/False, 15% Fill-in-the-Blank, 5% Short Answer'
            },
            'medium': {
                'weights': 'Prefer: 35% Multiple Choice, 30% Short Answer, 20% Fill-in-the-Blank, 10% True/False, 5% Essay'
            },
            'hard': {
                'weights': 'Prefer: 40% Short Answer, 25% Essay, 20% Multiple Choice, 10% Problem Solving, 5% Fill-in-the-Blank'
            }
        }
        
        # Adjust based on grade level
        grade_adjustments = ""
        if grade_int <= 4:
            grade_adjustments = "\n- For young learners: Use simple language, visual descriptions, and concrete examples\n- Prefer Multiple Choice and True/False for easier assessment\n- Keep questions short and focused"
        elif grade_int <= 8:
            grade_adjustments = "\n- For middle grades: Balance between recall and application\n- Mix Multiple Choice with Short Answer questions\n- Include real-world Ethiopian contexts"
        elif grade_int <= 10:
            grade_adjustments = "\n- For secondary students: Emphasize critical thinking and analysis\n- Use more Short Answer and Essay questions\n- Include multi-step problems"
        else:  # Grades 11-12
            grade_adjustments = "\n- For preparatory students: Focus on exam readiness and deep understanding\n- Prefer Essay, Problem Solving, and analytical questions\n- Match national exam question formats"
        
        # Adjust based on coach personality
        personality_styles = {
            'patient': {
                'approach': 'Use gentle, encouraging language. Break complex concepts into smaller steps.',
                'question_preference': 'Prefer guided questions with helpful hints. Use scaffolding approach.'
            },
            'energetic': {
                'approach': 'Use dynamic, engaging language. Make questions exciting and challenging.',
                'question_preference': 'Mix question types frequently. Include creative and thought-provoking questions.'
            },
            'analyst': {
                'approach': 'Use precise, technical language. Focus on logical reasoning and problem-solving.',
                'question_preference': 'Prefer analytical questions: Problem Solving, Essay, and multi-step Short Answer.'
            }
        }
        
        # Adjust based on adaptive difficulty
        adaptive_guidance = ""
        if adaptive_difficulty:
            adaptive_guidance = "\n\n**ADAPTIVE MODE ACTIVE:**\n- Start with medium difficulty and adjust based on performance\n- Include a mix of question types to assess different skills\n- Prepare follow-up questions at different difficulty levels"
        
        # Adjust based on RAG sources
        rag_style_guidance = ""
        if use_exam_rag:
            rag_style_guidance = "\n\n**EXAM RAG ACTIVE:**\n- Match question formats from past national exams\n- Use formal, exam-style language\n- Include question types commonly found in Ethiopian national exams"
        if use_curriculum_rag:
            rag_style_guidance += "\n\n**CURRICULUM RAG ACTIVE:**\n- Align questions with textbook content and learning objectives\n- Use terminology and examples from curriculum materials\n- Focus on core concepts from the syllabus"
            
        # Adjust based on Practice Mode
        mode_guidance = ""
        if practice_mode == 'exam':
            mode_guidance = "\n\n**EXAM SIMULATION MODE:**\n- Create formal, test-like questions\n- Avoid conversational or playful language\n- Focus on accuracy and standard assessment formats"
        elif practice_mode == 'game':
            mode_guidance = "\n\n**GAME MODE:**\n- Make questions fun and engaging\n- Use gamified language (e.g., 'Challenge', 'Quest')\n- Focus on quick thinking and engagement"
        
        # Build comprehensive guidance
        base_types = question_types.get(difficulty, question_types['medium'])
        personality = personality_styles.get(coach_personality, personality_styles['patient'])
        
        guidance = f"""
**QUESTION STYLE GUIDANCE:**

Question Type Distribution ({difficulty.upper()} difficulty):
{base_types['weights']}

Coach Personality ({coach_personality.upper()}):
- {personality['approach']}
- {personality['question_preference']}
{grade_adjustments}
{adaptive_guidance}
{rag_style_guidance}
{mode_guidance}
"""
        return guidance

    @classmethod
    def build_practice_prompt(
        cls,
        topic: str,
        subject: str,
        grade_level: Any,
        difficulty: str,
        rag_context: str,
        coach_personality: str = 'patient',
        adaptive_difficulty: bool = False,
        use_exam_rag: bool = False,
        use_curriculum_rag: bool = False,
        chapter_title: Optional[str] = None,
        practice_mode: str = 'standard'
    ) -> str:
        """
        Build a strict, detailed prompt for practice question generation.
        """
        # Get style guidance
        style_guidance = cls.get_question_style_guidance(
            difficulty, grade_level, coach_personality, adaptive_difficulty, use_exam_rag, use_curriculum_rag, practice_mode
        )
        
        # Determine effective topic instruction
        if chapter_title:
            topic_instruction = f"""**IMPORTANT CHAPTER MATCHING INSTRUCTIONS:**
The question MUST be based on the curriculum content provided below from {chapter_title}.

CRITICAL MATCHING RULES:
- Use ONLY the topics, concepts, and learning objectives EXPLICITLY STATED in the curriculum reference below
- Base your question DIRECTLY on what is taught in this section
- Do NOT add topics or concepts not mentioned in the curriculum content
- The curriculum content is the PRIMARY and ONLY source"""
        else:
            topic_instruction = f"""**IMPORTANT:** The question MUST be specifically about "{topic}" within the subject of {subject}. 
If curriculum content is provided, use ONLY the parts relevant to "{topic}"."""

        prompt = f"""Generate a high-quality practice question for an Ethiopian student.

**CRITICAL REQUIREMENTS:**
Subject: {subject}
Topic: {topic}
Grade Level: {grade_level}
Difficulty: {difficulty}

{topic_instruction}

{style_guidance}

{rag_context}

**IMPORTANT: Return ONLY a valid JSON object. No text before or after the JSON.**

Return this EXACT JSON structure:
{{
    "question": "The question text - MUST be based on the curriculum content provided",
    "passage": "If your question references 'the text', 'the passage', 'the article', or any reading material, include the FULL TEXT here. Otherwise, set to null or empty string.",
    "questionType": "multiple_choice" or "true_false" or "short_answer" or "essay" or "fill_blank",
    "options": ["option1", "option2", "option3", "option4"] (REQUIRED for multiple_choice, MUST be 4 options. OMIT for other types),
    "correctAnswer": "The correct answer",
    "subject": "{subject}",
    "topic": "{topic}",
    "gradeLevel": {grade_level},
    "difficulty": "{difficulty}",
    "explanation": "Brief explanation of the concept being tested, citing specific sections if available",
    "hints": ["hint1", "hint2", "hint3"]
}}

**CRITICAL QUESTION TYPE RULES:**
- If questionType is "multiple_choice": MUST include "options" array with EXACTLY 4 choices
- If questionType is "true_false": DO NOT include "options" (answer is True or False)
- If questionType is "short_answer", "essay", or "fill_blank": DO NOT include "options"
- The question text MUST match the questionType

**CRITICAL PASSAGE INCLUSION RULES:**
- If your question uses phrases like "According to the text", "In the passage", "The article states", etc., you MUST include the full text in the "passage" field
- The passage should be a complete, self-contained text
- NEVER create incomplete questions that reference missing text

Guidelines:
- Make questions culturally relevant to Ethiopia
- Use clear, grade-appropriate language
- Ensure the correct answer is accurate
- Provide helpful hints that guide thinking (scaffolding)
- Base questions on Ethiopian curriculum standards
"""
        return prompt
