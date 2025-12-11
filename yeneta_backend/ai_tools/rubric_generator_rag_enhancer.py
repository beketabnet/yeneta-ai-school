"""
Rubric Generator RAG Enhancer for chapter-aware content extraction.
Optimizes curriculum content retrieval for rubric generation with full chapter support.
"""
import logging
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class RubricGeneratorRAGEnhancer:
    """Enhances RAG queries for rubric generation with chapter awareness."""
    
    @classmethod
    def analyze_topic_for_chapter(cls, topic: str, subject: str = "", grade_level: str = "") -> Optional[Dict]:
        """
        Analyze topic to detect chapter/unit references.
        
        Args:
            topic: Rubric topic
            subject: Subject name
            grade_level: Grade level
            
        Returns:
            Dict with chapter info or None
        """
        from ai_tools.tutor_rag_enhancer import TutorRAGEnhancer
        
        # Combine topic with subject and grade for better detection
        combined_text = f"{topic} {subject} {grade_level}"
        
        # Use existing chapter detection
        chapter_info = TutorRAGEnhancer.extract_chapter_info(combined_text)
        
        if chapter_info:
            logger.info(f"📖 Detected chapter in rubric topic: {chapter_info['number']}")
        
        return chapter_info
    
    @classmethod
    def build_rubric_query(
        cls,
        topic: str,
        subject: str,
        grade_level: str,
        learning_objectives: List[str] = None,
        chapter_info: Optional[Dict] = None
    ) -> str:
        """
        Build optimized query for rubric generation.
        
        Args:
            topic: Rubric topic
            subject: Subject
            grade_level: Grade level
            learning_objectives: Learning objectives
            chapter_info: Chapter information if detected
            
        Returns:
            Enhanced query string
        """
        query_parts = [topic]
        
        # Add learning objectives
        if learning_objectives:
            query_parts.extend(learning_objectives[:3])
        
        # Add chapter variants if available
        if chapter_info and chapter_info.get('variants'):
            # Add key variants
            query_parts.extend(chapter_info['variants'][:3])
        
        # Add context
        query_parts.append(f"{subject} Grade {grade_level}")
        query_parts.append("learning objectives assessment criteria rubric")
        
        # Add specific terms to find curriculum content
        query_parts.append("syllabus curriculum standards competencies")
        
        enhanced_query = " ".join(query_parts)
        
        logger.info(f"🔍 Rubric generation query: {enhanced_query[:150]}...")
        
        return enhanced_query
    
    @classmethod
    def format_rubric_context(
        cls,
        documents: List[Dict],
        topic: str,
        chapter_info: Optional[Dict] = None,
        max_chars: int = 8000
    ) -> Tuple[str, List[str]]:
        """
        Format curriculum content for rubric generation.
        
        Args:
            documents: Retrieved documents
            topic: Rubric topic
            chapter_info: Chapter information
            max_chars: Maximum characters
            
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
        context_parts.append("=== ETHIOPIAN CURRICULUM CONTENT FOR RUBRIC GENERATION ===")
        
        if has_full_chapter:
            context_parts.append("The following is COMPLETE CHAPTER content from official Ethiopian curriculum textbooks:")
        else:
            context_parts.append("The following content is from official Ethiopian curriculum textbooks:")
        
        context_parts.append("")
        
        # Add documents
        for i, doc in enumerate(documents[:5], 1):
            source = doc.get('source', 'Unknown')
            content = doc.get('content', '')
            is_full_chapter = doc.get('full_chapter', False)
            
            if not content:
                continue
            
            # Build source header
            if is_full_chapter:
                chapter_num = doc.get('chapter_number', '')
                chapter_title = doc.get('title', f'Chapter {chapter_num}')
                chunk_count = doc.get('chunk_count', 0)
                
                source_header = f"[COMPLETE CHAPTER {chapter_num}: {chapter_title}]"
                source_header += f"\n[Source: {source}]"
                source_header += f"\n[Assembled from {chunk_count} chunks for comprehensive rubric generation]"
            else:
                source_header = f"[Source {i}: {source}]"
            
            # Calculate available space
            remaining_chars = max_chars - total_chars - len(source_header) - 100
            
            if remaining_chars < 500 and not is_full_chapter:
                break
            
            # Content handling
            if is_full_chapter:
                # Use up to 80% of total space for full chapter
                max_chapter_chars = int(max_chars * 0.80)
                if len(content) > max_chapter_chars:
                    content = content[:max_chapter_chars] + "\n\n[Chapter content continues - use this comprehensive content for detailed rubric criteria]"
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
        context_parts.append("=== END CURRICULUM CONTENT ===")
        context_parts.append("")
        
        if has_full_chapter and chapter_info:
            context_parts.append(f"📚 COMPLETE CHAPTER {chapter_info['number']} CONTENT PROVIDED")
            context_parts.append("Use this comprehensive chapter content to create curriculum-aligned rubric criteria.")
            context_parts.append("Extract learning objectives, key concepts, and assessment standards from the chapter.")
        else:
            context_parts.append("Use the above curriculum content to create rubric criteria that align with Ethiopian education standards.")
        
        context_parts.append("")
        
        formatted_context = "\n".join(context_parts)
        
        logger.info(f"✅ Formatted rubric context: {len(formatted_context)} chars, {len(sources)} sources, full_chapter={has_full_chapter}")
        
        return formatted_context, list(set(sources))
    
    @classmethod
    def extract_learning_objectives(cls, content: str, max_objectives: int = 8) -> List[str]:
        """
        Extract learning objectives from curriculum content.
        
        Args:
            content: Curriculum content
            max_objectives: Maximum objectives to extract
            
        Returns:
            List of learning objectives
        """
        import re
        
        objectives = []
        
        # Look for objective patterns
        objective_patterns = [
            r'(?:UNIT OBJECTIVES?|Learning Objectives?|At the end of this (?:unit|chapter|lesson), you will be able to)[:\s]+(.+?)(?=\n\n|\Z)',
            r'(?:Students will be able to|Students should be able to|By the end of this (?:unit|chapter), students will)[:\s]+(.+?)(?=\n\n|\Z)',
            r'(?:Objectives?|Goals?)[:\s]+(.+?)(?=\n\n|\Z)',
        ]
        
        for pattern in objective_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
            for match in matches:
                # Split by bullet points or numbers
                items = re.split(r'[\n•\-\d+\.]', match)
                for item in items:
                    item = item.strip()
                    if item and len(item) > 15 and len(item) < 250:
                        # Clean up
                        item = re.sub(r'^\s*[•\-\d+\.]+\s*', '', item)
                        if item and item not in objectives:
                            objectives.append(item)
        
        return objectives[:max_objectives]
    
    @classmethod
    def extract_key_concepts(cls, content: str, max_concepts: int = 10) -> List[str]:
        """
        Extract key concepts from curriculum content.
        
        Args:
            content: Curriculum content
            max_concepts: Maximum concepts to extract
            
        Returns:
            List of key concepts
        """
        import re
        
        concepts = []
        
        # Look for concept patterns
        concept_patterns = [
            r'(?:Key Concepts?|Main Ideas?|Important Terms?)[:\s]+(.+?)(?=\n\n|\Z)',
            r'(?:Definition|Define)[:\s]+(.+?)(?=\n\n|\Z)',
            r'(?:In this (?:chapter|unit|lesson), we will (?:learn|study|explore))[:\s]+(.+?)(?=\n\n|\Z)',
        ]
        
        for pattern in concept_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
            for match in matches:
                # Split by common delimiters
                items = re.split(r'[;\n•\-\d+\.]', match)
                for item in items:
                    item = item.strip()
                    if item and len(item) > 10 and len(item) < 150:
                        # Clean up
                        item = re.sub(r'^\s*[•\-\d+\.]+\s*', '', item)
                        if item and item not in concepts:
                            concepts.append(item)
        
        return concepts[:max_concepts]
    
    @classmethod
    def extract_standards(cls, content: str, subject: str, grade_level: str) -> List[str]:
        """
        Extract or generate curriculum standards.
        
        Args:
            content: Curriculum content
            subject: Subject name
            grade_level: Grade level
            
        Returns:
            List of standards
        """
        import re
        
        standards = []
        
        # Look for standard patterns
        standard_patterns = [
            r'(?:Standard|Curriculum Standard|MoE Standard)[:\s]+([A-Z0-9\.\-]+)',
            r'(?:Competency|Learning Competency)[:\s]+([A-Z0-9\.\-]+)',
        ]
        
        for pattern in standard_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                if match and match not in standards:
                    standards.append(match)
        
        # If no standards found, generate specific ones based on content
        if not standards:
            # Extract grade number
            grade_match = re.search(r'(\d+)', grade_level)
            grade_num = grade_match.group(1) if grade_match else "X"
            
            # Normalize subject
            subject_code = subject[:3].upper() if subject else "GEN"
            
            # Extract key competency areas from objectives
            objectives = cls.extract_learning_objectives(content, max_objectives=5)
            
            # Identify competency domains
            competency_domains = []
            if any(re.search(r'read|comprehension|text|passage', obj, re.IGNORECASE) for obj in objectives):
                competency_domains.append("Reading Comprehension")
            if any(re.search(r'write|writing|compose|essay', obj, re.IGNORECASE) for obj in objectives):
                competency_domains.append("Writing Skills")
            if any(re.search(r'speak|speaking|oral|pronunciation', obj, re.IGNORECASE) for obj in objectives):
                competency_domains.append("Oral Communication")
            if any(re.search(r'listen|listening|audio', obj, re.IGNORECASE) for obj in objectives):
                competency_domains.append("Listening Skills")
            if any(re.search(r'grammar|syntax|structure', obj, re.IGNORECASE) for obj in objectives):
                competency_domains.append("Language Structure")
            if any(re.search(r'vocabulary|words|terminology', obj, re.IGNORECASE) for obj in objectives):
                competency_domains.append("Vocabulary Development")
            if any(re.search(r'analyze|critical|evaluate', obj, re.IGNORECASE) for obj in objectives):
                competency_domains.append("Critical Thinking")
            if any(re.search(r'apply|use|practice', obj, re.IGNORECASE) for obj in objectives):
                competency_domains.append("Practical Application")
            
            # Generate standards based on competency domains
            for i, domain in enumerate(competency_domains[:3], 1):
                standards.append(f"{subject_code}.{grade_num}.{i}: {domain}")
            
            # If still no standards, add generic
            if not standards:
                standards.append(f"{subject_code}.{grade_num}.1: Core Competencies")
                standards.append(f"Ethiopian MoE {subject} Grade {grade_num} Curriculum Standards")
        
        return standards[:3]
    
    @classmethod
    def generate_topic_suggestions(
        cls,
        content: str,
        subject: str,
        grade_level: str,
        chapter_info: Optional[Dict] = None,
        num_suggestions: int = 5
    ) -> List[str]:
        """
        Generate assignment topic suggestions from curriculum content.
        
        Args:
            content: Curriculum content
            subject: Subject name
            grade_level: Grade level
            chapter_info: Chapter information
            num_suggestions: Number of suggestions
            
        Returns:
            List of topic suggestions
        """
        import re
        
        topics = []
        
        # Extract learning objectives to understand the content
        objectives = cls.extract_learning_objectives(content, max_objectives=10)
        key_concepts = cls.extract_key_concepts(content, max_concepts=10)
        
        # Look for section headers and key themes
        headers = re.findall(r'^#+\s+(.+)$', content, re.MULTILINE)
        headers = [h.strip() for h in headers if len(h) > 10 and len(h) < 100]
        
        # Extract key phrases from objectives (noun phrases)
        key_phrases = []
        for obj in objectives[:8]:
            # Extract phrases after common action verbs
            matches = re.findall(r'(?:find out|talk about|identify|pronounce|work out|use|discuss|explain|understand|explore|examine|investigate|study|compare|evaluate|describe|analyze)\s+(.+?)(?:\.|,|$|and)', obj, re.IGNORECASE)
            for match in matches:
                cleaned = match.strip()
                # Remove common filler words at the start
                cleaned = re.sub(r'^(the|a|an|their|your|specific|information about)\s+', '', cleaned, flags=re.IGNORECASE)
                if len(cleaned) > 10 and len(cleaned) < 80:
                    key_phrases.append(cleaned)
        
        # Extract main themes from content (look for unit titles, main topics)
        main_themes = []
        # Look for "UNIT X: TITLE" or "Chapter X: TITLE" patterns
        unit_matches = re.findall(r'(?:UNIT|Chapter|Unit)\s+(?:\w+|\d+)[:\s]+(.+?)(?:\n|$)', content, re.IGNORECASE)
        main_themes.extend([m.strip() for m in unit_matches if len(m.strip()) > 5 and len(m.strip()) < 50])
        
        # Look for bold or emphasized topics
        bold_matches = re.findall(r'\*\*(.+?)\*\*', content)
        main_themes.extend([m.strip() for m in bold_matches if len(m.strip()) > 10 and len(m.strip()) < 50])
        
        # Combine all potential topics with priority
        potential_topics = []
        potential_topics.extend(main_themes[:2])  # Prioritize main themes
        potential_topics.extend(headers[:2])
        potential_topics.extend(key_phrases[:4])
        potential_topics.extend(key_concepts[:2])
        
        # Log what we found for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"📋 Topic extraction: main_themes={main_themes[:3]}, headers={headers[:2]}, key_phrases={key_phrases[:3]}, concepts={key_concepts[:2]}")
        
        # Assignment type templates with variety (professional format)
        templates = [
            ("Essay", "Essay: Analyzing {} and Its Impact on Student Learning"),
            ("Research Paper", "Research Paper: Investigating {} in Real-World Contexts"),
            ("Project", "Project: Creating a {} Awareness Campaign for the Community"),
            ("Presentation", "Presentation: Exploring {} Through Multimedia Examples"),
            ("Case Study", "Case Study: Examining {} Applications in Daily Life"),
            ("Analysis", "Critical Analysis: Understanding {} and Its Implications"),
            ("Debate", "Debate: Discussing Different Perspectives on {}"),
            ("Portfolio", "Portfolio: Demonstrating Mastery of {} Concepts"),
        ]
        
        # Generate diverse topics
        for i in range(min(num_suggestions, len(potential_topics))):
            theme = potential_topics[i]
            template_type, template = templates[i % len(templates)]
            
            # Clean up the theme
            theme = theme.strip().strip('.,;:')
            
            # Format the topic
            if len(theme) > 60:
                theme = theme[:60] + "..."
            
            topic = template.format(theme)
            topics.append(topic)
            logger.info(f"💡 Generated topic {i+1}: {topic}")
        
        # If not enough topics, generate from subject and chapter
        while len(topics) < num_suggestions:
            idx = len(topics)
            template_type, template = templates[idx % len(templates)]
            
            # Try to use chapter title or infer from objectives
            if chapter_info and chapter_info.get('title'):
                theme = chapter_info['title']
            elif main_themes:
                theme = main_themes[0]  # Use first main theme if available
            elif key_phrases:
                theme = key_phrases[0]  # Use first key phrase
            elif chapter_info:
                theme = f"Chapter {chapter_info['number']} Concepts"
            else:
                theme = f"{subject} Fundamentals"
            
            topic = template.format(theme)
            topics.append(topic)
        
        return topics[:num_suggestions]

    @classmethod
    def build_rubric_prompt(
        cls,
        topic: str,
        subject: str,
        grade_level: str,
        rubric_type: str,
        num_criteria: int,
        performance_levels: List[str],
        tone_preference: str,
        weighting_enabled: bool,
        multimodal_assessment: bool,
        learning_objectives: List[str] = None,
        moe_standard_id: str = None,
        rag_context: str = None,
        curriculum_context: Dict = None
    ) -> str:
        """
        Build a strict, detailed prompt for rubric generation.
        """
        # Base prompt
        prompt = f"""You are an expert assessment designer for Ethiopian education. Create a high-quality {rubric_type} rubric.

