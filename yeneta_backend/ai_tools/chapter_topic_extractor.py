"""
Chapter Topic Extractor for AI Tutor.
Extracts meaningful topics, objectives, and key concepts from chapter content.
"""
import re
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class ChapterTopicExtractor:
    """Extracts topics, objectives, and key concepts from chapter content."""
    
    # Patterns for extracting learning objectives
    OBJECTIVE_PATTERNS = [
        r'(?:objective|goal|outcome|competency)[s]?:?\s*(.+?)(?:\n|$)',
        r'at\s+the\s+end\s+of\s+(?:this\s+)?(?:unit|chapter|lesson)[\s,]+you\s+will\s+be\s+able\s+to:?\s*(.+?)(?:\n\n|\Z)',
        r'you\s+will\s+(?:learn|study|understand|explore)[\s:]+(.+?)(?:\n\n|\Z)',
        r'learning\s+objectives?:?\s*(.+?)(?:\n\n|\Z)',
    ]
    
    # Patterns for extracting topics/sections
    TOPIC_PATTERNS = [
        r'(?:topic|section|theme|concept)[s]?:?\s*(.+?)(?:\n|$)',
        r'\d+\.\d+\s+(.+?)(?:\n|$)',  # Numbered sections like "3.1 Introduction"
        r'^([A-Z][A-Z\s]{10,})$',  # All caps headings
    ]
    
    # Stop words for topic filtering
    STOP_WORDS = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
        'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
        'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
        'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
        'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why',
        'how', 'about', 'into', 'through', 'during', 'before', 'after',
        'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
        'again', 'further', 'then', 'once', 'here', 'there', 'when',
        'where', 'why', 'how', 'all', 'each', 'both', 'few', 'more',
        'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
        'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now'
    }
    
    # Patterns to exclude (metadata, structural elements)
    EXCLUDE_PATTERNS = [
        r'^(?:english|math|science|physics|chemistry|biology)\s+grade\s+\d+\s+student\s+book',
        r'^(?:page|table|figure|fig\.?)\s+\d+',
        r'^lesson\s+\d+$',
        r'^unit\s+\d+$',
        r'^chapter\s+\d+$',
        r'^of\s+remediation\s+is\s+to',
        r'^at\s+the\s+end\s+of\s+this\s+unit',
        r'^you\s+will\s+be\s+able\s+to:?$',
        r'^unit\s+objectives?:?$',
        r'^learning\s+objectives?:?$',
        r'^\d+\.\s*$',  # Just numbers
        r'^[•\-\*]\s*$',  # Just bullet points
    ]
    
    @classmethod
    def extract_objectives(cls, content: str) -> List[str]:
        """
        Extract learning objectives from chapter content.
        
        Args:
            content: Chapter content text
            
        Returns:
            List of learning objectives
        """
        objectives = []
        
        # First, find the objectives section more precisely
        # Look for "At the end of this unit, you will be able to:" pattern
        objectives_section_pattern = r'(?:at\s+the\s+end\s+of\s+(?:this\s+)?(?:unit|chapter|lesson)[\s,]+you\s+will\s+be\s+able\s+to:?\s*)(.+?)(?=\n\n[A-Z]|\n(?:UNIT|CHAPTER|LESSON)\s+\d+|$)'
        match = re.search(objectives_section_pattern, content, re.IGNORECASE | re.DOTALL)
        
        if match:
            objectives_text = match.group(1).strip()
            # Extract bullet points from objectives section
            bullet_pattern = r'[•\-\*➢]\s*(.+?)(?=\n[•\-\*➢]|\n\n|$)'
            bullets = re.findall(bullet_pattern, objectives_text, re.MULTILINE)
            
            for bullet in bullets:
                bullet = bullet.strip()
                # Clean up the objective
                bullet = re.sub(r'^\d+[\.\)]\s*', '', bullet)  # Remove numbering
                bullet = re.sub(r'\s+', ' ', bullet)  # Normalize whitespace
                
                # Filter out invalid objectives
                if (len(bullet) > 15 and len(bullet) < 200 and
                    not any(re.match(pattern, bullet.lower()) for pattern in cls.EXCLUDE_PATTERNS) and
                    bullet.lower() not in ['to', 'you will', 'students will']):
                    # Capitalize first letter
                    if bullet and bullet[0].islower():
                        bullet = bullet[0].upper() + bullet[1:]
                    if bullet not in objectives:
                        objectives.append(bullet)
        
        # If no objectives found in structured section, try alternative patterns
        if not objectives:
            for pattern in cls.OBJECTIVE_PATTERNS:
                matches = re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE | re.DOTALL)
                for match in matches:
                    objective_text = match.group(1).strip()
                    if objective_text:
                        objective_text = re.sub(r'\s+', ' ', objective_text)
                        parts = re.split(r'[•\-\n]', objective_text)
                        for part in parts:
                            part = part.strip()
                            if (len(part) > 15 and len(part) < 200 and
                                not any(re.match(p, part.lower()) for p in cls.EXCLUDE_PATTERNS)):
                                part = re.sub(r'^(?:to|you|students?|learners?)\s+', '', part, flags=re.IGNORECASE)
                                if part and part not in objectives:
                                    objectives.append(part)
        
        # Fallback: extract from any bulleted lists in first 3000 chars
        if len(objectives) < 3:
            bullet_pattern = r'[•\-\*➢]\s*(.+?)(?=\n[•\-\*➢]|\n\n|$)'
            bullets = re.findall(bullet_pattern, content[:3000], re.MULTILINE)
            for bullet in bullets:
                bullet = bullet.strip()
                if (len(bullet) > 20 and len(bullet) < 150 and
                    not any(re.match(p, bullet.lower()) for p in cls.EXCLUDE_PATTERNS) and
                    bullet.lower() not in ['to', 'you will', 'students will', 'learners will']):
                    if bullet not in objectives:
                        objectives.append(bullet)
        
        return objectives[:10]  # Return top 10 objectives
    
    @classmethod
    def extract_topics(cls, content: str) -> List[str]:
        """
        Extract main topics/themes from chapter content.
        
        Args:
            content: Chapter content text
            
        Returns:
            List of topics
        """
        topics = []
        
        # Look for unit/chapter title (support any number, not just 3)
        title_match = re.search(r'(?:unit|chapter|lesson)\s+(\d+|[ivxlcdm]+|[a-z]+)[\s:]+(.+?)(?:\n|$)', content[:1000], re.IGNORECASE)
        if title_match:
            title = title_match.group(2).strip()
            if title and len(title) > 3 and len(title) < 100:
                # Filter out metadata
                if not any(re.match(p, title.lower()) for p in cls.EXCLUDE_PATTERNS):
                    topics.append(title)
        
        # Extract from section headings (numbered sections like "6.1 Introduction")
        section_pattern = r'^\d+\.\d+\s+(.+?)(?:\n|$)'
        sections = re.findall(section_pattern, content[:5000], re.MULTILINE)
        for section in sections[:8]:
            section = section.strip()
            if (len(section) > 5 and len(section) < 80 and
                not any(re.match(p, section.lower()) for p in cls.EXCLUDE_PATTERNS)):
                if section not in topics:
                    topics.append(section)
        
        # Extract from bold/emphasized text (often key terms)
        bold_pattern = r'\*\*(.+?)\*\*|__(.+?)__'
        bold_matches = re.findall(bold_pattern, content[:3000])
        for match in bold_matches:
            term = (match[0] or match[1]).strip()
            if (len(term) > 3 and len(term) < 60 and
                not any(re.match(p, term.lower()) for p in cls.EXCLUDE_PATTERNS) and
                term.lower() not in cls.STOP_WORDS):
                if term not in topics:
                    topics.append(term)
        
        # Extract capitalized phrases that look like key terms (but filter carefully)
        key_phrases = cls._extract_key_phrases(content[:4000])
        topics.extend(key_phrases)
        
        # Filter and clean topics
        filtered_topics = []
        seen = set()
        for topic in topics:
            topic_clean = topic.strip()
            topic_lower = topic_clean.lower()
            
            # Skip if matches exclude patterns
            if any(re.match(p, topic_lower) for p in cls.EXCLUDE_PATTERNS):
                continue
            
            # Skip if too short or too long
            if len(topic_clean) < 4 or len(topic_clean) > 80:
                continue
            
            # Skip if it's just a stop word
            if topic_lower in cls.STOP_WORDS:
                continue
            
            # Skip if it's metadata (book titles, etc.)
            if any(meta in topic_lower for meta in ['student book', 'grade', 'page', 'table', 'figure']):
                continue
            
            # Skip incomplete phrases
            if topic_clean.lower().startswith(('of ', 'at ', 'to ', 'in ', 'on ', 'for ')) and len(topic_clean.split()) < 3:
                continue
            
            if topic_lower not in seen:
                seen.add(topic_lower)
                filtered_topics.append(topic_clean)
        
        return filtered_topics[:10]  # Return top 10 topics
    
    @classmethod
    def _extract_key_phrases(cls, text: str) -> List[str]:
        """Extract key phrases from text."""
        phrases = []
        
        # Look for capitalized phrases (potential key terms) - but be more selective
        capitalized_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b'
        matches = re.findall(capitalized_pattern, text)
        
        for match in matches:
            match_lower = match.lower()
            # Skip if matches exclude patterns
            if any(re.match(p, match_lower) for p in cls.EXCLUDE_PATTERNS):
                continue
            
            # Skip if contains metadata words
            if any(meta in match_lower for meta in ['student book', 'grade', 'page', 'lesson', 'unit', 'chapter']):
                continue
            
            if len(match) > 5 and len(match) < 50:
                words = match.split()
                # Prefer multi-word phrases (more likely to be key terms)
                if len(words) >= 2:
                    if match not in phrases:
                        phrases.append(match)
        
        return phrases[:5]
    
    @classmethod
    def extract_chapter_metadata(cls, content: str, chapter_number: Optional[int] = None) -> Dict[str, any]:
        """
        Extract comprehensive chapter metadata.
        
        Args:
            content: Full chapter content
            chapter_number: Chapter number if known
            
        Returns:
            Dict with topics, objectives, summary, and title
        """
        # Extract title
        title = None
        if chapter_number:
            title_match = re.search(
                rf'(?:unit|chapter|lesson)\s+(?:three|3|iii|{chapter_number})[\s:]+(.+?)(?:\n|$)',
                content[:500],
                re.IGNORECASE
            )
            if title_match:
                title = title_match.group(1).strip()
        
        # Extract objectives
        objectives = cls.extract_objectives(content)
        
        # Extract topics
        topics = cls.extract_topics(content)
        
        # Generate summary (first 300 chars of meaningful content)
        summary = cls._generate_summary(content)
        
        return {
            'title': title or f'Chapter {chapter_number}' if chapter_number else 'Chapter',
            'objectives': objectives,
            'topics': topics,
            'summary': summary
        }
    
    @classmethod
    def _generate_summary(cls, content: str, max_length: int = 300) -> str:
        """Generate a brief summary from content."""
        # Remove extra whitespace
        content = re.sub(r'\s+', ' ', content)
        
        # Try to find the first meaningful paragraph
        paragraphs = content.split('\n\n')
        for para in paragraphs[:5]:
            para = para.strip()
            if len(para) > 50 and len(para) < 500:
                # Check if it's not just a heading
                if not para.isupper() and para.count(' ') > 5:
                    if len(para) <= max_length:
                        return para
                    else:
                        # Truncate at sentence boundary
                        truncated = para[:max_length]
                        last_period = truncated.rfind('.')
                        if last_period > max_length * 0.7:
                            return truncated[:last_period + 1]
                        return truncated + "..."
        
        # Fallback: first max_length characters
        summary = content[:max_length].strip()
        if len(content) > max_length:
            summary = summary.rsplit('.', 1)[0] + '.' if '.' in summary else summary + "..."
        
        return summary

