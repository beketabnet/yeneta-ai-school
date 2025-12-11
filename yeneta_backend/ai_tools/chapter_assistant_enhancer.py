"""
Chapter Assistant Enhancer for Lesson Planner.
Provides chapter-aware content extraction with comprehensive topic and objective generation.
"""
import logging
import json
import re
from typing import Dict, List, Optional, Tuple
from .chapter_title_extractor import ChapterTitleExtractor

logger = logging.getLogger(__name__)


class ChapterAssistantEnhancer:
    """Enhances chapter content extraction for lesson planning with full chapter awareness."""
    
    @classmethod
    def build_enhanced_extraction_query(
        cls,
        grade: str,
        subject: str,
        chapter: str,
        chapter_info: Optional[Dict] = None
    ) -> str:
        """
        Build enhanced query for chapter content extraction.
        
        Args:
            grade: Grade level
            subject: Subject name
            chapter: Chapter/unit identifier
            chapter_info: Normalized chapter information
            
        Returns:
            Enhanced query string
        """
        query_parts = [
            f"{grade} {subject} curriculum",
            chapter
        ]
        
        # Add chapter variants if available
        if chapter_info and chapter_info.get('variants'):
            query_parts.extend(chapter_info['variants'][:5])
        
        # Add context keywords
        query_parts.extend([
            "learning objectives",
            "topics covered",
            "teaching content",
            "lesson activities",
            "assessment criteria"
        ])
        
        enhanced_query = " ".join(query_parts)
        
        logger.info(f"📚 Chapter Assistant query: {enhanced_query[:150]}...")
        
        return enhanced_query
    
    @classmethod
    def format_extraction_prompt(
        cls,
        grade: str,
        subject: str,
        chapter: str,
        chapter_info: Optional[Dict],
        rag_context: str,
        has_full_chapter: bool = False,
        has_explicit_objectives: bool = False
    ) -> str:
        """
        Format extraction prompt for LLM with chapter-aware instructions.
        
        Args:
            grade: Grade level
            subject: Subject name
            chapter: Chapter identifier
            chapter_info: Normalized chapter information
            rag_context: RAG context content
            has_full_chapter: Whether full chapter content is available
            
        Returns:
            Formatted extraction prompt
        """
        prompt_parts = []
        
        # Header
        prompt_parts.append("You are an expert Ethiopian curriculum analyst specializing in lesson planning.")
        prompt_parts.append("Your task is to extract comprehensive, accurate information for creating detailed lesson plans.")
        prompt_parts.append("")
        
        # Context section
        if has_full_chapter:
            prompt_parts.append("=== COMPLETE CHAPTER CONTENT ===")
            prompt_parts.append("You have been provided with the COMPLETE content of the chapter/unit.")
            prompt_parts.append("Use this comprehensive content to extract ALL topics and learning objectives.")
        else:
            prompt_parts.append("=== CURRICULUM CONTENT ===")
        
        prompt_parts.append(rag_context)
        prompt_parts.append("")
        
        # Task description
        prompt_parts.append("=== EXTRACTION TASK ===")
        prompt_parts.append(f"Grade Level: {grade}")
        prompt_parts.append(f"Subject: {subject}")
        prompt_parts.append(f"Chapter/Unit: {chapter}")
        
        if chapter_info:
            prompt_parts.append(f"Normalized Chapter Number: {chapter_info.get('number', 'N/A')}")
        
        prompt_parts.append("")
        
        # Instructions
        prompt_parts.append("=== INSTRUCTIONS ===")
        prompt_parts.append("Extract the following information with HIGH ACCURACY and COMPLETENESS:")
        prompt_parts.append("")
        
        prompt_parts.append("1. **Chapter Title**: The title as it appears in the curriculum")
        prompt_parts.append("   - Identify the title from the text")
        prompt_parts.append("   - Look for patterns like 'UNIT THREE ROAD SAFETY' or 'Chapter 3: Road Safety'")
        prompt_parts.append("   - Use the standard casing (e.g. 'Road Safety')")
        prompt_parts.append("   - Example: If textbook says 'UNIT THREE ROAD SAFETY', use 'Road Safety' or 'Unit Three: Road Safety'")
        prompt_parts.append("")
        
        prompt_parts.append("2. **Topics**: Major topics covered in this chapter")
        prompt_parts.append("   - List the main topics found in the text")
        prompt_parts.append("   - Include subtopics if they are distinct teaching units")
        prompt_parts.append("   - Use clear, descriptive names")
        prompt_parts.append("   - Minimum 3-5 topics, more if chapter is comprehensive")
        prompt_parts.append("")
        
        prompt_parts.append("3. **Learning Objectives**: List of learning objectives")
        
        if has_explicit_objectives:
            # Instructions when objectives section exists
            prompt_parts.append("   - Extract objectives listed in 'UNIT OBJECTIVES' or 'CHAPTER OBJECTIVES' section")
            prompt_parts.append("   - List them clearly")
            prompt_parts.append("   - Look for sections starting with 'At the end of this unit, you will be able to:'")
            prompt_parts.append("   - Include the key objectives")
            prompt_parts.append("   - If objectives don't start with action verbs, reformat them to: 'Students will be able to [objective]'")
        else:
            # Instructions when NO objectives section exists - AI must generate from content
            prompt_parts.append("   - ⚠️ IMPORTANT: This chapter does NOT have an explicit 'OBJECTIVES' section")
            prompt_parts.append("   - GENERATE comprehensive learning objectives based on the chapter content")
            prompt_parts.append("   - Analyze topics, activities, and content in the chapter")
            prompt_parts.append("   - Create objectives that align with what students will actually learn from this chapter")
            prompt_parts.append("   - Use action verbs: identify, describe, explain, analyze, apply, evaluate, create, etc.")
            prompt_parts.append("   - Format: 'Students will be able to [action verb] [specific content/skill]'")
            prompt_parts.append("   - Ensure objectives cover major topics in the chapter")
            prompt_parts.append("   - Make objectives specific, measurable, and achievable")
            prompt_parts.append("   - Consider: What should students know/do after studying this chapter?")
        
        prompt_parts.append("   - Minimum 5-10 objectives, more for comprehensive chapters")
        prompt_parts.append("   - Example: 'Students will be able to find out specific information from the listening text'")
        prompt_parts.append("   - Example: 'Students will be able to explain the main concepts of [chapter topic]'")
        prompt_parts.append("")
        
        prompt_parts.append("4. **Key Concepts**: Essential concepts students must understand")
        prompt_parts.append("   - List fundamental concepts, theories, or principles")
        prompt_parts.append("   - Include technical terms and definitions")
        prompt_parts.append("")
        
        prompt_parts.append("5. **Competencies**: Skills and competencies developed")
        prompt_parts.append("   - Cognitive, practical, and social competencies")
        prompt_parts.append("   - Aligned with Ethiopian curriculum framework")
        prompt_parts.append("")
        
        prompt_parts.append("6. **Prerequisites**: Prior knowledge required")
        prompt_parts.append("   - What students should already know")
        prompt_parts.append("   - Previous chapters or concepts needed")
        prompt_parts.append("")
        
        prompt_parts.append("7. **Duration**: Estimated teaching time")
        prompt_parts.append("   - Total lessons or hours for the chapter")
        prompt_parts.append("   - If not specified, estimate based on content volume")
        prompt_parts.append("")
        
        prompt_parts.append("8. **MoE Code**: Ethiopian Ministry of Education curriculum code")
        prompt_parts.append("   - Official curriculum standard reference")
        prompt_parts.append("   - Use null if not found")
        prompt_parts.append("")
        
        # Special instructions for full chapter
        if has_full_chapter:
            prompt_parts.append("=== SPECIAL INSTRUCTIONS FOR COMPLETE CHAPTER ===")
            prompt_parts.append("✅ You have the COMPLETE chapter content")
            prompt_parts.append("✅ If you see '[...Content Truncated...]', it means some middle sections were skipped to fit context.")
            prompt_parts.append("✅ Focus on the provided Introduction, Sampled Middle Sections, and Summary/Conclusion.")
            prompt_parts.append("✅ Extract ALL topics - do not limit to first few")
            prompt_parts.append("✅ Extract ALL learning objectives - be comprehensive")
            prompt_parts.append("✅ Ensure no major topic or objective is missed")
            prompt_parts.append("✅ This is critical for creating complete lesson plans")
            prompt_parts.append("")
        
        # Output format
        prompt_parts.append("=== OUTPUT FORMAT ===")
        prompt_parts.append("Provide a JSON response with this EXACT structure:")
        prompt_parts.append("")
        prompt_parts.append(json.dumps({
            "chapter_title": "Full chapter title as in curriculum",
            "chapter_number": "Chapter/Unit number",
            "topics": [
                "Topic 1: Clear descriptive name",
                "Topic 2: Clear descriptive name",
                "Topic 3: Clear descriptive name",
                "... (include ALL topics)"
            ],
            "objectives": [
                "Students will [action verb] [specific content]",
                "Students will [action verb] [specific content]",
                "Students will [action verb] [specific content]",
                "... (include ALL objectives, minimum 5-10)"
            ],
            "key_concepts": [
                "Concept 1",
                "Concept 2",
                "... (all key concepts)"
            ],
            "competencies": [
                "Competency 1",
                "Competency 2",
                "... (all competencies)"
            ],
            "prerequisites": "What students should already know",
            "estimated_duration": "X lessons or Y hours",
            "moe_code": "MoE curriculum code or null"
        }, indent=2))
        prompt_parts.append("")
        
        # Critical reminders
        prompt_parts.append("=== CRITICAL REMINDERS ===")
        prompt_parts.append("❗ Extract ONLY information explicitly stated in the curriculum")
        prompt_parts.append("❗ Be COMPREHENSIVE - include ALL topics and objectives")
        prompt_parts.append("❗ Use PRECISE Ethiopian curriculum terminology")
        prompt_parts.append("❗ Ensure objectives are SPECIFIC and MEASURABLE")
        prompt_parts.append("❗ If information is not found, use null")
        prompt_parts.append("")
        
        formatted_prompt = "\n".join(prompt_parts)
        
        logger.info(f"📝 Extraction prompt: {len(formatted_prompt)} chars")
        
        return formatted_prompt
    
    @classmethod
    def pre_extract_from_rag_context(
        cls,
        rag_context: str,
        chapter_number: Optional[int] = None
    ) -> Dict:
        """
        Pre-extract chapter title and objectives directly from RAG context.
        This provides more accurate extraction than relying solely on LLM.
        
        Args:
            rag_context: RAG context content
            chapter_number: Expected chapter number
            
        Returns:
            Dictionary with pre-extracted information
        """
        logger.info(f"🔍 Pre-extracting chapter info from RAG context ({len(rag_context)} chars)")
        
        # Use ChapterTitleExtractor for precise extraction
        extracted_info = ChapterTitleExtractor.extract_chapter_info(rag_context, chapter_number)
        
        # Normalize the format for quiz generator
        normalized_info = {
            'chapter_title': extracted_info.get('chapter_title'),
            'chapter_number': chapter_number,
            'objectives': extracted_info.get('formatted_objectives', []),  # Use formatted objectives
            'raw_objectives': extracted_info.get('raw_objectives', []),
            'objectives_count': extracted_info.get('objectives_count', 0),
            'has_explicit_objectives': extracted_info.get('objectives_count', 0) > 0,  # True if we found objectives
            'extraction_quality': extracted_info.get('extraction_quality', 'low')
        }
        
        # Extract topics from content using StructuredDocumentProcessor
        try:
            from rag.structured_document_processor import StructuredDocumentProcessor
            topics = StructuredDocumentProcessor.extract_topics(rag_context, max_topics=10)
            normalized_info['topics'] = topics
        except Exception as e:
            logger.warning(f"⚠️ Could not extract topics: {e}")
            normalized_info['topics'] = []
        
        # Validate content
        if chapter_number:
            is_valid, message = ChapterTitleExtractor.validate_chapter_content(rag_context, chapter_number)
            normalized_info['content_validation'] = {
                'is_valid': is_valid,
                'message': message
            }
        
        logger.info(f"✅ Pre-extracted: title={normalized_info.get('chapter_title', 'N/A')}, objectives={normalized_info.get('objectives_count', 0)}, topics={len(normalized_info.get('topics', []))}, explicit={normalized_info.get('has_explicit_objectives', False)}")
        
        return normalized_info
    
    @classmethod
    def validate_extracted_content(cls, content: Dict) -> Tuple[bool, List[str]]:
        """
        Validate extracted content for completeness and quality.
        
        Args:
            content: Extracted content dictionary
            
        Returns:
            Tuple of (is_valid, warnings)
        """
        warnings = []
        is_valid = True
        
        # Check required fields
        if not content.get('chapter_title'):
            warnings.append("⚠️ Chapter title is missing")
            is_valid = False
        
        # Check topics
        topics = content.get('topics', [])
        if not topics or len(topics) == 0:
            warnings.append("❌ No topics extracted - this is critical for lesson planning")
            is_valid = False
        elif len(topics) < 3:
            warnings.append(f"⚠️ Only {len(topics)} topics extracted - expected at least 3-5")
        
        # Check objectives
        objectives = content.get('objectives', [])
        if not objectives or len(objectives) == 0:
            warnings.append("❌ No learning objectives extracted - this is critical for lesson planning")
            is_valid = False
        elif len(objectives) < 5:
            warnings.append(f"⚠️ Only {len(objectives)} objectives extracted - expected at least 5-10")
        
        # Check objective quality
        if objectives:
            action_verbs = [
                'analyze', 'explain', 'describe', 'identify', 'apply', 'evaluate', 
                'create', 'understand', 'demonstrate', 'compare', 'solve', 'calculate',
                'define', 'list', 'discuss', 'interpret', 'summarize', 'differentiate',
                'classify', 'use', 'perform', 'measure', 'observe', 'record', 'state',
                'recognize', 'distinguish', 'outline', 'select', 'construct', 'predict',
                'infer', 'develop', 'design', 'formulate', 'assess', 'examine'
            ]
            
            objectives_with_verbs = 0
            for obj in objectives:
                obj_lower = obj.lower()
                if any(verb in obj_lower for verb in action_verbs):
                    objectives_with_verbs += 1
            
            # Lower threshold to 60% to account for varied phrasing
            if objectives_with_verbs < len(objectives) * 0.6:
                warnings.append("⚠️ Some objectives may not be action-oriented (missing action verbs)")
        
        # Check key concepts
        if not content.get('key_concepts'):
            warnings.append("ℹ️ No key concepts extracted")
        
        # Check duration
        if not content.get('estimated_duration'):
            warnings.append("ℹ️ No duration estimate provided")
        
        logger.info(f"✅ Validation: valid={is_valid}, warnings={len(warnings)}")
        
        return is_valid, warnings
    
    @classmethod
    def enhance_extracted_content(cls, content: Dict, chapter_info: Optional[Dict] = None) -> Dict:
        """
        Enhance extracted content with additional metadata and formatting.
        
        Args:
            content: Extracted content
            chapter_info: Chapter information
            
        Returns:
            Enhanced content dictionary
        """
        enhanced = content.copy()
        
        # Add chapter metadata
        if chapter_info:
            enhanced['chapter_metadata'] = {
                'number': chapter_info.get('number'),
                'variants': chapter_info.get('variants', []),
                'original_input': chapter_info.get('original')
            }
        
        # Format topics with numbering
        if enhanced.get('topics'):
            enhanced['topics_formatted'] = [
                f"{i+1}. {topic}" if not topic.startswith(f"{i+1}.") else topic
                for i, topic in enumerate(enhanced['topics'])
            ]
        
        # Format objectives with bullets
        if enhanced.get('objectives'):
            enhanced['objectives_formatted'] = [
                f"• {obj}" if not obj.startswith('•') else obj
                for obj in enhanced['objectives']
            ]
        
        # Add extraction metadata
        enhanced['extraction_metadata'] = {
            'topics_count': len(enhanced.get('topics', [])),
            'objectives_count': len(enhanced.get('objectives', [])),
            'concepts_count': len(enhanced.get('key_concepts', [])),
            'has_prerequisites': bool(enhanced.get('prerequisites')),
            'has_duration': bool(enhanced.get('estimated_duration')),
            'has_moe_code': bool(enhanced.get('moe_code'))
        }
        
        logger.info(f"✨ Enhanced content: {enhanced['extraction_metadata']}")
        
        return enhanced