ASSIGNMENT DETAILS:
- Topic: {topic}
- Grade Level: {grade_level}
- Subject: {subject if subject else 'General'}
- Number of Criteria: {num_criteria}
"""
        
        # Add Multilingual Handling Instructions
        prompt += """
MULTILINGUAL & LANGUAGE HANDLING (CRITICAL):
1.  **Language Detection**: strict logic to Identify the language of the `Topic` and `Subject`.
    -   If the input is in Amharic (e.g., "የአማርኛ ቋንቋ"), Afaan Oromo, Tigrinya, or Somali, YOU MUST GENERATE THE CONTENT IN THAT SAME LANGUAGE.
    -   If the input is English, generate in English.
2.  **Content Translation**: 
    -   The `title`, `criterion` names, `description` text, and `performanceLevels` descriptions MUST be in the Target Language (e.g., Amharic).
    -   Ensure pedagogical terms are appropriately translated or adapted (e.g., "Excellent" -> "በጣም ጥሩ").
3.  **JSON Structure**:
    -   The JSON KEYS (e.g., "title", "rubric_type", "criteria", "level") MUST remain in English.
    -   ONLY the VALUES should be in the Target Language.
    -   Example for Amharic:
        "criteria": [
            {
                "criterion": "የይዘት ትክክለኛነት" (Content Accuracy),
                "description": "ተማሪው ያቀረበው ይዘት..." (Description in Amharic),
                ...
            }
        ]
