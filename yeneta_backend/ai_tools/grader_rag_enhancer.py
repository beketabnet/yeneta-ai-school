"""
Quick Grader RAG Enhancer.
Integrates vector store content for enhanced grading with curriculum context.
"""
import logging
from typing import Dict, List, Optional, Tuple
from rag.chapter_aware_rag import ChapterContentExtractor, EnhancedRAGQuery

logger = logging.getLogger(__name__)


class GraderRAGEnhancer:
    """Enhance grading with RAG-based curriculum and reference context."""
    
    def __init__(self, chroma_client=None, embedding_model=None):
        """
        Initialize grader RAG enhancer.
        
        Args:
            chroma_client: ChromaDB client instance
            embedding_model: Embedding model for semantic search
        """
        self.chapter_extractor = ChapterContentExtractor(chroma_client)
        self.rag_query = EnhancedRAGQuery(chroma_client, embedding_model)
    
    def extract_grading_context(
        self,
        submission_text: str,
        assignment_description: str,
        subject: Optional[str] = None,
        grade: Optional[str] = None,
        chapter_number: Optional[int] = None,

        chapter_range: Optional[Tuple[int, int]] = None,
        region: Optional[str] = None,
        use_vector_store: bool = True
    ) -> Dict:
        """
        Extract grading context from curriculum vector stores.
        
        Args:
            submission_text: Student's submission
            assignment_description: Assignment prompt
            subject: Subject name (optional)
            grade: Grade level (optional)
            chapter_number: Specific chapter (optional)
            chapter_number: Specific chapter (optional)
            chapter_range: Range of chapters (optional)
            region: Region filter (optional)
            use_vector_store: Whether to use vector store
            
        Returns:
            Dictionary with grading context
        """
        if not use_vector_store or not subject or not grade:
            return {
                'success': False,
                'context_available': False,
                'reference_content': [],
                'key_concepts': [],
                'expected_knowledge': []
            }
        
        try:
            # Build collection name
            collection_name = self._build_collection_name(subject, grade)
            
            # Extract chapter content if specified
            chapter_context = None
            if chapter_number:
                chapter_context = self.chapter_extractor.extract_chapter_content(
                    collection_name=collection_name,
                    chapter_number=chapter_number,
                    subject=subject,
                    grade=grade,
                    region=region
                )
            elif chapter_range:
                chapter_context = self.chapter_extractor.extract_chapter_range(
                    collection_name=collection_name,
                    start_chapter=chapter_range[0],
                    end_chapter=chapter_range[1],
                    subject=subject,
                    grade=grade,
                    region=region
                )
            
            # Query for assignment-specific content
            query_results = self.rag_query.query_with_chapter_context(
                collection_name=collection_name,
                query=assignment_description,
                chapter_number=chapter_number,
                chapter_range=chapter_range,
                subject=subject,
                grade=grade,
                region=region,
                n_results=5
            )
            
            # Extract reference content and concepts
            reference_content = self._extract_reference_content(
                chapter_context, query_results
            )
            
            key_concepts = self._extract_key_concepts(
                chapter_context, query_results
            )
            
            expected_knowledge = self._extract_expected_knowledge(
                chapter_context, query_results, assignment_description
            )
            
            logger.info(f"✅ Extracted grading context: {len(reference_content)} references, {len(key_concepts)} concepts")
            
            return {
                'success': True,
                'context_available': True,
                'chapter_context': chapter_context,
                'query_results': query_results,
                'reference_content': reference_content,
                'key_concepts': key_concepts,
                'expected_knowledge': expected_knowledge,
                'subject': subject,
                'grade': grade
            }
        
        except Exception as e:
            logger.error(f"❌ Grading context extraction error: {e}", exc_info=True)
            return {
                'success': False,
                'context_available': False,
                'error': str(e),
                'reference_content': [],
                'key_concepts': [],
                'expected_knowledge': []
            }
    
    def _build_collection_name(self, subject: str, grade: str) -> str:
        """Build ChromaDB collection name from subject and grade."""
        subject_normalized = subject.lower().replace(' ', '_')
        grade_normalized = grade.lower().replace(' ', '_')
        return f"curriculum_{subject_normalized}_{grade_normalized}"
    
    def _extract_reference_content(
        self,
        chapter_context: Optional[Dict],
        query_results: Dict
    ) -> List[Dict]:
        """Extract reference content for grading."""
        references = []
        
        # Extract from chapter context
        if chapter_context and chapter_context.get('success'):
            references.append({
                'source': 'chapter',
                'chapter_number': chapter_context.get('chapter_number'),
                'chapter_title': chapter_context.get('chapter_title'),
                'content': chapter_context.get('content', '')[:2000],  # Limit length
                'relevance': 'high'
            })
        
        # Extract from query results
        if query_results and query_results.get('success'):
            for result in query_results.get('results', [])[:3]:
                references.append({
                    'source': 'curriculum',
                    'content': result.get('content', ''),
                    'relevance_score': result.get('relevance_score', 0),
                    'chapter': result.get('chapter'),
                    'chapter_title': result.get('chapter_title')
                })
        
        return references
    
    def _extract_key_concepts(
        self,
        chapter_context: Optional[Dict],
        query_results: Dict
    ) -> List[str]:
        """Extract key concepts from curriculum content."""
        import re
        
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
        return unique_concepts[:15]
    
    def _parse_concepts_from_text(self, text: str) -> List[str]:
        """Parse key concepts from text content."""
        import re
        
        concepts = []
        
        # Look for concept patterns
        patterns = [
            r'(?:Key Concept|Important Concept|Main Idea|Key Term|Definition)[:\s]+(.+?)(?:\n|\.)',
            r'(?:Define|Understand|Explain)[:\s]+(.+?)(?:\n|\.)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                concept = match.group(1).strip()
                if len(concept) > 10 and len(concept) < 150:
                    concepts.append(concept)
        
        return concepts[:5]
    
    def _extract_expected_knowledge(
        self,
        chapter_context: Optional[Dict],
        query_results: Dict,
        assignment_description: str
    ) -> List[str]:
        """Extract expected knowledge points for grading."""
        knowledge_points = []
        
        # Parse from assignment description
        if assignment_description:
            # Look for explicit requirements
            import re
            requirement_patterns = [
                r'(?:should|must|need to|required to)\s+(.+?)(?:\.|,|\n)',
                r'(?:include|discuss|explain|analyze|describe)\s+(.+?)(?:\.|,|\n)',
            ]
            
            for pattern in requirement_patterns:
                matches = re.finditer(pattern, assignment_description, re.IGNORECASE)
                for match in matches:
                    point = match.group(1).strip()
                    if len(point) > 10 and len(point) < 200:
                        knowledge_points.append(point)
        
        # Extract from curriculum content
        if chapter_context and chapter_context.get('success'):
            content = chapter_context.get('content', '')
            # Look for learning outcomes
            import re
            outcome_patterns = [
                r'(?:Students will|Learners will|By the end)[:\s]+(.+?)(?:\n|\.)',
            ]
            
            for pattern in outcome_patterns:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                for match in matches:
                    point = match.group(1).strip()
                    if len(point) > 15 and len(point) < 200:
                        knowledge_points.append(point)
        
        # Remove duplicates and limit
        unique_points = list(dict.fromkeys(knowledge_points))
        return unique_points[:10]
    
    def build_enhanced_grading_prompt(
        self,
        submission_text: str,
        rubric: Dict,
        assignment_description: str,
        grading_context: Dict,
        assessment_type: str = 'essay',
        grade_level: Optional[str] = None
    ) -> str:
        """
        Build enhanced grading prompt with curriculum context.
        
        Args:
            submission_text: Student's submission
            rubric: Grading rubric
            assignment_description: Assignment description
            grading_context: Extracted grading context
            assessment_type: Type of assessment
            grade_level: Student grade level
            
        Returns:
            Enhanced prompt string
        """
        from .essay_grader_enhancer import EssayGraderEnhancer
        
        # Start with base prompt
        base_prompt = EssayGraderEnhancer.build_grading_prompt(
            submission_text=submission_text,
            rubric=rubric,
            assignment_description=assignment_description,
            assessment_type=assessment_type,
            grade_level=grade_level
        )
        
        # Add curriculum context if available
        if grading_context.get('context_available'):
            context_parts = []
            context_parts.append("\n=== CURRICULUM REFERENCE CONTEXT ===")
            context_parts.append("Use this curriculum content as reference for accurate grading:")
            context_parts.append("")
            
            # Key concepts
            concepts = grading_context.get('key_concepts', [])
            if concepts:
                context_parts.append("Key Concepts to Look For:")
                for concept in concepts[:10]:
                    context_parts.append(f"- {concept}")
                context_parts.append("")
            
            # Expected knowledge
            expected = grading_context.get('expected_knowledge', [])
            if expected:
                context_parts.append("Expected Knowledge Points:")
                for point in expected[:8]:
                    context_parts.append(f"- {point}")
                context_parts.append("")
            
            # Reference content (limited to avoid token overflow)
            references = grading_context.get('reference_content', [])
            if references:
                context_parts.append("Curriculum Reference Content:")
                for i, ref in enumerate(references[:2], 1):
                    if ref.get('chapter_title'):
                        context_parts.append(f"\nReference {i} - {ref.get('chapter_title')}:")
                    else:
                        context_parts.append(f"\nReference {i}:")
                    
                    content = ref.get('content', '')
                    # Limit reference content to avoid token overflow
                    if len(content) > 800:
                        content = content[:800] + "..."
                    context_parts.append(content)
                context_parts.append("")
            
            context_parts.append("=== GRADING INSTRUCTIONS WITH CONTEXT ===")
            context_parts.append("• Compare student's work against curriculum standards")
            context_parts.append("• Check for accuracy against reference content")
            context_parts.append("• Verify key concepts are correctly understood")
            context_parts.append("• Assess depth of understanding based on expected knowledge")
            context_parts.append("• Provide specific feedback referencing curriculum content")
            context_parts.append("")
            
            # Insert context before output format section
            context_section = "\n".join(context_parts)
            
            # Find where to insert (before "=== REQUIRED OUTPUT FORMAT ===")
            insert_position = base_prompt.find("=== REQUIRED OUTPUT FORMAT ===")
            if insert_position > 0:
                enhanced_prompt = base_prompt[:insert_position] + context_section + base_prompt[insert_position:]
            else:
                enhanced_prompt = base_prompt + "\n" + context_section
            
            return enhanced_prompt
        
        return base_prompt
    
    def validate_submission_accuracy(
        self,
        submission_text: str,
        grading_context: Dict
    ) -> Dict:
        """
        Validate submission accuracy against curriculum content.
        
        Args:
            submission_text: Student's submission
            grading_context: Grading context with curriculum references
            
        Returns:
            Validation results
        """
        if not grading_context.get('context_available'):
            return {
                'validated': False,
                'accuracy_score': None,
                'factual_errors': [],
                'concept_coverage': []
            }
        
        try:
            # Check for key concepts coverage
            concepts = grading_context.get('key_concepts', [])
            concepts_found = []
            concepts_missing = []
            
            submission_lower = submission_text.lower()
            for concept in concepts:
                concept_lower = concept.lower()
                # Simple keyword matching (can be enhanced with semantic similarity)
                if any(word in submission_lower for word in concept_lower.split()[:3]):
                    concepts_found.append(concept)
                else:
                    concepts_missing.append(concept)
            
            # Calculate coverage score
            total_concepts = len(concepts)
            found_concepts = len(concepts_found)
            coverage_score = (found_concepts / total_concepts * 100) if total_concepts > 0 else 0
            
            logger.info(f"✅ Concept coverage: {found_concepts}/{total_concepts} ({coverage_score:.1f}%)")
            
            return {
                'validated': True,
                'accuracy_score': coverage_score,
                'concepts_found': concepts_found,
                'concepts_missing': concepts_missing,
                'coverage_percentage': round(coverage_score, 1)
            }
        
        except Exception as e:
            logger.error(f"❌ Validation error: {e}")
            return {
                'validated': False,
                'error': str(e)
            }
