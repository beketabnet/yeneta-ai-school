"""
Enhanced Chapter Title and Objectives Extractor.
Precisely extracts chapter titles and objectives from textbook content.
"""
import logging
import re
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class ChapterTitleExtractor:
    """Extracts precise chapter titles and objectives from textbook content."""
    
    # Patterns for chapter/unit headers
    CHAPTER_HEADER_PATTERNS = [
        # "UNIT THREE ROAD SAFETY" - most common in Ethiopian textbooks
        r'(?:UNIT|CHAPTER|MODULE)\s+(?:[IVXLCDM]+|[0-9]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY)\s+([A-Z][A-Z\s]+?)(?:\s*\n|UNIT OBJECTIVES|CHAPTER OBJECTIVES|LEARNING OBJECTIVES)',
        # "CHAPTER THREE: ROAD SAFETY" with colon
        r'(?:UNIT|CHAPTER|MODULE)\s+(?:[IVXLCDM]+|[0-9]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY)\s*[:\-]\s*([A-Z][A-Z\s]+?)(?:\s*\n|UNIT OBJECTIVES|CHAPTER OBJECTIVES)',
        # "Unit 3: Road Safety" (title case)
        r'(?:Unit|Chapter|Module)\s+(?:[0-9]+|[IVXLCDM]+)\s*[:\-]\s*([A-Z][A-Za-z\s]+?)(?:\s*\n|Unit Objectives|Chapter Objectives|Learning Objectives)',
        # Standalone title in all caps after chapter number
        r'(?:UNIT|CHAPTER)\s+[0-9]+\s*\n+([A-Z][A-Z\s]+?)(?:\n\n|UNIT OBJECTIVES)',
    ]
    
    # Patterns for objectives section
    OBJECTIVES_SECTION_PATTERNS = [
        r'(?:UNIT OBJECTIVES|CHAPTER OBJECTIVES|LEARNING OBJECTIVES|OBJECTIVES)\s*:?\s*\n(.*?)(?:\n\n|\n[0-9]+\.[0-9]+|\nSECTION|\nLESSON|\nActivity|\Z)',
        r'At the end of this (?:unit|chapter|lesson), you will be able to:\s*\n(.*?)(?:\n\n|\n[0-9]+\.[0-9]+|\nSECTION|\nLESSON|\nActivity|\Z)',
    ]
    
    # Patterns for individual objectives
    OBJECTIVE_PATTERNS = [
        # Bullet points with various markers (including ø, •, -, *, etc.)
        r'[øØ•\-\*]\s*(.+?)(?:\n|$)',
        # Numbered objectives
        r'[0-9]+\.\s*(.+?)(?:\n|$)',
        # Plain lines (after "At the end..." intro)
        r'^\s*([a-z].+?)(?:\n|$)',
    ]
    
    @classmethod
    def extract_chapter_title(cls, content: str, chapter_number: Optional[int] = None) -> Optional[str]:
        """
        Extract the exact chapter/unit title from content.
        
        Args:
            content: Full chapter content or relevant excerpt
            chapter_number: Expected chapter number (optional)
            
        Returns:
            Extracted chapter title or None
        """
        # Try each pattern
        for pattern in cls.CHAPTER_HEADER_PATTERNS:
            match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE | re.DOTALL)
            if match:
                title = match.group(1).strip()
                # Clean up title
                title = re.sub(r'\s+', ' ', title)  # Normalize whitespace
                title = title.strip()
                
                # Validate title (should be reasonable length)
                if 3 <= len(title) <= 100:
                    logger.info(f"✅ Extracted chapter title: '{title}'")
                    return title
        
        # Fallback: Look for prominent all-caps text near chapter number
        if chapter_number:
            # Convert number to word
            number_words = {
                1: "ONE", 2: "TWO", 3: "THREE", 4: "FOUR", 5: "FIVE",
                6: "SIX", 7: "SEVEN", 8: "EIGHT", 9: "NINE", 10: "TEN",
                11: "ELEVEN", 12: "TWELVE", 13: "THIRTEEN", 14: "FOURTEEN", 15: "FIFTEEN"
            }
            
            chapter_patterns = [
                # Numeric
                f'UNIT {chapter_number}\\s+([A-Z][A-Z\\s]+?)(?:\\s*\\n|UNIT OBJECTIVES)',
                f'CHAPTER {chapter_number}\\s+([A-Z][A-Z\\s]+?)(?:\\s*\\n|CHAPTER OBJECTIVES)',
                # Word form
                f'UNIT {number_words.get(chapter_number, "")}\\s+([A-Z][A-Z\\s]+?)(?:\\s*\\n|UNIT OBJECTIVES)',
                f'CHAPTER {number_words.get(chapter_number, "")}\\s+([A-Z][A-Z\\s]+?)(?:\\s*\\n|CHAPTER OBJECTIVES)',
            ]
            for pattern in chapter_patterns:
                if not pattern.strip():  # Skip empty patterns
                    continue
                match = re.search(pattern, content, re.MULTILINE)
                if match:
                    title = match.group(1).strip()
                    title = re.sub(r'\s+', ' ', title)
                    if 3 <= len(title) <= 100:
                        logger.info(f"✅ Extracted chapter title (fallback): '{title}'")
                        return title
        
        logger.warning("⚠️ Could not extract chapter title")
        return None
    
    @classmethod
    def extract_objectives(cls, content: str) -> List[str]:
        """
        Extract all learning objectives from content.
        Handles multi-line objectives that may be split across lines.
        
        Args:
            content: Full chapter content or objectives section
            
        Returns:
            List of extracted objectives
        """
        objectives = []
        
        # First, try to find the objectives section
        objectives_section = None
        for pattern in cls.OBJECTIVES_SECTION_PATTERNS:
            match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE | re.DOTALL)
            if match:
                objectives_section = match.group(1)
                logger.info(f"✅ Found objectives section: {len(objectives_section)} chars")
                break
        
        if not objectives_section:
            logger.warning("⚠️ Could not find explicit objectives section - will rely on AI generation")
            return objectives  # Return empty list, AI will generate from content
        
        # Clean up the objectives section - remove extra whitespace
        objectives_section = objectives_section.strip()
        
        # Split by bullet markers - improved pattern to handle • character
        # Split on newlines that are followed by a bullet marker
        lines = objectives_section.split('\n')
        current_objective = ""
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Stop if we hit a numbered section (e.g., "3.1 Causes...")
            if re.match(r'^\d+\.\d+', line):
                break
            
            # Check if line starts with a bullet marker
            if re.match(r'^[•\-\*øØ]\s+', line):
                # Save previous objective if exists
                if current_objective:
                    obj = current_objective.strip()
                    # Validate: reasonable length and doesn't contain section numbers
                    if 10 <= len(obj) <= 500 and not re.search(r'\d+\.\d+', obj):
                        objectives.append(obj)
                
                # Start new objective (remove bullet marker)
                current_objective = re.sub(r'^[•\-\*øØ]\s+', '', line)
            else:
                # Continue current objective (multi-line)
                if current_objective:
                    current_objective += " " + line
        
        # Don't forget the last objective
        if current_objective:
            obj = current_objective.strip()
            # Validate: reasonable length and doesn't contain section numbers
            if 10 <= len(obj) <= 500 and not re.search(r'\d+\.\d+', obj):
                objectives.append(obj)
        
        logger.info(f"✅ Extracted {len(objectives)} objectives")
        
        return objectives
    
    @classmethod
    def format_objectives_for_lesson_plan(cls, objectives: List[str]) -> List[str]:
        """
        Format objectives in standard lesson plan format.
        
        Args:
            objectives: Raw extracted objectives
            
        Returns:
            Formatted objectives starting with action verbs
        """
        formatted = []
        
        # Common action verbs for objectives
        action_verbs = [
            'identify', 'describe', 'explain', 'analyze', 'apply', 'evaluate',
            'create', 'understand', 'demonstrate', 'compare', 'solve', 'calculate',
            'discuss', 'interpret', 'summarize', 'classify', 'predict', 'design',
            'construct', 'formulate', 'investigate', 'explore', 'examine', 'assess',
            'find', 'talk', 'pronounce', 'work', 'use', 'order', 'list', 'recognize'
        ]
        
        for obj in objectives:
            # Clean any remaining bullet characters
            obj = re.sub(r'^[øØ•\-\*\s]+', '', obj).strip()
            
            # Check if objective already starts with action verb
            obj_lower = obj.lower()
            starts_with_verb = any(obj_lower.startswith(verb) for verb in action_verbs)
            
            if starts_with_verb:
                # Already well-formatted
                formatted.append(obj)
            else:
                # Try to reformat
                # If it starts with "Students will be able to", keep as is
                if 'students will' in obj_lower or 'you will' in obj_lower:
                    formatted.append(obj)
                else:
                    # Prepend "Students will be able to"
                    formatted.append(f"Students will be able to {obj.lower()}")
        
        return formatted
    
    @classmethod
    def extract_chapter_info(cls, content: str, chapter_number: Optional[int] = None) -> Dict:
        """
        Extract comprehensive chapter information including title and objectives.
        
        Args:
            content: Full chapter content
            chapter_number: Expected chapter number (optional)
            
        Returns:
            Dictionary with chapter title, objectives, and metadata
        """
        # Extract title
        title = cls.extract_chapter_title(content, chapter_number)
        
        # Extract objectives
        objectives = cls.extract_objectives(content)
        
        # Format objectives
        formatted_objectives = cls.format_objectives_for_lesson_plan(objectives)
        
        result = {
            'chapter_title': title,
            'raw_objectives': objectives,
            'formatted_objectives': formatted_objectives,
            'objectives_count': len(objectives),
            'extraction_quality': 'high' if title and len(objectives) >= 3 else 'medium' if title or objectives else 'low'
        }
        
        logger.info(f"📊 Chapter extraction: title={'✓' if title else '✗'}, objectives={len(objectives)}, quality={result['extraction_quality']}")
        
        return result
    
    @classmethod
    def validate_chapter_content(cls, content: str, expected_chapter: int) -> Tuple[bool, str]:
        """
        Validate that content actually contains the expected chapter.
        
        Args:
            content: Content to validate
            expected_chapter: Expected chapter number
            
        Returns:
            Tuple of (is_valid, message)
        """
        # Check if chapter number appears in content
        chapter_patterns = [
            f'UNIT {expected_chapter}',
            f'CHAPTER {expected_chapter}',
            f'Unit {expected_chapter}',
            f'Chapter {expected_chapter}',
        ]
        
        found = any(pattern in content for pattern in chapter_patterns)
        
        if found:
            return True, f"✅ Content contains Chapter/Unit {expected_chapter}"
        else:
            return False, f"⚠️ Content may not contain Chapter/Unit {expected_chapter}"