"""
        
        if moe_standard_id:
            prompt += f"- MoE Curriculum Standard: {moe_standard_id}\n"
        
        # Add curriculum context if available
        if curriculum_context and curriculum_context.get('success') and rag_context:
            prompt += f"\n{rag_context}\n\n"
            logger.info("📚 Using chapter-aware RAG-enhanced rubric generation prompt")
        
        if learning_objectives:
            prompt += f"\nLEARNING OBJECTIVES (ensure constructive alignment):\n"
            for i, obj in enumerate(learning_objectives, 1):
                prompt += f"{i}. {obj}\n"
    
        prompt += f"\nRUBRIC TYPE: {rubric_type.replace('_', ' ').title()}\n"
        prompt += f"PERFORMANCE LEVELS: {', '.join(performance_levels)}\n"
        prompt += f"TONE: {tone_preference}\n"
        
        if weighting_enabled:
            prompt += "\nWEIGHTING: Assign appropriate weights to each criterion (must sum to 100%).\n"
        
        if multimodal_assessment:
            prompt += "\nMULTIMODAL: Include criteria for visual, audio, and textual elements as appropriate.\n"
        
        # Add quality constraints from research
        prompt += """
QUALITY REQUIREMENTS (CRITICAL):
1. Use CONCRETE, OBSERVABLE, MEASURABLE verbs/outcomes appropriate for the grade level
2. AVOID vague terms like 'good', 'adequate', 'interesting', 'nice'
3. Use POSITIVE or NEUTRAL framing (focus on what students demonstrate, not deficits)
4. Ensure CONSTRUCTIVE ALIGNMENT with learning objectives
5. Make descriptions SPECIFIC and ACTIONABLE for feedback
6. For multimodal assignments, specify criteria for each modality
"""
        
        # Strict JSON Output Instructions
        prompt += """
