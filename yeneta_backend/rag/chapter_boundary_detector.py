"""
Chapter Boundary Detector for structured document processing.
Identifies chapter/section/lesson boundaries in curriculum documents.
"""
import re
import logging
from typing import List, Dict, Optional, Tuple

logger = logging.getLogger(__name__)


class ChapterBoundaryDetector:
    """Detects chapter, section, and lesson boundaries in documents."""
    
    # Enhanced Chapter/Unit/Lesson header patterns with more variations
    CHAPTER_PATTERNS = [
        # Standard formats (case-insensitive, with optional punctuation)
        r'^(?:UNIT|CHAPTER|LESSON|MODULE)\s*[:\-]?\s*([IVXLCDM]+|[0-9]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY)',
        # Abbreviated forms
        r'^(?:CH|U|L|M)\.?\s*([IVXLCDM]+|[0-9]+)',
        # With "No." or "Number"
        r'^(?:UNIT|CHAPTER|LESSON|MODULE)\s+(?:NO\.?|NUMBER)\s*[:\-]?\s*([IVXLCDM]+|[0-9]+)',
        # Amharic patterns
        r'^(?:ምዕራፍ|ክፍል|ትምህርት)\s*[:\-]?\s*([0-9]+|[፩-፳])',
        # Numbered format (e.g., "3. Chapter Title")
        r'^([0-9]+)\.\s*(?:UNIT|CHAPTER|LESSON|MODULE)',
    ]
    
    # Enhanced Section header patterns (within chapters)
    SECTION_PATTERNS = [
        r'^SECTION\s*[:\-]?\s*([IVXLCDM]+|[0-9]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)',
        r'^[0-9]+\.[0-9]+(?:\.[0-9]+)?\s+',  # e.g., "1.1 Introduction" or "1.1.1 Subsection"
        r'^PART\s*[:\-]?\s*([IVXLCDM]+|[0-9]+|ONE|TWO|THREE|FOUR|FIVE)',
        # Subsection patterns
        r'^([0-9]+\.[0-9]+)\s+',  # e.g., "1.1 Topic"
        # Topic/Subsection headers
        r'^([A-Z][0-9]?)\s+',  # e.g., "A Introduction", "A1 Overview"
    ]
    
    # Word to number mapping
    WORD_TO_NUM = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
        'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
        'nineteen': 19, 'twenty': 20
    }
    
    # Roman numeral mapping
    ROMAN_TO_NUM = {
        'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
        'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10,
        'xi': 11, 'xii': 12, 'xiii': 13, 'xiv': 14, 'xv': 15,
        'xvi': 16, 'xvii': 17, 'xviii': 18, 'xix': 19, 'xx': 20
    }
    
    @classmethod
    def detect_chapter_boundary(cls, text: str, start_pos: int = 0) -> Optional[Dict]:
        """
        Detect if text contains a chapter boundary.
        
        Args:
            text: Text to analyze
            start_pos: Starting position in text
            
        Returns:
            Dict with boundary info or None
        """
        lines = text[start_pos:].split('\n')
        
        for i, line in enumerate(lines[:20]):  # Check first 20 lines
            line_stripped = line.strip()
            
            # Check chapter patterns
            for pattern in cls.CHAPTER_PATTERNS:
                match = re.match(pattern, line_stripped, re.IGNORECASE)
                if match:
                    chapter_type = pattern.split(r'\s+')[0].replace('^', '')
                    chapter_raw = match.group(1)
                    chapter_num = cls._normalize_number(chapter_raw)
                    
                    # Extract title (text after chapter number) - enhanced pattern
                    title_patterns = [
                        r'(?:UNIT|CHAPTER|LESSON|MODULE)\s*[:\-]?\s*[^\s:]+[:\-\s]+(.+)',
                        r'[0-9]+\.\s*(.+)',  # For "3. Chapter Title" format
                        r'[IVXLCDM]+[:\-\s]+(.+)',  # For Roman numerals
                    ]
                    title = ""
                    for pattern in title_patterns:
                        title_match = re.search(pattern, line_stripped, re.IGNORECASE)
                        if title_match:
                            title = title_match.group(1).strip()
                            # Clean up title (remove extra whitespace, special chars at start)
                            title = re.sub(r'^[:\-\s]+', '', title)
                            title = re.sub(r'\s+', ' ', title)
                            if title:
                                break
                    
                    return {
                        'type': 'chapter',
                        'chapter_type': chapter_type.lower(),
                        'number': chapter_num,
                        'raw': chapter_raw,
                        'title': title,
                        'line_offset': i,
                        'full_header': line_stripped
                    }
        
        return None
    
    @classmethod
    def detect_section_boundary(cls, text: str, start_pos: int = 0) -> Optional[Dict]:
        """
        Detect if text contains a section boundary.
        
        Args:
            text: Text to analyze
            start_pos: Starting position in text
            
        Returns:
            Dict with boundary info or None
        """
        lines = text[start_pos:].split('\n')
        
        for i, line in enumerate(lines[:10]):  # Check first 10 lines
            line_stripped = line.strip()
            
            # Check section patterns
            for pattern in cls.SECTION_PATTERNS:
                match = re.match(pattern, line_stripped, re.IGNORECASE)
                if match:
                    if 'SECTION' in pattern or 'PART' in pattern:
                        section_raw = match.group(1)
                        section_num = cls._normalize_number(section_raw)
                    else:
                        # For numbered sections like "1.1"
                        section_num = line_stripped.split()[0]
                        section_raw = section_num
                    
                    return {
                        'type': 'section',
                        'number': section_num,
                        'raw': section_raw,
                        'line_offset': i,
                        'full_header': line_stripped
                    }
        
        return None
    
    @classmethod
    def _normalize_number(cls, num_str: str) -> int:
        """Normalize chapter/section number from various formats."""
        num_str_lower = num_str.lower().strip()
        
        # Direct number
        if num_str_lower.isdigit():
            return int(num_str_lower)
        
        # Word form
        if num_str_lower in cls.WORD_TO_NUM:
            return cls.WORD_TO_NUM[num_str_lower]
        
        # Roman numeral
        if num_str_lower in cls.ROMAN_TO_NUM:
            return cls.ROMAN_TO_NUM[num_str_lower]
        
        # Default
        return 1
    
    @classmethod
    def split_document_by_chapters(cls, full_text: str) -> List[Dict]:
        """
        Split document into chapters with metadata.
        
        Args:
            full_text: Complete document text
            
        Returns:
            List of chapter dicts with content and metadata
        """
        chapters = []
        current_pos = 0
        
        while current_pos < len(full_text):
            # Detect next chapter boundary
            boundary = cls.detect_chapter_boundary(full_text, current_pos)
            
            if boundary:
                # Calculate actual position
                lines_before = full_text[:current_pos].count('\n')
                boundary_pos = current_pos + len('\n'.join(full_text[current_pos:].split('\n')[:boundary['line_offset']]))
                
                # If we have a previous chapter, set its end
                if chapters:
                    chapters[-1]['end_pos'] = boundary_pos
                    chapters[-1]['content'] = full_text[chapters[-1]['start_pos']:boundary_pos]
                
                # Start new chapter
                chapters.append({
                    'chapter_number': boundary['number'],
                    'chapter_type': boundary['chapter_type'],
                    'title': boundary['title'],
                    'start_pos': boundary_pos,
                    'end_pos': len(full_text),  # Will be updated when next chapter found
                    'content': '',  # Will be filled later
                    'metadata': {
                        'chapter': str(boundary['number']),
                        'chapter_raw': boundary['raw'],
                        'chapter_type': boundary['chapter_type'],
                        'title': boundary['title']
                    }
                })
                
                # Move to next line after boundary
                current_pos = boundary_pos + len(boundary['full_header']) + 1
            else:
                # No more chapters found
                if chapters:
                    # Set content for last chapter
                    chapters[-1]['end_pos'] = len(full_text)
                    chapters[-1]['content'] = full_text[chapters[-1]['start_pos']:]
                break
        
        # If no chapters detected, treat entire document as one chapter
        if not chapters:
            chapters.append({
                'chapter_number': 1,
                'chapter_type': 'document',
                'title': 'Complete Document',
                'start_pos': 0,
                'end_pos': len(full_text),
                'content': full_text,
                'metadata': {
                    'chapter': '1',
                    'chapter_raw': '1',
                    'chapter_type': 'document',
                    'title': 'Complete Document'
                }
            })
        
        logger.info(f"📚 Split document into {len(chapters)} chapters")
        for ch in chapters:
            logger.debug(f"  Chapter {ch['chapter_number']}: {ch['title'][:50]}... ({len(ch['content'])} chars)")
        
        return chapters
    
    @classmethod
    def extract_chapter_sections(cls, chapter_content: str) -> List[Dict]:
        """
        Extract sections within a chapter.
        
        Args:
            chapter_content: Content of a single chapter
            
        Returns:
            List of section dicts with content and metadata
        """
        sections = []
        current_pos = 0
        
        while current_pos < len(chapter_content):
            boundary = cls.detect_section_boundary(chapter_content, current_pos)
            
            if boundary:
                boundary_pos = current_pos + len('\n'.join(chapter_content[current_pos:].split('\n')[:boundary['line_offset']]))
                
                if sections:
                    sections[-1]['end_pos'] = boundary_pos
                    sections[-1]['content'] = chapter_content[sections[-1]['start_pos']:boundary_pos]
                
                sections.append({
                    'section_number': boundary['number'],
                    'start_pos': boundary_pos,
                    'end_pos': len(chapter_content),
                    'content': '',
                    'metadata': {
                        'section': str(boundary['number']),
                        'section_raw': boundary['raw']
                    }
                })
                
                current_pos = boundary_pos + len(boundary['full_header']) + 1
            else:
                if sections:
                    sections[-1]['end_pos'] = len(chapter_content)
                    sections[-1]['content'] = chapter_content[sections[-1]['start_pos']:]
                break
        
        # If no sections, treat entire chapter as one section
        if not sections:
            sections.append({
                'section_number': 1,
                'start_pos': 0,
                'end_pos': len(chapter_content),
                'content': chapter_content,
                'metadata': {
                    'section': '1',
                    'section_raw': '1'
                }
            })
        
        return sections
