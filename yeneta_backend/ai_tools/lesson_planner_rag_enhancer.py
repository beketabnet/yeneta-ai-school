"""
Lesson Planner RAG Enhancer for chapter-aware content extraction.
Optimizes curriculum content retrieval for lesson planning with full chapter support.
"""
import logging
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class LessonPlannerRAGEnhancer:
    """Enhances RAG queries for lesson planning with chapter awareness."""
    
    @classmethod
    def analyze_topic_for_chapter(cls, topic: str, objectives_text: str = "") -> Optional[Dict]:
        """
        Analyze topic to detect chapter/unit references.
        
        Args:
            topic: Lesson topic
            objectives_text: Concatenated learning objectives
            
        Returns:
            Dict with chapter info or None
        """
        from ai_tools.tutor_rag_enhancer import TutorRAGEnhancer
        
        # Combine topic with objectives for better detection
        combined_text = f"{topic} {objectives_text}"
        
        # Use existing chapter detection
        chapter_info = TutorRAGEnhancer.extract_chapter_info(combined_text)
        
        if chapter_info:
            logger.info(f"📖 Detected chapter in lesson topic: {chapter_info['number']}")
        
        return chapter_info
    
    @classmethod
    def build_lesson_planning_query(
        cls,
        topic: str,
        objectives: List[str],
        grade_level: str,
        subject: str,
        chapter_info: Optional[Dict] = None
    ) -> str:
        """
        Build optimized query for lesson planning.
        
        Args:
            topic: Lesson topic
            objectives: Learning objectives list
            grade_level: Grade level
            subject: Subject
            chapter_info: Chapter information if detected
            
        Returns:
            Enhanced query string
        """
        query_parts = [topic]
        
        # Add learning objectives
        if objectives:
            if isinstance(objectives, list):
                query_parts.extend(objectives[:3])
            else:
                query_parts.append(str(objectives))
        
        # Add chapter variants if available
        if chapter_info and chapter_info.get('variants'):
            query_parts.extend(chapter_info['variants'][:3])
        
        # Add context and pedagogical terms
        query_parts.append(f"{subject} Grade {grade_level}")
        query_parts.append("lesson plan teaching strategies activities 5E model")
        query_parts.append("syllabus curriculum standards competencies")
        
        enhanced_query = " ".join(query_parts)
        
        logger.info(f"🔍 Lesson planning query: {enhanced_query[:150]}...")
        
        return enhanced_query
    
    @classmethod
    def format_lesson_planning_context(
        cls,
        documents: List[Dict],
        topic: str,
        chapter_info: Optional[Dict] = None,
        max_chars: int = 8000
    ) -> Tuple[str, List[str]]:
        """
        Format curriculum content for lesson planning.
        
        Args:
            documents: Retrieved documents
            topic: Lesson topic
            chapter_info: Chapter information
            max_chars: Maximum characters
            
        Returns:
            Tuple of (formatted_context, source_list)
        """
        if not documents:
            return "", []
        
        context_parts = []
        sources = []
        
        context_parts.append("=== ETHIOPIAN CURRICULUM CONTENT ===")
        
        for i, doc in enumerate(documents[:5], 1):
            source = doc.get('source', 'Unknown')
            content = doc.get('content', '')
            
            if not content:
                continue
            
            context_parts.append(f"[Source {i}: {source}]")
            context_parts.append(content)
            context_parts.append("")
            sources.append(source)
            
            if len("\n".join(context_parts)) > max_chars:
                break
        
        context_parts.append("=== END CURRICULUM CONTENT ===")
        
        formatted_context = "\n".join(context_parts)
        return formatted_context, list(set(sources))