IMPORTANT: You must return ONLY valid JSON. No conversational text.
Ensure the JSON structure matches exactly what is requested below.
"""

        # JSON structure based on rubric type
        if rubric_type == 'analytic':
            prompt += """
Provide a JSON response with this EXACT structure:
{
    "title": "Clear, descriptive rubric title",
    "rubric_type": "analytic",
    "criteria": [
        {
            "criterion": "Criterion name (e.g., 'Content Accuracy')",
            "description": "What this criterion assesses",
            "weight": 20,
            "performanceLevels": [
"""
            for level in performance_levels:
                prompt += f'                {{"level": "{level}", "points": 10, "description": "Observable, specific description"}},\n'
            prompt += """            ]
        }
    ],
    "total_points": 100
}
"""
        elif rubric_type == 'single_point':
            prompt += """
Provide a JSON response for a Single-Point Rubric (focuses on feedback):
{
    "title": "Clear, descriptive rubric title",
    "rubric_type": "single_point",
    "criteria": [
        {
            "criterion": "Criterion name",
            "description": "What this criterion assesses",
            "weight": 20,
            "performanceLevels": [
                {"level": "Concerns", "description": "Areas needing improvement"},
                {"level": "Criteria", "description": "Expected standard (the target)"},
                {"level": "Advanced", "description": "Evidence of exceeding expectations"}
            ]
        }
    ],
    "total_points": 100
}
"""
        elif rubric_type == 'holistic':
            prompt += """
