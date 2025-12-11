"""
Chapter-Aware RAG System for Enhanced Content Extraction.
Provides intelligent chapter/section extraction from vector stores for better context.
"""
import logging
import re
from typing import List, Dict, Optional, Tuple
from collections import defaultdict

logger = logging.getLogger(__name__)

# Check if required libraries are available
try:
    import chromadb
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    logger.warning("ChromaDB not installed. Chapter-aware RAG will be limited.")


class ChapterBoundaryDetector:
    """Detect chapter boundaries and structure in documents."""
    
    # Chapter/Unit/Lesson patterns with various formats
    CHAPTER_PATTERNS = [
        # Standard formats
        r'(?:CHAPTER|UNIT|MODULE|SECTION)\s+([IVXLCDM]+|[0-9]+)',
        # Word numbers
        r'(?:CHAPTER|UNIT|MODULE|SECTION)\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY)',
        # Amharic patterns
        r'(?:ምዕራፍ|ክፍል|ትምህርት)\s+([0-9]+|[፩-፳])',
    ]
    
    # Number word to digit mapping
    WORD_TO_NUMBER = {
        'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5,
        'SIX': 6, 'SEVEN': 7, 'EIGHT': 8, 'NINE': 9, 'TEN': 10,
        'ELEVEN': 11, 'TWELVE': 12, 'THIRTEEN': 13, 'FOURTEEN': 14, 'FIFTEEN': 15,
        'SIXTEEN': 16, 'SEVENTEEN': 17, 'EIGHTEEN': 18, 'NINETEEN': 19, 'TWENTY': 20
    }
    
    # Roman numeral to digit mapping
    ROMAN_TO_NUMBER = {
        'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
        'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
        'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15,
        'XVI': 16, 'XVII': 17, 'XVIII': 18, 'XIX': 19, 'XX': 20
    }
    
    @classmethod
    def detect_chapter_number(cls, text: str) -> Optional[int]:
        """
        Detect chapter number from text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Chapter number or None
        """
        text_upper = text.upper()
        
        for pattern in cls.CHAPTER_PATTERNS:
            match = re.search(pattern, text_upper, re.IGNORECASE)
            if match:
                number_str = match.group(1).upper()
                
                # Try direct integer conversion
                try:
                    return int(number_str)
                except ValueError:
                    pass
                
                # Try word to number
                if number_str in cls.WORD_TO_NUMBER:
                    return cls.WORD_TO_NUMBER[number_str]
                
                # Try roman numeral
                if number_str in cls.ROMAN_TO_NUMBER:
                    return cls.ROMAN_TO_NUMBER[number_str]
        
        return None
    
    @classmethod
    def extract_chapter_title(cls, text: str) -> Optional[str]:
        """
        Extract chapter title from text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Chapter title or None
        """
        # Look for chapter header followed by title
        patterns = [
            r'(?:CHAPTER|UNIT|MODULE|SECTION)\s+[IVXLCDM0-9]+[:\s]+(.+?)(?:\n|$)',
            r'(?:ምዕራፍ|ክፍል|ትምህርት)\s+[0-9፩-፳]+[:\s]+(.+?)(?:\n|$)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                title = match.group(1).strip()
                # Clean up title (remove extra whitespace, special chars)
                title = re.sub(r'\s+', ' ', title)
                return title[:200]  # Limit length
        
        return None
    
    @classmethod
    def is_chapter_boundary(cls, text: str) -> bool:
        """
        Check if text represents a chapter boundary.
        
        Args:
            text: Text to check
            
        Returns:
            True if chapter boundary detected
        """
        return cls.detect_chapter_number(text) is not None


class ChapterContentExtractor:
    """Extract complete chapter content from vector stores."""
    
    def __init__(self, chroma_client=None):
        """
        Initialize chapter content extractor.
        
        Args:
            chroma_client: ChromaDB client instance
        """
        self.chroma_client = chroma_client
        self.boundary_detector = ChapterBoundaryDetector()
    
    def extract_chapter_content(
        self,
        collection_name: str,
        chapter_number: int,
        subject: Optional[str] = None,
        grade: Optional[str] = None,
        region: Optional[str] = None
    ) -> Dict:
        """
        Extract complete chapter content from vector store with smart token handling.
        
        Args:
            collection_name: ChromaDB collection name
            chapter_number: Chapter number to extract
            subject: Subject filter (optional)
            grade: Grade filter (optional)
            
        Returns:
            Dictionary with chapter content and metadata
        """
        if not CHROMADB_AVAILABLE or not self.chroma_client:
            logger.error("ChromaDB not available for chapter extraction")
            return {
                'success': False,
                'error': 'ChromaDB not available',
                'content': '',
                'chunks': []
            }
        
        try:
            # Get collection
            collection = self.chroma_client.get_collection(name=collection_name)
            
            # Build metadata filter
            where_filter = {'chapter': chapter_number}
            if subject:
                where_filter['subject'] = subject
            if grade:
                where_filter['grade'] = grade
            if region:
                where_filter['region'] = region
            
            # Query all chunks for this chapter
            results = collection.get(
                where=where_filter,
                include=['documents', 'metadatas']
            )
            
            if not results or not results.get('documents'):
                logger.warning(f"No content found for chapter {chapter_number} in {collection_name}")
                return {
                    'success': False,
                    'error': f'No content found for chapter {chapter_number}',
                    'content': '',
                    'chunks': []
                }
            
            # Sort chunks by page/order if available
            chunks_with_meta = list(zip(results['documents'], results['metadatas']))
            chunks_with_meta.sort(key=lambda x: x[1].get('page', 0))
            
            # Smart Token Handling
            from ai_tools.llm.token_counter import token_counter
            
            MAX_TOKENS = 15000  # Safe limit for most models (approx 20-30 pages)
            total_tokens = 0
            selected_chunks = []
            
            # 1. Calculate total tokens first
            full_text_check = '\n\n'.join([chunk[0] for chunk in chunks_with_meta])
            total_tokens = token_counter.count_tokens(full_text_check)
            
            if total_tokens <= MAX_TOKENS:
                # Fits within limit, return all
                full_content = full_text_check
                selected_chunks = [chunk[0] for chunk in chunks_with_meta]
                logger.info(f"✅ Extracted chapter {chapter_number}: {len(full_content)} chars, {total_tokens} tokens (Full)")
            else:
                # Exceeds limit - Smart Truncation
                logger.warning(f"⚠️ Chapter {chapter_number} exceeds token limit ({total_tokens} > {MAX_TOKENS}). Applying smart truncation.")
                
                # Strategy: Keep Start (Intro) + End (Summary) + Distributed Middle
                num_chunks = len(chunks_with_meta)
                
                # Keep first 10% and last 10% (min 2 chunks each)
                start_idx = max(2, int(num_chunks * 0.10))
                end_idx = min(num_chunks - 2, int(num_chunks * 0.90))
                
                # Start chunks
                final_chunks = chunks_with_meta[:start_idx]
                
                # Middle chunks (sample every Nth chunk to fit remaining budget)
                # Remaining budget approx 80% of MAX_TOKENS
                middle_budget_tokens = int(MAX_TOKENS * 0.8)
                middle_candidates = chunks_with_meta[start_idx:end_idx]
                
                if middle_candidates:
                    # Estimate tokens per chunk
                    avg_tokens_per_chunk = total_tokens / num_chunks
                    max_middle_chunks = int(middle_budget_tokens / avg_tokens_per_chunk)
                    
                    step = max(1, len(middle_candidates) // max_middle_chunks)
                    
                    # Add sampled middle chunks with markers
                    for i in range(0, len(middle_candidates), step):
                        if i > 0:
                            final_chunks.append(("[...Content Truncated for Length...]", {}))
                        final_chunks.append(middle_candidates[i])
                
                # End chunks
                if start_idx < end_idx: # Ensure no overlap
                     if end_idx < num_chunks:
                        final_chunks.append(("[...Content Truncated for Length...]", {}))
                        final_chunks.extend(chunks_with_meta[end_idx:])
                
                # Reconstruct content
                selected_chunks = [chunk[0] for chunk in final_chunks]
                full_content = '\n\n'.join(selected_chunks)
                new_token_count = token_counter.count_tokens(full_content)
                
                logger.info(f"✅ Extracted chapter {chapter_number} (Truncated): {len(full_content)} chars, {new_token_count} tokens")

            # Extract chapter metadata
            first_meta = chunks_with_meta[0][1] if chunks_with_meta else {}
            chapter_title = first_meta.get('chapter_title', f'Chapter {chapter_number}')
            
            return {
                'success': True,
                'chapter_number': chapter_number,
                'chapter_title': chapter_title,
                'content': full_content,
                'chunks': selected_chunks,
                'metadata': first_meta,
                'total_chunks': len(chunks_with_meta),
                'truncated': total_tokens > MAX_TOKENS,
                'original_tokens': total_tokens
            }
        
        except Exception as e:
            logger.error(f"❌ Chapter extraction error: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'content': '',
                'chunks': []
            }
    
    def extract_chapter_range(
        self,
        collection_name: str,
        start_chapter: int,
        end_chapter: int,
        subject: Optional[str] = None,
        grade: Optional[str] = None,
        region: Optional[str] = None
    ) -> Dict:
        """
        Extract content from a range of chapters.
        
        Args:
            collection_name: ChromaDB collection name
            start_chapter: Starting chapter number
            end_chapter: Ending chapter number
            subject: Subject filter (optional)
            grade: Grade filter (optional)
            
        Returns:
            Dictionary with combined chapter content
        """
        all_chapters = []
        combined_content = []
        total_chunks = 0
        
        for chapter_num in range(start_chapter, end_chapter + 1):
            chapter_data = self.extract_chapter_content(
                collection_name=collection_name,
                chapter_number=chapter_num,
                subject=subject,
                grade=grade,
                region=region
            )
            
            if chapter_data['success']:
                all_chapters.append(chapter_data)
                combined_content.append(f"=== {chapter_data['chapter_title']} ===\n{chapter_data['content']}")
                total_chunks += chapter_data['total_chunks']
        
        if not all_chapters:
            return {
                'success': False,
                'error': f'No chapters found in range {start_chapter}-{end_chapter}',
                'content': '',
                'chapters': []
            }
        
        logger.info(f"✅ Extracted {len(all_chapters)} chapters: {total_chunks} total chunks")
        
        return {
            'success': True,
            'start_chapter': start_chapter,
            'end_chapter': end_chapter,
            'content': '\n\n'.join(combined_content),
            'chapters': all_chapters,
            'total_chapters': len(all_chapters),
            'total_chunks': total_chunks
        }
    
    def get_chapter_summary(
        self,
        collection_name: str,
        subject: Optional[str] = None,
        grade: Optional[str] = None,
        region: Optional[str] = None
    ) -> Dict:
        """
        Get summary of available chapters in collection.
        
        Args:
            collection_name: ChromaDB collection name
            subject: Subject filter (optional)
            grade: Grade filter (optional)
            
        Returns:
            Dictionary with chapter summary
        """
        if not CHROMADB_AVAILABLE or not self.chroma_client:
            return {'success': False, 'error': 'ChromaDB not available'}
        
        try:
            collection = self.chroma_client.get_collection(name=collection_name)
            
            # Build metadata filter
            where_filter = {}
            if subject:
                where_filter['subject'] = subject
            if grade:
                where_filter['grade'] = grade
            if region:
                where_filter['region'] = region
            
            # Get all documents with metadata
            results = collection.get(
                where=where_filter if where_filter else None,
                include=['metadatas']
            )
            
            if not results or not results.get('metadatas'):
                return {'success': False, 'error': 'No documents found'}
            
            # Group by chapter
            chapters_info = defaultdict(lambda: {'count': 0, 'title': None})
            
            for meta in results['metadatas']:
                chapter_num = meta.get('chapter')
                if chapter_num:
                    chapters_info[chapter_num]['count'] += 1
                    if not chapters_info[chapter_num]['title']:
                        chapters_info[chapter_num]['title'] = meta.get('chapter_title', f'Chapter {chapter_num}')
            
            # Sort by chapter number
            sorted_chapters = sorted(chapters_info.items())
            
            return {
                'success': True,
                'total_chapters': len(sorted_chapters),
                'chapters': [
                    {
                        'number': num,
                        'title': info['title'],
                        'chunk_count': info['count']
                    }
                    for num, info in sorted_chapters
                ]
            }
        
        except Exception as e:
            logger.error(f"❌ Chapter summary error: {e}")
            return {'success': False, 'error': str(e)}


class EnhancedRAGQuery:
    """Enhanced RAG query with chapter-aware extraction."""
    
    def __init__(self, chroma_client=None, embedding_model=None):
        """
        Initialize enhanced RAG query.
        
        Args:
            chroma_client: ChromaDB client instance
            embedding_model: Embedding model for semantic search
        """
        self.chroma_client = chroma_client
        self.embedding_model = embedding_model
        self.chapter_extractor = ChapterContentExtractor(chroma_client)
    
    def query_with_chapter_context(
        self,
        collection_name: str,
        query: str,
        chapter_number: Optional[int] = None,
        chapter_range: Optional[Tuple[int, int]] = None,
        subject: Optional[str] = None,

        grade: Optional[str] = None,
        region: Optional[str] = None,
        n_results: int = 5
    ) -> Dict:
        """
        Query vector store with chapter context.
        
        Args:
            collection_name: ChromaDB collection name
            query: Query text
            chapter_number: Specific chapter to query (optional)
            chapter_range: Range of chapters (start, end) (optional)
            subject: Subject filter (optional)
            grade: Grade filter (optional)
            n_results: Number of results to return
            
        Returns:
            Dictionary with query results and chapter context
        """
        if not CHROMADB_AVAILABLE or not self.chroma_client:
            return {'success': False, 'error': 'ChromaDB not available'}
        
        try:
            collection = self.chroma_client.get_collection(name=collection_name)
            
            # Build metadata filter
            where_filter = {}
            if chapter_number:
                where_filter['chapter'] = chapter_number
            if subject:
                where_filter['subject'] = subject
            if grade:
                where_filter['grade'] = grade
            if region:
                where_filter['region'] = region
            
            # Perform semantic search
            results = collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_filter if where_filter else None,
                include=['documents', 'metadatas', 'distances']
            )
            
            if not results or not results.get('documents') or not results['documents'][0]:
                return {
                    'success': False,
                    'error': 'No results found',
                    'results': []
                }
            
            # Extract chapter context if requested
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
            
            # Format results
            formatted_results = []
            for i, (doc, meta, dist) in enumerate(zip(
                results['documents'][0],
                results['metadatas'][0],
                results['distances'][0]
            )):
                formatted_results.append({
                    'rank': i + 1,
                    'content': doc,
                    'metadata': meta,
                    'relevance_score': 1 - dist,  # Convert distance to similarity
                    'chapter': meta.get('chapter'),
                    'chapter_title': meta.get('chapter_title')
                })
            
            logger.info(f"✅ Query returned {len(formatted_results)} results")
            
            return {
                'success': True,
                'query': query,
                'results': formatted_results,
                'chapter_context': chapter_context,
                'total_results': len(formatted_results)
            }
        
        except Exception as e:
            logger.error(f"❌ RAG query error: {e}", exc_info=True)
            return {'success': False, 'error': str(e)}
