"""
Chapter/Unit/Lesson Normalization Utilities
Shared utilities for handling various chapter naming conventions
"""

import re
import logging

logger = logging.getLogger(__name__)


def number_to_words_map():
    """Map numbers to their word equivalents (1-20 + common larger numbers)"""
    return {
        '1': ['One', 'First', 'I'],
        '2': ['Two', 'Second', 'II'],
        '3': ['Three', 'Third', 'III'],
        '4': ['Four', 'Fourth', 'IV'],
        '5': ['Five', 'Fifth', 'V'],
        '6': ['Six', 'Sixth', 'VI'],
        '7': ['Seven', 'Seventh', 'VII'],
        '8': ['Eight', 'Eighth', 'VIII'],
        '9': ['Nine', 'Ninth', 'IX'],
        '10': ['Ten', 'Tenth', 'X'],
        '11': ['Eleven', 'Eleventh', 'XI'],
        '12': ['Twelve', 'Twelfth', 'XII'],
        '13': ['Thirteen', 'Thirteenth', 'XIII'],
        '14': ['Fourteen', 'Fourteenth', 'XIV'],
        '15': ['Fifteen', 'Fifteenth', 'XV'],
        '16': ['Sixteen', 'Sixteenth', 'XVI'],
        '17': ['Seventeen', 'Seventeenth', 'XVII'],
        '18': ['Eighteen', 'Eighteenth', 'XVIII'],
        '19': ['Nineteen', 'Nineteenth', 'XIX'],
        '20': ['Twenty', 'Twentieth', 'XX'],
    }


def extract_chapter_number(chapter_input):
    """
    Extract and normalize chapter/unit number from various input formats.
    Returns dict with number and original input.
    
    Examples:
        "Chapter 3" -> {'number': '3', 'original': 'Chapter 3'}
        "Unit One" -> {'number': '1', 'original': 'Unit One'}
        "Lesson 5" -> {'number': '5', 'original': 'Lesson 5'}
        "3" -> {'number': '3', 'original': '3'}
    """
    chapter_input = chapter_input.strip()
    
    # Common patterns to extract numbers
    patterns = [
        r'(?:chapter|unit|module)\s*(\d+)',  # "Chapter 3", "Unit 5"
        r'(?:chapter|unit|module)\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)',  # "Chapter Three"
        r'^(\d+)$',  # Just "3"
        r'(?:ch|u|l|m)\.?\s*(\d+)',  # "Ch. 3", "U 5"
    ]
    
    # Word to number mapping
    word_to_num = {
        'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
        'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
        'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
        'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18',
        'nineteen': '19', 'twenty': '20',
        'first': '1', 'second': '2', 'third': '3', 'fourth': '4', 'fifth': '5',
        'sixth': '6', 'seventh': '7', 'eighth': '8', 'ninth': '9', 'tenth': '10',
    }
    
    chapter_number = None
    
    for pattern in patterns:
        match = re.search(pattern, chapter_input.lower())
        if match:
            extracted = match.group(1)
            # Convert word to number if needed
            chapter_number = word_to_num.get(extracted.lower(), extracted)
            break
    
    return {
        'number': chapter_number,
        'original': chapter_input
    }


def normalize_chapter_input(chapter_input: str, subject: str = None) -> str:
    """
    Normalize chapter input to match Ethiopian textbook format.
    
    Ethiopian textbooks use "UNIT X: TITLE" format, not "CHAPTER X" or "LESSON X".
    This function converts various inputs to the standard format.
    
    Examples:
        "Chapter 3" -> "UNIT 3"
        "Unit 3" -> "UNIT 3"
        "Lesson 3" -> "UNIT 3"
        "3" -> "UNIT 3"
        "Unit Three" -> "UNIT 3"
    
    Args:
        chapter_input: User's chapter input
        subject: Optional subject name for context
    
    Returns:
        Normalized chapter string in "UNIT X" format
    """
    chapter_input = chapter_input.strip()
    
    # Extract number using existing function
    chapter_info = extract_chapter_number(chapter_input)
    number = chapter_info.get('number')
    
    if not number:
        # If can't extract number, return as-is
        return chapter_input
    
    # Ethiopian textbooks use "UNIT" format
    # Return normalized format without colon (we'll add it in the query)
    return f"UNIT {number}"