Provide a JSON response for a Holistic Rubric (overall impression):
{
    "title": "Clear, descriptive rubric title",
    "rubric_type": "holistic",
    "criteria": [
        {
            "criterion": "Overall Quality",
            "description": "Holistic assessment of the entire work",
            "weight": 100,
            "performanceLevels": [
"""
            for level in performance_levels:
                prompt += f'                {{"level": "{level}", "points": 10, "description": "Comprehensive description of work at this level"}},\n'
            prompt += """            ]
        }
    ],
    "total_points": 100
}
"""
        else:  # checklist
            prompt += """
Provide a JSON response for a Checklist Rubric:
{
    "title": "Clear, descriptive rubric title",
    "rubric_type": "checklist",
    "criteria": [
        {
            "criterion": "Specific requirement or element",
            "description": "What to check for",
            "weight": 10,
            "performanceLevels": [
                {"level": "Yes", "points": 1, "description": "Requirement met"},
                {"level": "No", "points": 0, "description": "Requirement not met"}
            ]
        }
    ],
    "total_points": 100
}
"""
        
        prompt += f"\nCreate {num_criteria} relevant, well-defined criteria. Return ONLY valid JSON, no additional text."
        
        return prompt

    @classmethod
    def enhance_rubric_with_context(cls, rubric: Dict, curriculum_context: Dict) -> Dict:
        """
        Enhance generated rubric with curriculum context metadata.
        
        Args:
            rubric: Generated rubric dictionary
            curriculum_context: Curriculum context dictionary
            
        Returns:
            Enhanced rubric dictionary
        """
        if not curriculum_context:
            return rubric
            
        # Add curriculum metadata
        if 'learning_objectives' in curriculum_context:
            rubric['learning_objectives'] = curriculum_context['learning_objectives']
            
        if 'key_concepts' in curriculum_context:
            rubric['key_concepts'] = curriculum_context['key_concepts']
            
        if 'standards' in curriculum_context:
            rubric['standards'] = curriculum_context['standards']
            
        if 'chapter_context' in curriculum_context:
            rubric['chapter_context'] = curriculum_context['chapter_context']
            
        if 'sources' in curriculum_context:
            rubric['curriculum_sources'] = curriculum_context['sources']
            
        rubric['rag_enhanced'] = True
        
        return rubric
