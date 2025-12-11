"""
Rubric Generator RAG Enhancer.
Integrates vector store content extraction for enhanced rubric generation.
"""
import logging
from typing import Dict, List, Optional, Tuple
from rag.chapter_aware_rag import ChapterContentExtractor, EnhancedRAGQuery

logger = logging.getLogger(__name__)


class RubricRAGEnhancer:
    """Enhance rubric generation with RAG-based curriculum context."""
    
    def __init__(self, chroma_client=None, embedding_model=None):
        """
        Initialize rubric RAG enhancer.
        
        Args:
            chroma_client: ChromaDB client instance
            embedding_model: Embedding model for semantic search
        """
        self.chapter_extractor = ChapterContentExtractor(chroma_client)
        self.rag_query = EnhancedRAGQuery(chroma_client, embedding_model)
    
    def extract_curriculum_context(
        self,
        subject: str,
        grade: str,
        topic: str,
        chapter_number: Optional[int] = None,
        chapter_range: Optional[Tuple[int, int]] = None,
        use_vector_store: bool = True
    ) -> Dict:
        """
        Extract curriculum context for rubric generation.
        
        Args:
            subject: Subject name
            grade: Grade level
            topic: Assignment topic
            chapter_number: Specific chapter (optional)
            chapter_range: Range of chapters (optional)
            use_vector_store: Whether to use vector store
            
        Returns:
            Dictionary with curriculum context
        """
        if not use_vector_store:
            return {
                'success': False,
                'context_available': False,
                'learning_objectives': [],
                'key_concepts': [],
                'standards': []
            }
        
        try:
            # Build collection name
            collection_name = self._build_collection_name(subject, grade)
            
            # Check if collection exists
            if not self._collection_exists(collection_name):
                logger.warning(f"⚠️ Collection {collection_name} does not exist. Using fallback content generation.")
                return self._generate_fallback_content(subject, grade, topic, chapter_number, chapter_range)
            
            # Extract chapter content if specified
            chapter_context = None
            if chapter_number:
                try:
                    chapter_context = self.chapter_extractor.extract_chapter_content(
                        collection_name=collection_name,
                        chapter_number=chapter_number,
                        subject=subject,
                        grade=grade
                    )
                except Exception as e:
                    logger.warning(f"Chapter extraction failed: {e}")
                    chapter_context = None
            elif chapter_range:
                try:
                    chapter_context = self.chapter_extractor.extract_chapter_range(
                        collection_name=collection_name,
                        start_chapter=chapter_range[0],
                        end_chapter=chapter_range[1],
                        subject=subject,
                        grade=grade
                    )
                except Exception as e:
                    logger.warning(f"Chapter range extraction failed: {e}")
                    chapter_context = None
            
            # Query for topic-specific content
            query_results = None
            try:
                query_results = self.rag_query.query_with_chapter_context(
                    collection_name=collection_name,
                    query=topic,
                    chapter_number=chapter_number,
                    chapter_range=chapter_range,
                    subject=subject,
                    grade=grade,
                    n_results=5
                )
            except Exception as e:
                logger.warning(f"RAG query failed: {e}")
                query_results = {'success': False, 'results': []}
            
            # Extract learning objectives and key concepts
            learning_objectives = self._extract_learning_objectives(
                chapter_context, query_results
            )
            
            key_concepts = self._extract_key_concepts(
                chapter_context, query_results
            )
            
            standards = self._extract_standards(
                chapter_context, query_results
            )
            
            logger.info(f"✅ Extracted curriculum context: {len(learning_objectives)} objectives, {len(key_concepts)} concepts")
            
            return {
                'success': True,
                'context_available': True,
                'chapter_context': chapter_context,
                'query_results': query_results,
                'learning_objectives': learning_objectives,
                'key_concepts': key_concepts,
                'standards': standards,
                'subject': subject,
                'grade': grade
            }
        
        except Exception as e:
            logger.error(f"❌ Curriculum context extraction error: {e}", exc_info=True)
            return {
                'success': False,
                'context_available': False,
                'error': str(e),
                'learning_objectives': [],
                'key_concepts': [],
                'standards': []
            }
    
    def _build_collection_name(self, subject: str, grade: str) -> str:
        """Build ChromaDB collection name from subject and grade."""
        # Normalize subject
        subject_normalized = subject.lower().replace(' ', '_')
        
        # Normalize grade - extract number from "Grade X" format
        import re
        grade_match = re.search(r'(\d+)', grade)
        if grade_match:
            grade_num = grade_match.group(1)
            grade_normalized = f"grade_{grade_num}"
        else:
            # Handle KG or other formats
            grade_normalized = grade.lower().replace(' ', '_')
        
        collection_name = f"curriculum_{subject_normalized}_{grade_normalized}"
        logger.info(f"📦 Built collection name: {collection_name}")
        return collection_name
    
    def _extract_learning_objectives(
        self,
        chapter_context: Optional[Dict],
        query_results: Dict
    ) -> List[str]:
        """Extract learning objectives from curriculum content."""
        objectives = []
        
        # Extract from chapter context
        if chapter_context and chapter_context.get('success'):
            content = chapter_context.get('content', '')
            objectives.extend(self._parse_objectives_from_text(content))
        
        # Extract from query results
        if query_results and query_results.get('success'):
            for result in query_results.get('results', [])[:3]:
                content = result.get('content', '')
                objectives.extend(self._parse_objectives_from_text(content))
        
        # Remove duplicates and limit
        unique_objectives = list(dict.fromkeys(objectives))
        return unique_objectives[:5]
    
    def _parse_objectives_from_text(self, text: str) -> List[str]:
        """Parse learning objectives from text content."""
        import re
        
        objectives = []
        
        # Look for objective patterns
        patterns = [
            r'(?:Learning Objective|Objective|Goal|By the end of this (?:chapter|lesson|unit), students will)[:\s]+(.+?)(?:\n|$)',
            r'(?:Students will be able to|Students should be able to|Students can)[:\s]+(.+?)(?:\n|$)',
            r'(?:At the end of this (?:chapter|lesson|unit), students will)[:\s]+(.+?)(?:\n|$)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                objective = match.group(1).strip()
                if len(objective) > 20 and len(objective) < 200:
                    objectives.append(objective)
        
        return objectives[:3]
    
    def _extract_key_concepts(
        self,
        chapter_context: Optional[Dict],
        query_results: Dict
    ) -> List[str]:
        """Extract key concepts from curriculum content."""
        concepts = []
        
        # Extract from chapter context
        if chapter_context and chapter_context.get('success'):
            content = chapter_context.get('content', '')
            concepts.extend(self._parse_concepts_from_text(content))
        
        # Extract from query results
        if query_results and query_results.get('success'):
            for result in query_results.get('results', [])[:3]:
                content = result.get('content', '')
                concepts.extend(self._parse_concepts_from_text(content))
        
        # Remove duplicates and limit
        unique_concepts = list(dict.fromkeys(concepts))
        return unique_concepts[:10]
    
    def _parse_concepts_from_text(self, text: str) -> List[str]:
        """Parse key concepts from text content."""
        import re
        
        concepts = []
        
        # Look for concept patterns
        patterns = [
            r'(?:Key Concept|Important Concept|Main Idea|Key Term)[:\s]+(.+?)(?:\n|$)',
            r'(?:Definition|Define)[:\s]+(.+?)(?:\n|$)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                concept = match.group(1).strip()
                if len(concept) > 10 and len(concept) < 100:
                    concepts.append(concept)
        
        return concepts[:5]
    
    def _extract_standards(
        self,
        chapter_context: Optional[Dict],
        query_results: Dict
    ) -> List[str]:
        """Extract curriculum standards from content."""
        standards = []
        
        # Extract from chapter context metadata
        if chapter_context and chapter_context.get('success'):
            metadata = chapter_context.get('metadata', {})
            standard = metadata.get('standard_id') or metadata.get('moe_standard')
            if standard:
                standards.append(standard)
        
        # Extract from query results metadata
        if query_results and query_results.get('success'):
            for result in query_results.get('results', [])[:3]:
                metadata = result.get('metadata', {})
                standard = metadata.get('standard_id') or metadata.get('moe_standard')
                if standard and standard not in standards:
                    standards.append(standard)
        
        return standards[:3]
    
    def build_enhanced_rubric_prompt(
        self,
        topic: str,
        grade_level: str,
        subject: str,
        curriculum_context: Dict,
        rubric_type: str = 'analytic',
        num_criteria: int = 5
    ) -> str:
        """
        Build enhanced rubric generation prompt with curriculum context.
        
        Args:
            topic: Assignment topic
            grade_level: Grade level
            subject: Subject
            curriculum_context: Extracted curriculum context
            rubric_type: Type of rubric
            num_criteria: Number of criteria
            
        Returns:
            Enhanced prompt string
        """
        prompt_parts = []
        
        # Base prompt
        prompt_parts.append(f"Create a {rubric_type} rubric for the following assignment:")
        prompt_parts.append(f"Topic: {topic}")
        prompt_parts.append(f"Grade Level: {grade_level}")
        prompt_parts.append(f"Subject: {subject}")
        prompt_parts.append("")
        
        # Add curriculum context if available
        if curriculum_context.get('context_available'):
            prompt_parts.append("=== CURRICULUM CONTEXT ===")
            
            # Learning objectives
            objectives = curriculum_context.get('learning_objectives', [])
            if objectives:
                prompt_parts.append("\nLearning Objectives:")
                for i, obj in enumerate(objectives, 1):
                    prompt_parts.append(f"{i}. {obj}")
            
            # Key concepts
            concepts = curriculum_context.get('key_concepts', [])
            if concepts:
                prompt_parts.append("\nKey Concepts:")
                for concept in concepts:
                    prompt_parts.append(f"- {concept}")
            
            # Standards
            standards = curriculum_context.get('standards', [])
            if standards:
                prompt_parts.append("\nCurriculum Standards:")
                for standard in standards:
                    prompt_parts.append(f"- {standard}")
            
            # Chapter context summary
            chapter_context = curriculum_context.get('chapter_context')
            if chapter_context and chapter_context.get('success'):
                chapter_title = chapter_context.get('chapter_title', '')
                prompt_parts.append(f"\nChapter: {chapter_title}")
                
                # Add relevant excerpt (limited to avoid token overflow)
                content = chapter_context.get('content', '')
                if content:
                    excerpt = content[:1000]  # First 1000 chars
                    prompt_parts.append(f"\nRelevant Content Excerpt:\n{excerpt}...")
            
            prompt_parts.append("")
        
        prompt_parts.append("=== RUBRIC REQUIREMENTS ===")
        prompt_parts.append(f"- Create {num_criteria} clear, measurable criteria")
        prompt_parts.append("- Align criteria with learning objectives and curriculum standards")
        prompt_parts.append("- Use concrete, observable language")
        prompt_parts.append("- Provide specific performance level descriptions")
        prompt_parts.append("- Ensure constructive alignment with curriculum content")
        prompt_parts.append("")
        
        return "\n".join(prompt_parts)
    
    def _collection_exists(self, collection_name: str) -> bool:
        """Check if a ChromaDB collection exists."""
        try:
            if not self.chapter_extractor.chroma_client:
                return False
            
            # Try to get the collection
            self.chapter_extractor.chroma_client.get_collection(name=collection_name)
            return True
        except Exception as e:
            logger.debug(f"Collection {collection_name} check failed: {e}")
            return False
    
    def _generate_fallback_content(
        self,
        subject: str,
        grade: str,
        topic: str,
        chapter_number: Optional[int] = None,
        chapter_range: Optional[Tuple[int, int]] = None
    ) -> Dict:
        """
        Generate fallback content using LLM when vector store is not available.
        Uses Ollama as fallback if Gemini/OpenAI unavailable.
        """
        try:
            from ai_tools.llm.llm_router import llm_router
            
            # Build context prompt
            chapter_info = ""
            if chapter_number:
                chapter_info = f" for Chapter {chapter_number}"
            elif chapter_range:
                chapter_info = f" for Chapters {chapter_range[0]}-{chapter_range[1]}"
            
            prompt = f"""Generate curriculum-aligned content for {subject} at {grade} level{chapter_info}.

Topic: {topic}

Please provide:
1. 3-5 learning objectives (what students should be able to do)
2. 3-5 key concepts (main ideas students should understand)
3. 2-3 curriculum standards or competencies

Format your response as:

LEARNING OBJECTIVES:
- [Objective 1]
- [Objective 2]
- [Objective 3]

KEY CONCEPTS:
- [Concept 1]
- [Concept 2]
- [Concept 3]

STANDARDS:
- [Standard 1]
- [Standard 2]

Be specific and grade-appropriate."""

            # Try LLM with Ollama fallback
            response = llm_router.generate_text(
                prompt=prompt,
                max_tokens=800,
                temperature=0.7,
                tier_preference='tier2',  # Gemini first
                fallback_to_ollama=True   # Use Ollama if Gemini fails
            )
            
            if response and response.get('success'):
                content = response.get('response', '')
                
                # Parse the response
                objectives = self._parse_section(content, 'LEARNING OBJECTIVES')
                concepts = self._parse_section(content, 'KEY CONCEPTS')
                standards = self._parse_section(content, 'STANDARDS')
                
                logger.info(f"✅ Generated fallback content: {len(objectives)} objectives, {len(concepts)} concepts")
                
                return {
                    'success': True,
                    'context_available': True,
                    'source': 'llm_fallback',
                    'learning_objectives': objectives,
                    'key_concepts': concepts,
                    'standards': standards,
                    'subject': subject,
                    'grade': grade
                }
            else:
                # Ultimate fallback - basic generic content
                return self._generate_basic_fallback(subject, grade, topic)
                
        except Exception as e:
            logger.error(f"Fallback content generation failed: {e}")
            return self._generate_basic_fallback(subject, grade, topic)
    
    def _parse_section(self, text: str, section_name: str) -> List[str]:
        """Parse a section from LLM response."""
        import re
        
        items = []
        # Find section
        pattern = f"{section_name}:(.+?)(?=(?:LEARNING OBJECTIVES|KEY CONCEPTS|STANDARDS):|$)"
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        
        if match:
            section_text = match.group(1)
            # Extract bullet points
            lines = section_text.strip().split('\n')
            for line in lines:
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•') or line[0].isdigit()):
                    # Clean up the line
                    item = re.sub(r'^[-•\d.)\s]+', '', line).strip()
                    if item and len(item) > 10:
                        items.append(item)
        
        return items[:5]  # Limit to 5 items
    
    def _generate_basic_fallback(self, subject: str, grade: str, topic: str) -> Dict:
        """Generate very basic fallback content without LLM."""
        return {
            'success': True,
            'context_available': True,
            'source': 'basic_fallback',
            'learning_objectives': [
                f"Understand key concepts in {topic}",
                f"Apply {subject} principles to solve problems",
                f"Demonstrate mastery of {grade} level content"
            ],
            'key_concepts': [
                f"Core principles of {topic}",
                f"{subject} fundamentals",
                "Critical thinking and analysis"
            ],
            'standards': [
                f"{grade} {subject} curriculum standards",
                "Ethiopian Ministry of Education guidelines"
            ],
            'subject': subject,
            'grade': grade
        }
    
    def enhance_rubric_with_context(
        self,
        rubric: Dict,
        curriculum_context: Dict
    ) -> Dict:
        """
        Enhance generated rubric with curriculum context metadata.
        
        Args:
            rubric: Generated rubric
            curriculum_context: Curriculum context
            
        Returns:
            Enhanced rubric
        """
        enhanced = rubric.copy()
        
        # Add curriculum alignment metadata
        if curriculum_context.get('context_available'):
            enhanced['curriculum_aligned'] = True
            enhanced['learning_objectives_used'] = curriculum_context.get('learning_objectives', [])
            enhanced['key_concepts_covered'] = curriculum_context.get('key_concepts', [])
            enhanced['standards_aligned'] = curriculum_context.get('standards', [])
            
            # Add chapter information
            chapter_context = curriculum_context.get('chapter_context')
            if chapter_context and chapter_context.get('success'):
                enhanced['chapter_number'] = chapter_context.get('chapter_number')
                enhanced['chapter_title'] = chapter_context.get('chapter_title')
        else:
            enhanced['curriculum_aligned'] = False
        
        return enhanced