def build_chapter_query_variants(chapter_info):
    """
    Build multiple query variants for flexible matching.
    Handles Chapter/Unit synonyms and numeric/word forms.
    
    Returns: String with all variants for RAG query
    """
    number = chapter_info['number']
    original = chapter_info['original']
    
    if not number:
        # If we couldn't extract a number, use original as-is
        return f"- {original}"
    
    # Section type synonyms
    section_types = ['Chapter', 'Unit', 'Module', 'Section']
    
    # Get word equivalents for the number
    num_map = number_to_words_map()
    word_forms = num_map.get(number, [])
    
    # Build all possible variants
    variants = []
    
    # Add numeric variants
    for section_type in section_types:
        variants.append(f"{section_type} {number}")
    
    # Add word variants
    for section_type in section_types:
        for word_form in word_forms:
            variants.append(f"{section_type} {word_form}")
    
    # Add original input
    if original not in variants:
        variants.insert(0, original)
    
    # Format as bullet list
    return '\n'.join([f"- {variant}" for variant in variants[:15]])  # Limit to top 15 variants


def build_chapter_rag_query(grade, subject, chapter_input, base_topic=""):
    """
    Build comprehensive RAG query for chapter-based question generation.
    
    Args:
        grade: Grade level
        subject: Subject name
        chapter_input: User's chapter input (e.g., "Chapter 3", "Unit One")
        base_topic: Optional additional topic context
    
    Returns:
        Formatted query string for RAG system
    """
    chapter_normalized = extract_chapter_number(chapter_input)
    query_variants = build_chapter_query_variants(chapter_normalized)
    chapter_num = chapter_normalized.get('number', 0)
    
    # Build list of other chapter numbers to exclude
    all_chapters = list(range(1, 21))  # Chapters 1-20
    other_chapters = [n for n in all_chapters if n != chapter_num]
    
    # Create exclusion terms for other chapters
    exclude_terms = []
    for n in other_chapters[:10]:  # Exclude first 10 other chapters to avoid query bloat
        # Add both word and number forms
        word_forms = {
            1: "ONE", 2: "TWO", 3: "THREE", 4: "FOUR", 5: "FIVE",
            6: "SIX", 7: "SEVEN", 8: "EIGHT", 9: "NINE", 10: "TEN"
        }
        if n in word_forms:
            exclude_terms.append(f"NOT UNIT {word_forms[n]}")
            exclude_terms.append(f"NOT CHAPTER {word_forms[n]}")
    
    query = f"""
    Find content SPECIFICALLY from {grade} {subject} curriculum.
    
    MUST MATCH one of these chapter/unit identifiers:
    {query_variants}
    
    EXCLUDE content from other units/chapters:
    {' '.join(exclude_terms[:6])}
    
    The curriculum may use different naming conventions:
    - "Chapter" or "Unit" or "Module"
    - Numbers as digits (1, 2, 3) or words (One, Two, Three)
    - Various formats: "Chapter 3", "Unit Three", "Module III"
    
    IMPORTANT: Return ONLY content that explicitly mentions the requested chapter/unit number.
    Do NOT return content from other chapters even if topics seem related.
    """
    
    if base_topic:
        query += f"\n\nAdditional context: {base_topic}"
    
    return query


def is_chapter_input(topic_input):
    """
    Detect if user input is a chapter/unit/lesson reference.
    
    Returns: Boolean
    """
    if not topic_input:
        return False
    
    topic_lower = topic_input.lower().strip()
    
    # Check for chapter/unit/lesson keywords
    chapter_keywords = ['chapter', 'unit', 'module', 'section']
    
    for keyword in chapter_keywords:
        if keyword in topic_lower:
            return True
    
    # Check if it's just a number (could be chapter number)
    if re.match(r'^\d+$', topic_lower):
        return True
    
    # Check for abbreviated forms
    if re.match(r'^(ch|u|l|m)\.?\s*\d+', topic_lower):
        return True
    
    return False
