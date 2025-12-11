"""
Structured document processor with chapter awareness.
Assembles coherent chapter-level content using metadata and boundary detection.
Enhanced with topic extraction and learning objectives extraction.
"""

import logging
import re
from typing import Dict, List, Optional, Sequence, Tuple

from .chapter_boundary_detector import ChapterBoundaryDetector

logger = logging.getLogger(__name__)

try:
    from ai_tools.llm.token_counter import token_counter
    TOKEN_COUNTER_AVAILABLE = True
except ImportError:
    TOKEN_COUNTER_AVAILABLE = False
    logger.warning("Token counter not available. Using character-based estimation.")


class StructuredDocumentProcessor:
    """Utilities for assembling chapter-aware content from vector store chunks."""

    KEYWORD_STOP_WORDS = {
        'the', 'and', 'are', 'for', 'with', 'from', 'that', 'this', 'have', 'about',
        'into', 'will', 'your', 'when', 'where', 'what', 'which', 'their', 'them',
        'they', 'been', 'being', 'there', 'here', 'also', 'such', 'very', 'over',
        'through', 'using', 'need', 'should', 'could', 'would', 'please'
    }

    @classmethod
    def assemble_chapter_content(
        cls,
        chunk_data: Sequence[Tuple[str, Dict]],
        max_chars: int = 20000,
        priority_texts: Optional[Sequence[str]] = None,
        keyword_hint: Optional[str] = None,
        smart_token_handling: bool = False
    ) -> Dict[str, any]:
        """
        Combine chapter chunk data into a coherent text block.

        Args:
            chunk_data: Sequence of (chunk_text, metadata) tuples.
            max_chars: Character limit for assembled content.
            priority_texts: Optional collection of chunk texts to prioritise.
            keyword_hint: Optional text used to extract keywords for ranking.
            smart_token_handling: Whether to use smart token truncation (Intro + Middle + End).

        Returns:
            Dict with assembled content, chunk counts, and aggregated metadata.
        """
        if not chunk_data:
            return {
                'content': '',
                'chunk_count': 0,
                'total_chunks': 0,
                'metadata': {}
            }

        # If smart token handling is requested and available
        if smart_token_handling:
            return cls._smart_truncate(chunk_data, max_chars)

        keywords = cls._extract_keywords(keyword_hint) if keyword_hint else []
        priority_lookup = set(priority_texts or [])

        prepared_chunks: List[Dict[str, any]] = []
        seen_hashes = set()

        for index, (raw_text, raw_meta) in enumerate(chunk_data):
            text = (raw_text or '').strip()
            if not text:
                continue

            chunk_hash = hash(text[:120])
            if chunk_hash in seen_hashes:
                continue
            seen_hashes.add(chunk_hash)

            metadata = dict(raw_meta or {})
            if not metadata.get('chapter'):
                inferred = cls._infer_chapter_from_text(text)
                if inferred:
                    metadata.setdefault('chapter', str(inferred))

            score = cls._score_chunk(text, keywords, priority_lookup)
            prepared_chunks.append({
                'text': text,
                'metadata': metadata,
                'score': score,
                'index': index
            })

        if not prepared_chunks:
            return {
                'content': '',
                'chunk_count': 0,
                'total_chunks': 0,
                'metadata': {}
            }

        prepared_chunks.sort(key=lambda item: (-item['score'], item['index']))

        assembled_parts: List[str] = []
        total_chars = 0

        for item in prepared_chunks:
            text = item['text']

            if total_chars + len(text) > max_chars:
                remaining = max_chars - total_chars
                if remaining <= max(200, int(max_chars * 0.1)):
                    truncated = cls._truncate_at_paragraph(text, remaining)
                    if truncated:
                        assembled_parts.append(truncated)
                        total_chars = max_chars
                    break
                truncated = cls._truncate_at_sentence(text, remaining)
                assembled_parts.append(truncated)
                total_chars += len(truncated)
                break

            assembled_parts.append(text)
            total_chars += len(text) + 2  # account for paragraph spacing

        content = "\n\n".join(assembled_parts).strip()

        if total_chars >= max_chars:
            content = content.rstrip() + "\n\n[Chapter content continues...]"

        return {
            'content': content,
            'chunk_count': len(assembled_parts),
            'total_chunks': len(prepared_chunks),
            'metadata': prepared_chunks[0]['metadata'] if prepared_chunks else {}
        }

    @classmethod
    def _smart_truncate(
        cls,
        chunk_data: Sequence[Tuple[str, Dict]],
        max_limit: int
    ) -> Dict[str, any]:
        """
        Smartly truncate content using "Semantic Compression".
        Prioritizes: Objectives, Summaries, Definitions, Core Concepts.
        Compresses: Activities, Repetitive Examples, Filler.
        """
        # Sort chunks by index/order
        sorted_chunks = sorted(chunk_data, key=lambda x: (
            int(x[1].get('page', 0)) if x[1].get('page') else 0,
            int(x[1].get('order', 0)) if x[1].get('order') else 0,
            x[0][:20]
        ))
        
        chunks_text = [c[0] for c in sorted_chunks]
        full_text = "\n\n".join(chunks_text)
        
        # Check size
        current_size = 0
        if TOKEN_COUNTER_AVAILABLE:
            current_size = token_counter.count_tokens(full_text)
            limit_val = max_limit if max_limit < 100000 else int(max_limit / 4)
        else:
            current_size = len(full_text)
            limit_val = max_limit

        if current_size <= limit_val:
            return {
                'content': full_text,
                'chunk_count': len(sorted_chunks),
                'total_chunks': len(sorted_chunks),
                'metadata': sorted_chunks[0][1] if sorted_chunks else {},
                'truncated': False
            }
            
        logger.info(f"⚠️ Content exceeds limit ({current_size} > {limit_val}). Applying Semantic Compression.")
        
        # SEMANTIC SCORING
        # 1. Identify High Value Chunks
        high_value_patterns = [
            r'objectives?', r'summary', r'key terms', r'definition', 
            r'introduction', r'conclusion', r'remember', r'note'
        ]
        
        # 2. Identify Low Value Chunks (Activities, Instructions)
        low_value_patterns = [
            r'activity', r'group work', r'pair work', r'project', 
            r'instructions', r'get into groups', r'discuss', r'interview'
        ]
        
        scored_chunks = []
        for i, (text, meta) in enumerate(sorted_chunks):
            score = 50  # Base score
            text_lower = text.lower()
            
            # Boost High Value
            if any(p in text_lower for p in high_value_patterns):
                score += 30
            
            # Boost Topic Headers (Short chunks with capitalization)
            if len(text) < 200 and text[0].isupper():
                score += 20
                
            # Penalize Low Value
            if any(p in text_lower for p in low_value_patterns):
                score -= 30
                
            # Boost Start and End of Chapter
            if i < len(sorted_chunks) * 0.1: # First 10%
                score += 15
            if i > len(sorted_chunks) * 0.9: # Last 10%
                score += 15
                
            scored_chunks.append({
                'text': text,
                'meta': meta,
                'score': score,
                'original_index': i
            })
            
        # Select chunks based on score until limit reached
        # We must maintain original order!
        
        # Sort by score desc to pick best candidates
        # But we need to estimate size. This is tricky.
        # Strategy: 
        # 1. Always keep top 20% highest scored chunks
        # 2. Fill remaining space with next highest scored chunks
        # 3. Re-sort by original index
        
        scored_chunks.sort(key=lambda x: x['score'], reverse=True)
        
        selected_chunks = []
        current_tokens = 0
        
        for chunk in scored_chunks:
            chunk_len = len(chunk['text']) // 4 if not TOKEN_COUNTER_AVAILABLE else token_counter.count_tokens(chunk['text'])
            
            if current_tokens + chunk_len <= limit_val:
                selected_chunks.append(chunk)
                current_tokens += chunk_len
            else:
                # Try to fit a compressed version? (Future enhancement)
                pass
                
        # Re-sort by original index to restore narrative flow
        selected_chunks.sort(key=lambda x: x['original_index'])
        
        # Reassemble
        final_texts = [c['text'] for c in selected_chunks]
        
        # Add "Gap" markers where chunks were skipped
        final_content_parts = []
        last_idx = -1
        
        for chunk in selected_chunks:
            curr_idx = chunk['original_index']
            if last_idx != -1 and curr_idx > last_idx + 1:
                final_content_parts.append("\n[...Less relevant content omitted...]\n")
            final_content_parts.append(chunk['text'])
            last_idx = curr_idx
            
        assembled_content = "\n\n".join(final_content_parts)
        
        return {
            'content': assembled_content,
            'chunk_count': len(selected_chunks),
            'total_chunks': len(sorted_chunks),
            'metadata': sorted_chunks[0][1] if sorted_chunks else {},
            'truncated': True
        }

    @classmethod
    def _extract_keywords(cls, text: str) -> List[str]:
        tokens = re.findall(r'\b\w+\b', text.lower())
        keywords = [token for token in tokens if token not in cls.KEYWORD_STOP_WORDS and len(token) > 2]
        return keywords[:15]

    @classmethod
    def _score_chunk(cls, text: str, keywords: List[str], priority_lookup: set) -> float:
        score = 0.0

        if text in priority_lookup:
            score += 5.0

        if keywords:
            lowered = text.lower()
            keyword_hits = sum(1 for kw in keywords if kw in lowered)
            score += min(keyword_hits, 8) * 1.0

        # Slight boost for longer chunks which might capture more context
        score += min(len(text) / 500.0, 2.0)
        return score

    @staticmethod
    def _truncate_at_sentence(text: str, limit: int) -> str:
        truncated = text[:limit]
        last_sentence = max(truncated.rfind('. '), truncated.rfind('! '), truncated.rfind('? '))
        if last_sentence > limit * 0.6:
            return truncated[:last_sentence + 1] + "..."
        return truncated + "..."

    @staticmethod
    def _truncate_at_paragraph(text: str, limit: int) -> Optional[str]:
        truncated = text[:limit]
        last_break = truncated.rfind('\n\n')
        if last_break > limit * 0.5:
            return truncated[:last_break] + "\n\n[Content continues...]"
        return None

    @staticmethod
    def _infer_chapter_from_text(text: str) -> Optional[int]:
        boundary = ChapterBoundaryDetector.detect_chapter_boundary(text)
        if boundary and boundary.get('number'):
            return boundary['number']
        return None
    
    @classmethod
    def extract_topics(cls, content: str, max_topics: int = 10) -> List[str]:
        """
        Extract main topics from chapter content.
        Filters out messy text and activity descriptions.
        
        Args:
            content: Chapter content text
            max_topics: Maximum number of topics to extract
            
        Returns:
            List of extracted topics
        """
        topics = []
        
        # Filter patterns for messy text to exclude
        exclude_patterns = [
            r'sit in a group',
            r'discuss the questions',
            r'recently, the rate',
            r'they baked',
            r'drank wine',
            r'had a wonderful voice',
            r'listening activity',
            r'reading activity',
            r'writing activity',
            r'speaking activity',
            r'work in pairs',
            r'work in groups',
            r'answer the following',
            r'complete the sentences',
            r'fill in the blanks',
        ]
        
        def is_valid_topic(topic: str) -> bool:
            """Check if topic is valid and not messy text."""
            topic_lower = topic.lower()
            
            # Check length
            if len(topic) < 5 or len(topic) > 100:
                return False
            
            # Check for too many punctuation marks (likely not a clean topic)
            if topic.count('.') > 3 or topic.count(',') > 5:
                return False
            
            # Check for exclude patterns
            for pattern in exclude_patterns:
                if re.search(pattern, topic_lower):
                    return False
            
            # Check if it looks like a sentence (too many words)
            word_count = len(topic.split())
            if word_count > 15:
                return False
            
            # Check if it starts with common activity verbs
            activity_verbs = ['sit', 'discuss', 'read', 'write', 'listen', 'speak', 'work', 'complete', 'fill']
            first_word = topic.split()[0].lower() if topic.split() else ''
            if first_word in activity_verbs and word_count > 5:
                return False
            
            return True
        
        # Pattern 1: Look for topic headers (numbered lists, bold text, etc.)
        topic_patterns = [
            r'(?:^|\n)\s*\d+\.\d+\s+([A-Z][^\n]{5,80})',  # Section headers like "3.1 Causes of Road Accidents"
            r'(?:^|\n)\s*(?:[0-9]+\.|[•\-\*])\s*([A-Z][^\n]{5,80})',  # Numbered or bulleted topics
            r'(?:^|\n)\s*([A-Z][A-Z\s]{3,40}):',  # ALL CAPS headers (shorter)
            r'(?:^|\n)\s*\*\*([^*]{5,80})\*\*',  # Bold markdown
            r'(?:^|\n)\s*###\s+([^\n]{5,80})',  # Markdown headers
        ]
        
        for pattern in topic_patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            for match in matches:
                topic = match.strip() if isinstance(match, str) else match[0].strip()
                # Clean up topic
                topic = re.sub(r'^[0-9]+\.\s*', '', topic)  # Remove simple numbering
                topic = re.sub(r'^[0-9]+\.[0-9]+\s*', '', topic)  # Remove section numbers
                topic = re.sub(r'^[•\-\*]\s*', '', topic)  # Remove bullets
                topic = re.sub(r'[:\-]\s*$', '', topic)  # Remove trailing colons/dashes
                topic = topic.strip()
                
                if is_valid_topic(topic) and topic not in topics:
                    topics.append(topic)
                    if len(topics) >= max_topics:
                        break
            if len(topics) >= max_topics:
                break
        
        # Pattern 2: Extract key phrases (noun phrases with important keywords)
        if len(topics) < max_topics:
            # Look for sentences with key educational terms
            key_terms = [
                'concept', 'principle', 'theory', 'method', 'process', 'system',
                'function', 'structure', 'relationship', 'property', 'characteristic',
                'example', 'application', 'analysis', 'evaluation', 'synthesis'
            ]
            
            sentences = re.split(r'[.!?]+', content)
            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) < 20 or len(sentence) > 200:
                    continue
                
                # Check if sentence contains key terms
                sentence_lower = sentence.lower()
                if any(term in sentence_lower for term in key_terms):
                    # Extract noun phrase (simplified)
                    # Look for patterns like "The [noun] [verb]" or "[Noun] is/are"
                    noun_phrase_patterns = [
                        r'(?:The|A|An)\s+([A-Z][a-z]+(?:\s+[a-z]+){0,5})\s+(?:is|are|was|were|can|may)',
                        r'([A-Z][a-z]+(?:\s+[a-z]+){0,5})\s+(?:refers|means|describes|explains)',
                    ]
                    
                    for pattern in noun_phrase_patterns:
                        match = re.search(pattern, sentence)
                        if match:
                            topic = match.group(1).strip()
                            if len(topic) >= 5 and len(topic) <= 80 and topic not in topics:
                                topics.append(topic)
                                if len(topics) >= max_topics:
                                    break
                if len(topics) >= max_topics:
                    break
        
        logger.debug(f"📚 Extracted {len(topics)} topics from content")
        return topics[:max_topics]
    
    @classmethod
    def extract_learning_objectives(cls, content: str, max_objectives: int = 8) -> List[str]:
        """
        Extract learning objectives from chapter content.
        
        Args:
            content: Chapter content text
            max_objectives: Maximum number of objectives to extract
            
        Returns:
            List of extracted learning objectives
        """
        objectives = []
        
        # Pattern 1: Explicit learning objectives sections
        objective_section_patterns = [
            r'(?:LEARNING\s+)?OBJECTIVES?[:\s]+(.*?)(?=\n\n|\n[A-Z]{3,}|$)',
            r'BY\s+THE\s+END\s+OF\s+THIS\s+(?:CHAPTER|UNIT|LESSON)[:\s]+(.*?)(?=\n\n|\n[A-Z]{3,}|$)',
            r'YOU\s+WILL\s+BE\s+ABLE\s+TO[:\s]+(.*?)(?=\n\n|\n[A-Z]{3,}|$)',
            r'STUDENTS\s+WILL[:\s]+(.*?)(?=\n\n|\n[A-Z]{3,}|$)',
        ]
        
        for pattern in objective_section_patterns:
            match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            if match:
                section = match.group(1).strip()
                # Split by common separators
                lines = re.split(r'[•\-\*]|\d+\.', section)
                for line in lines:
                    line = line.strip()
                    if len(line) >= 15 and len(line) <= 200:
                        # Check if it looks like an objective (action verbs)
                        action_verbs = [
                            'understand', 'explain', 'describe', 'identify', 'analyze',
                            'evaluate', 'apply', 'create', 'demonstrate', 'compare',
                            'contrast', 'solve', 'calculate', 'define', 'classify'
                        ]
                        line_lower = line.lower()
                        if any(verb in line_lower for verb in action_verbs):
                            objectives.append(line)
                            if len(objectives) >= max_objectives:
                                break
                if len(objectives) >= max_objectives:
                    break
        
        # Pattern 2: Extract sentences with objective-like structure
        if len(objectives) < max_objectives:
            # Look for sentences starting with action verbs
            objective_sentence_pattern = r'(?:^|\n)\s*(?:Students\s+will|You\s+will|After\s+this\s+chapter|By\s+the\s+end)[^.!?]{20,150}[.!?]'
            matches = re.findall(objective_sentence_pattern, content, re.MULTILINE | re.IGNORECASE)
            for match in matches:
                objective = match.strip()
                if len(objective) >= 20 and len(objective) <= 200 and objective not in objectives:
                    objectives.append(objective)
                    if len(objectives) >= max_objectives:
                        break
        
        logger.debug(f"🎯 Extracted {len(objectives)} learning objectives from content")
        return objectives[:max_objectives]
    
    @classmethod
    def enhance_content_with_metadata(
        cls,
        content: str,
        extract_topics: bool = True,
        extract_objectives: bool = True
    ) -> Dict[str, any]:
        """
        Enhance content by extracting topics and learning objectives.
        
        Args:
            content: Chapter content text
            extract_topics: Whether to extract topics
            extract_objectives: Whether to extract learning objectives
            
        Returns:
            Dict with enhanced content and metadata
        """
        enhanced = {
            'content': content,
            'topics': [],
            'learning_objectives': []
        }
        
        if extract_topics:
            enhanced['topics'] = cls.extract_topics(content)
        
        if extract_objectives:
            enhanced['learning_objectives'] = cls.extract_learning_objectives(content)
        
        return enhanced

