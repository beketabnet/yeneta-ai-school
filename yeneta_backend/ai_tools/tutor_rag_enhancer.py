"""
Enhanced RAG query builder for AI Tutor.
Improves content retrieval accuracy for curriculum-based questions.
"""
import re
import logging
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class TutorRAGEnhancer:
    """Enhances RAG queries for better curriculum content retrieval."""
    
    # Chapter/Unit patterns
    CHAPTER_PATTERNS = [
        r'unit\s+([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|[ivxlcdm]+)',
        r'chapter\s+([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|[ivxlcdm]+)',
        r'lesson\s+([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|[ivxlcdm]+)',
        r'module\s+([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|[ivxlcdm]+)',
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
    
    # Subject keyword mapping
    SUBJECT_KEYWORDS = {
        'mathematics': ['math', 'algebra', 'geometry', 'calculus', 'arithmetic', 'trigonometry', 'statistics'],
        'physics': ['physics', 'mechanics', 'thermodynamics', 'electricity', 'magnetism', 'optics'],
        'chemistry': ['chemistry', 'chemical', 'reaction', 'compound', 'element', 'molecule', 'atom'],
        'biology': ['biology', 'cell', 'organism', 'ecosystem', 'genetics', 'evolution', 'anatomy'],
        'english': ['english', 'grammar', 'reading', 'writing', 'literature', 'comprehension', 'vocabulary'],
        'amharic': ['amharic', 'አማርኛ'],
        'history': ['history', 'historical', 'ancient', 'medieval', 'modern'],
        'geography': ['geography', 'geographical', 'map', 'climate', 'continent', 'country'],
        'economics': ['economics', 'economic', 'market', 'trade', 'supply', 'demand'],
        'citizenship': ['citizenship', 'civics', 'government', 'democracy', 'rights'],
    }
    
    @classmethod
    def extract_chapter_info(cls, query: str) -> Optional[Dict[str, any]]:
        """
        Extract chapter/unit information from query.
        
        Returns:
            Dict with 'number' (int) and 'variants' (list of strings)
        """
        query_lower = query.lower()
        
        for pattern in cls.CHAPTER_PATTERNS:
            match = re.search(pattern, query_lower, re.IGNORECASE)
            if match:
                chapter_raw = match.group(1).lower()
                chapter_num = cls._normalize_chapter_number(chapter_raw)
                
                if chapter_num:
                    # Generate variants for better matching
                    variants = cls._generate_chapter_variants(chapter_num)
                    logger.info(f"📖 Detected chapter: {chapter_num} (variants: {variants})")
                    return {
                        'number': chapter_num,
                        'variants': variants,
                        'original': match.group(0)
                    }
        
        return None
    
    @classmethod
    def _normalize_chapter_number(cls, chapter_raw: str) -> Optional[int]:
        """Convert chapter identifier to number."""
        # Direct number
        if chapter_raw.isdigit():
            return int(chapter_raw)
        
        # Word form
        if chapter_raw in cls.WORD_TO_NUM:
            return cls.WORD_TO_NUM[chapter_raw]
        
        # Roman numeral
        if chapter_raw in cls.ROMAN_TO_NUM:
            return cls.ROMAN_TO_NUM[chapter_raw]
        
        return None
    
    @classmethod
    def _generate_chapter_variants(cls, chapter_num: int) -> List[str]:
        """Generate different representations of chapter number."""
        variants = [
            f"Unit {chapter_num}",
            f"Chapter {chapter_num}",
            f"Lesson {chapter_num}",
            f"Module {chapter_num}",
        ]
        
        # Add word form if available
        num_to_word = {v: k for k, v in cls.WORD_TO_NUM.items()}
        if chapter_num in num_to_word:
            word = num_to_word[chapter_num].capitalize()
            variants.extend([
                f"Unit {word}",
                f"Chapter {word}",
                f"Lesson {word}",
                f"Module {word}",
            ])
        
        # Add roman numeral if available
        num_to_roman = {v: k for k, v in cls.ROMAN_TO_NUM.items()}
        if chapter_num in num_to_roman:
            roman = num_to_roman[chapter_num].upper()
            variants.extend([
                f"Unit {roman}",
                f"Chapter {roman}",
                f"Lesson {roman}",
                f"Module {roman}",
            ])
        
        return variants
    
    @classmethod
    def infer_subject(cls, query: str, explicit_subject: Optional[str] = None) -> Optional[str]:
        """
        Infer subject from query text.
        
        Args:
            query: User's question
            explicit_subject: Subject already selected by user
            
        Returns:
            Subject name or None
        """
        if explicit_subject:
            return explicit_subject
        
        query_lower = query.lower()
        
        # Check each subject's keywords
        for subject, keywords in cls.SUBJECT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in query_lower:
                    logger.info(f"🎯 Subject inferred: {subject.capitalize()} (keyword: {keyword})")
                    return subject.capitalize()
        
        return None
    
    @classmethod
    def build_enhanced_query(cls, original_query: str, chapter_info: Optional[Dict] = None) -> str:
        """
        Build enhanced query with chapter variants for better semantic matching.
        
        Args:
            original_query: User's original question
            chapter_info: Chapter information from extract_chapter_info()
            
        Returns:
            Enhanced query string
        """
        # Start with original query
        enhanced_parts = [original_query]
        
        # Add chapter variants if available
        if chapter_info and chapter_info.get('variants'):
            # Add a few key variants to help semantic search
            key_variants = chapter_info['variants'][:4]  # Limit to avoid query bloat
            enhanced_parts.extend(key_variants)
        
        # Join with spaces for semantic search
        enhanced_query = " ".join(enhanced_parts)
        
        logger.info(f"🔍 Enhanced query: {enhanced_query[:200]}...")
        return enhanced_query
    
    @classmethod
    def extract_topic_keywords(cls, query: str) -> List[str]:
        """
        Extract key topic words from query for better matching.
        
        Returns:
            List of important keywords
        """
        # Remove common question words
        stop_words = {
            'what', 'is', 'the', 'are', 'of', 'in', 'on', 'at', 'to', 'for',
            'a', 'an', 'and', 'or', 'but', 'main', 'topic', 'about', 'explain',
            'tell', 'me', 'can', 'you', 'please', 'how', 'why', 'when', 'where'
        }
        
        # Tokenize and filter
        words = re.findall(r'\b\w+\b', query.lower())
        keywords = [w for w in words if w not in stop_words and len(w) > 3]
        
        return keywords[:10]  # Limit to top 10
    
    @classmethod
    def analyze_query_intent(cls, query: str) -> Dict[str, any]:
        """
        Comprehensive query analysis for optimal RAG retrieval.
        
        Returns:
            Dict with:
                - chapter_info: Chapter/unit details
                - subject: Inferred subject
                - keywords: Important topic keywords
                - enhanced_query: Optimized query for semantic search
                - query_type: Type of question (definition, explanation, example, etc.)
        """
        # Extract chapter information
        chapter_info = cls.extract_chapter_info(query)
        
        # Extract keywords
        keywords = cls.extract_topic_keywords(query)
        
        # Determine query type
        query_lower = query.lower()
        query_type = 'general'
        if any(word in query_lower for word in ['what is', 'define', 'definition']):
            query_type = 'definition'
        elif any(word in query_lower for word in ['explain', 'how', 'why']):
            query_type = 'explanation'
        elif any(word in query_lower for word in ['example', 'give me', 'show']):
            query_type = 'example'
        elif any(word in query_lower for word in ['main topic', 'about', 'summary']):
            query_type = 'summary'
        
        # Build enhanced query
        enhanced_query = cls.build_enhanced_query(query, chapter_info)
        
        analysis = {
            'chapter_info': chapter_info,
            'keywords': keywords,
            'enhanced_query': enhanced_query,
            'query_type': query_type,
            'original_query': query
        }
        
        logger.info(f"📊 Query analysis: type={query_type}, keywords={keywords[:3]}, chapter={chapter_info['number'] if chapter_info else None}")
        
        return analysis
    
    @classmethod
    def format_rag_context(cls, documents: List[Dict], query_analysis: Dict, max_chars: int = 3000) -> Tuple[str, List[str]]:
        """
        Format retrieved documents into optimized context for LLM.
        
        Args:
            documents: Retrieved documents from vector store
            query_analysis: Analysis from analyze_query_intent()
            max_chars: Maximum characters for context
            
        Returns:
            Tuple of (formatted_context, source_list)
        """
        if not documents:
            return "", []
        
        # Check if we have full chapter content
        has_full_chapter = any(doc.get('full_chapter', False) for doc in documents)
        
        context_parts = []
        sources = []
        total_chars = 0
        
        # Header
        context_parts.append("=== ETHIOPIAN CURRICULUM REFERENCE ===")
        
        if has_full_chapter:
            context_parts.append("The following is the COMPLETE CHAPTER content from the official Ethiopian curriculum textbook:\n")
        else:
            context_parts.append("The following content is from official Ethiopian curriculum textbooks:\n")
        
        # Add documents
        for i, doc in enumerate(documents[:5], 1):
            source = doc.get('source', 'Unknown')
            content = doc.get('content', '')
            metadata = doc.get('metadata', {})
            is_full_chapter = doc.get('full_chapter', False)
            
            if not content:
                continue
            
            # Build reference header
            if is_full_chapter:
                chapter_num = doc.get('chapter_number', metadata.get('chapter', ''))
                chapter_title = doc.get('title', f'Chapter {chapter_num}')
                ref_header = f"[COMPLETE CHAPTER {chapter_num}: {chapter_title}]"
                ref_header += f"\n[Source: {source}]"
                ref_header += f"\n[Total chunks assembled: {doc.get('chunk_count', 0)}]"
            else:
                ref_header = f"[Reference {i} from {source}"
                if metadata.get('chapter'):
                    ref_header += f", Chapter {metadata['chapter']}"
                ref_header += "]"
            
            # Calculate available space
            remaining_chars = max_chars - total_chars - len(ref_header) - 100
            
            if remaining_chars < 200 and not is_full_chapter:
                break
            
            # For full chapter, use more space
            if is_full_chapter:
                # Full chapters get priority and more space
                if len(content) > max_chars * 0.9:  # Use up to 90% of total space
                    content = content[:int(max_chars * 0.9)] + "\n\n[Chapter content continues...]"
            else:
                # Smart truncation for chunks
                if len(content) > remaining_chars:
                    keywords = query_analysis.get('keywords', [])
                    best_section = cls._find_best_section(content, keywords, remaining_chars)
                    content = best_section + "..."
            
            # Add to context
            context_parts.append(f"\n{ref_header}")
            context_parts.append(content)
            context_parts.append("")
            
            sources.append(source)
            total_chars += len(ref_header) + len(content)
            
            # If we have full chapter, that's usually enough
            if is_full_chapter:
                break
        
        # Footer with instructions
        context_parts.append("\n=== END CURRICULUM REFERENCE ===\n")
        
        # Query-type specific instructions
        query_type = query_analysis.get('query_type', 'general')
        chapter_info = query_analysis.get('chapter_info')
        
        if has_full_chapter and chapter_info:
            context_parts.append(f"📚 You have been provided with the COMPLETE content of Chapter {chapter_info['number']}.")
            context_parts.append("Use this comprehensive chapter content to provide a detailed and accurate answer.")
        
        formatted_context = "\n".join(context_parts)
        
        logger.info(f"✅ Formatted RAG context: {len(formatted_context)} chars, {len(sources)} sources, full_chapter={has_full_chapter}")
        
        return formatted_context, list(set(sources))
    
    @classmethod
    def _find_best_section(cls, content: str, keywords: List[str], max_length: int) -> str:
        """
        Find the most relevant section of content based on keywords.
        
        Args:
            content: Full content text
            keywords: Important keywords from query
            max_length: Maximum length of section
            
        Returns:
            Best matching section
        """
        if not keywords or len(content) <= max_length:
            return content[:max_length]
        
        # Split into sentences
        sentences = re.split(r'[.!?]+', content)
        
        # Score each sentence by keyword matches
        scored_sentences = []
        for sentence in sentences:
            if not sentence.strip():
                continue
            score = sum(1 for kw in keywords if kw.lower() in sentence.lower())
            scored_sentences.append((score, sentence))
        
        # Sort by score
        scored_sentences.sort(reverse=True, key=lambda x: x[0])
        
        # Build section from top sentences
        section_parts = []
        current_length = 0
        
        for score, sentence in scored_sentences:
            sentence = sentence.strip()
            if current_length + len(sentence) + 2 <= max_length:
                section_parts.append(sentence)
                current_length += len(sentence) + 2
            else:
                break
        
        # Join and return
        if section_parts:
            return ". ".join(section_parts) + "."
        else:
            return content[:max_length]

    @classmethod
    def build_tutor_prompt(
        cls,
        rag_context: str,
        use_rag: bool,
        saved_config: Optional[any] = None,
        grade_level: Optional[str] = None
    ) -> str:
        """
        Build the system prompt for the AI Tutor.
        
        Args:
            rag_context: Formatted RAG context string
            use_rag: Whether RAG is enabled (Curriculum Mode)
            saved_config: Saved tutor configuration object
            grade_level: Student's grade level
            
        Returns:
            Complete system prompt string
        """
        prompt_parts = []
        
        # 1. Identity and Core Mission
        prompt_parts.append("You are YENETA, an expert AI tutor for Ethiopian students.")
        prompt_parts.append("Your mission is to make learning engaging, accessible, and effective.")
        prompt_parts.append("")
        
        # 2. Context Integration (Curriculum Mode vs General Mode)
        if use_rag and rag_context:
            prompt_parts.append("=== 📚 CURRICULUM MODE: ON ===")
            prompt_parts.append("You have access to OFFICIAL ETHIOPIAN CURRICULUM content above.")
            prompt_parts.append("🚨 STRICT INSTRUCTIONS FOR CURRICULUM MODE:")
            prompt_parts.append("1. **Base Answers on Text**: Your explanations must be grounded in the provided curriculum content.")
            prompt_parts.append("2. **Cite Sources**: When explaining a concept, mention 'According to the textbook...' or 'As described in Chapter X...'.")
            prompt_parts.append("3. **Use Exact Terminology**: Use the specific definitions and vocabulary found in the text.")
            prompt_parts.append("4. **Stay in Scope**: Do not introduce advanced concepts not covered in the grade level provided.")
            prompt_parts.append("5. **Prioritize Local Context**: Use the examples provided in the textbook (often Ethiopian context).")
            prompt_parts.append("")
            
            # Add saved chapter context if available
            if saved_config:
                if saved_config.chapter_title:
                    prompt_parts.append(f"**Current Chapter Focus**: {saved_config.chapter_title}")
                if saved_config.chapter_topics:
                    topics_list = ", ".join(saved_config.chapter_topics[:8])
                    prompt_parts.append(f"**Chapter Topics**: {topics_list}")
                if saved_config.chapter_summary:
                    prompt_parts.append(f"**Chapter Overview**: {saved_config.chapter_summary[:300]}...")
            prompt_parts.append("")
            prompt_parts.append(rag_context)
            
        else:
            prompt_parts.append("=== 🌍 GENERAL TUTORING MODE ===")
            prompt_parts.append("You are providing general tutoring support.")
            prompt_parts.append("1. **Pedagogical Approach**: Use the 5E Instructional Model (Engage, Explore, Explain, Elaborate, Evaluate).")
            prompt_parts.append("2. **Adaptability**: Adjust your language to be appropriate for an Ethiopian student.")
            prompt_parts.append("3. **Cultural Relevance**: Use Ethiopian examples (geography, history, culture) to explain concepts where appropriate.")
            prompt_parts.append("4. **Clarify Scope**: If you are unsure about specific curriculum details, admit it and provide a general, accurate explanation.")
            
        prompt_parts.append("")
        
        # 3. Teaching Philosophy (UbD & 5E) - Shared across modes
        prompt_parts.append("=== TEACHING PHILOSOPHY ===")
        prompt_parts.append("**Understanding by Design (UbD)**: Focus on deep understanding, not just facts.")
        prompt_parts.append("**5E Instructional Model**:")
        prompt_parts.append("- **Engage**: Hook interest.")
        prompt_parts.append("- **Explore**: Guide discovery.")
        prompt_parts.append("- **Explain**: Clear concepts.")
        prompt_parts.append("- **Elaborate**: Apply to new contexts.")
        prompt_parts.append("- **Evaluate**: Check understanding.")
        prompt_parts.append("")
        prompt_parts.append("**Cognitive Load**: Break complex topics into chunks.")
        prompt_parts.append("**Scaffolding**: Provide support that gradually decreases.")
        prompt_parts.append("**Growth Mindset**: Encourage effort and learning from mistakes.")
        prompt_parts.append("")
        
        # 4. Response Format
        prompt_parts.append("=== RESPONSE FORMAT ===")
        prompt_parts.append("- Use **Markdown** for structure (headings, bold text, lists).")
        prompt_parts.append("- Be **warm, encouraging, and patient**.")
        prompt_parts.append("- **End with a question** to check understanding or encourage further thought.")
        prompt_parts.append("- If the student asks for a quiz/practice, provide 1-2 quick questions.")
        
        return "\n".join(prompt_parts)
