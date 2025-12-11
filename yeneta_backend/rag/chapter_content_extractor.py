"""
Chapter Content Extractor for AI Tutor RAG.
Extracts complete chapter/section/lesson content from vector stores.
"""
import os
import logging
from typing import List, Dict, Optional
from .chapter_boundary_detector import ChapterBoundaryDetector
from .structured_document_processor import StructuredDocumentProcessor

logger = logging.getLogger(__name__)

try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    logger.warning("ChromaDB not available")


class ChapterContentExtractor:
    """Extracts complete chapter content from vector stores."""
    
    @classmethod
    def extract_full_chapter_content(
        cls,
        vector_store_path: str,
        collection_name: str,
        chapter_number: int,
        max_chars: int = 20000
    ) -> Optional[Dict]:
        """
        Extract complete content of a specific chapter.
        
        Args:
            vector_store_path: Path to ChromaDB vector store
            collection_name: Name of the collection
            chapter_number: Chapter number to extract
            max_chars: Maximum characters to return
            
        Returns:
            Dict with chapter content and metadata
        """
        if not CHROMADB_AVAILABLE:
            logger.error("ChromaDB not available")
            return None
        
        try:
            # Initialize ChromaDB client
            client = chromadb.PersistentClient(
                path=vector_store_path,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            
            # Get collection
            collection = client.get_collection(name=collection_name)
            
            # Query ALL chunks with matching chapter metadata (no limit)
            results = collection.get(
                where={"chapter": {"$eq": str(chapter_number)}},
                include=['documents', 'metadatas']
            )
            
            if not results or not results.get('documents'):
                logger.warning(f"No content found for chapter {chapter_number}")
                return None
            
            # Get all chunks for this chapter
            chunks = results['documents']
            metadatas = results.get('metadatas', [])
            
            logger.info(f"📖 Found {len(chunks)} chunks for chapter {chapter_number}")
            
            # Sort chunks by page number or order if available to maintain sequence
            if metadatas and any('page' in meta or 'order' in meta for meta in metadatas):
                chunk_data_list = list(zip(chunks, metadatas))
                chunk_data_list.sort(key=lambda x: (
                    int(x[1].get('page', 0)) if x[1].get('page') else 0,
                    int(x[1].get('order', 0)) if x[1].get('order') else 0
                ))
                chunk_data = chunk_data_list
            else:
                chunk_data = list(zip(chunks, metadatas))
            
            # Assemble chapter content from all chunks
            assembled = StructuredDocumentProcessor.assemble_chapter_content(
                chunk_data,
                max_chars=max_chars,
                smart_token_handling=True
            )
            
            chapter_metadata = assembled.get('metadata', metadatas[0] if metadatas else {})
            content = assembled.get('content', '')
            chunk_count = assembled.get('chunk_count', len(chunks))
            
            # Extract topics and learning objectives from the assembled content
            enhanced_metadata = StructuredDocumentProcessor.enhance_content_with_metadata(
                content,
                extract_topics=True,
                extract_objectives=True
            )
            
            topics = enhanced_metadata.get('topics', [])
            learning_objectives = enhanced_metadata.get('learning_objectives', [])
            
            logger.info(f"✅ Extracted chapter {chapter_number}: {len(content)} chars from {chunk_count} chunks")
            logger.info(f"📚 Extracted {len(topics)} topics and {len(learning_objectives)} learning objectives")
            
            return {
                'chapter_number': chapter_number,
                'content': content,
                'chunk_count': chunk_count,
                'metadata': chapter_metadata,
                'title': chapter_metadata.get('title', f'Chapter {chapter_number}'),
                'topics': topics,
                'learning_objectives': learning_objectives,
                'full_chapter': True
            }
        
        except Exception as e:
            logger.error(f"Error extracting chapter content: {e}")
            return None
    
    @classmethod
    def extract_full_section_content(
        cls,
        vector_store_path: str,
        collection_name: str,
        chapter_number: int,
        section_number: str,
        max_chars: int = 10000
    ) -> Optional[Dict]:
        """
        Extract complete content of a specific section within a chapter.
        
        Args:
            vector_store_path: Path to ChromaDB vector store
            collection_name: Name of the collection
            chapter_number: Chapter number
            section_number: Section number
            max_chars: Maximum characters to return
            
        Returns:
            Dict with section content and metadata
        """
        if not CHROMADB_AVAILABLE:
            logger.error("ChromaDB not available")
            return None
        
        try:
            client = chromadb.PersistentClient(
                path=vector_store_path,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            
            collection = client.get_collection(name=collection_name)
            
            # Query chunks with matching chapter and section
            results = collection.get(
                where={
                    "$and": [
                        {"chapter": {"$eq": str(chapter_number)}},
                        {"section": {"$eq": str(section_number)}}
                    ]
                },
                include=['documents', 'metadatas']
            )
            
            if not results or not results.get('documents'):
                logger.warning(f"No content found for chapter {chapter_number}, section {section_number}")
                return None
            
            chunks = results['documents']
            metadatas = results.get('metadatas', [])
            
            chunk_data = list(zip(chunks, metadatas))
            assembled = StructuredDocumentProcessor.assemble_chapter_content(
                chunk_data,
                max_chars=max_chars
            )
            
            section_metadata = assembled.get('metadata', metadatas[0] if metadatas else {})
            content = assembled.get('content', '')
            chunk_count = assembled.get('chunk_count', len(chunks))
            
            logger.info(f"✅ Extracted section {section_number} of chapter {chapter_number}: {len(content)} chars")
            
            return {
                'chapter_number': chapter_number,
                'section_number': section_number,
                'content': content,
                'chunk_count': chunk_count,
                'metadata': section_metadata
            }
        
        except Exception as e:
            logger.error(f"Error extracting section content: {e}")
            return None
    
    @classmethod
    def get_chapter_summary(
        cls,
        vector_store_path: str,
        collection_name: str,
        chapter_number: int
    ) -> Optional[Dict]:
        """
        Get summary information about a chapter.
        
        Args:
            vector_store_path: Path to ChromaDB vector store
            collection_name: Name of the collection
            chapter_number: Chapter number
            
        Returns:
            Dict with chapter summary
        """
        if not CHROMADB_AVAILABLE:
            return None
        
        try:
            client = chromadb.PersistentClient(
                path=vector_store_path,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            
            collection = client.get_collection(name=collection_name)
            
            results = collection.get(
                where={"chapter": {"$eq": str(chapter_number)}},
                include=['metadatas']
            )
            
            if not results or not results.get('metadatas'):
                return None
            
            metadatas = results['metadatas']
            chunk_count = len(metadatas)
            
            # Extract unique sections
            sections = set()
            for meta in metadatas:
                if meta.get('section'):
                    sections.add(meta['section'])
            
            # Get chapter title from first chunk
            title = metadatas[0].get('title', f'Chapter {chapter_number}')
            
            return {
                'chapter_number': chapter_number,
                'title': title,
                'chunk_count': chunk_count,
                'section_count': len(sections),
                'sections': sorted(list(sections))
            }
        
        except Exception as e:
            logger.error(f"Error getting chapter summary: {e}")
            return None
    
    @classmethod
    def extract_chapter_with_context(
        cls,
        vector_store_path: str,
        collection_name: str,
        chapter_number: int,
        query: str,
        max_chars: int = 12000
    ) -> Optional[Dict]:
        """
        Extract chapter content with query-relevant sections prioritized.
        
        Args:
            vector_store_path: Path to ChromaDB vector store
            collection_name: Name of the collection
            chapter_number: Chapter number
            query: User's query for relevance ranking
            max_chars: Maximum characters
            
        Returns:
            Dict with prioritized chapter content
        """
        if not CHROMADB_AVAILABLE:
            return None
        
        try:
            client = chromadb.PersistentClient(
                path=vector_store_path,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            
            collection = client.get_collection(name=collection_name)
            
            # First, get all chapter chunks
            all_results = collection.get(
                where={"chapter": {"$eq": str(chapter_number)}},
                include=['documents', 'metadatas']
            )
            
            if not all_results or not all_results.get('documents'):
                return None
            
            # Then, query for most relevant chunks
            query_results = collection.query(
                query_texts=[query],
                where={"chapter": {"$eq": str(chapter_number)}},
                n_results=min(10, len(all_results['documents']))
            )
            
            priority_chunks = tuple(query_results['documents'][0]) if query_results and query_results.get('documents') else tuple()
            chunk_data = list(zip(all_results['documents'], all_results.get('metadatas', [{}] * len(all_results['documents']))))
            assembled = StructuredDocumentProcessor.assemble_chapter_content(
                chunk_data,
                max_chars=max_chars,
                priority_texts=priority_chunks,
                keyword_hint=query
            )
            
            metadata = assembled.get('metadata', all_results['metadatas'][0] if all_results.get('metadatas') else {})
            content = assembled.get('content', '')
            chunk_count = assembled.get('chunk_count', 0)
            total_chunks = assembled.get('total_chunks', len(chunk_data))
            
            # Extract topics and learning objectives from the assembled content
            enhanced_metadata = StructuredDocumentProcessor.enhance_content_with_metadata(
                content,
                extract_topics=True,
                extract_objectives=True
            )
            
            topics = enhanced_metadata.get('topics', [])
            learning_objectives = enhanced_metadata.get('learning_objectives', [])
            
            logger.info(f"✅ Extracted chapter {chapter_number} with query context: {len(content)} chars")
            logger.info(f"📚 Extracted {len(topics)} topics and {len(learning_objectives)} learning objectives")
            
            return {
                'chapter_number': chapter_number,
                'content': content,
                'chunk_count': chunk_count,
                'total_chunks': total_chunks,
                'metadata': metadata,
                'title': metadata.get('title', f'Chapter {chapter_number}'),
                'topics': topics,
                'learning_objectives': learning_objectives,
                'prioritized': True,
                'full_chapter': True
            }
        
        except Exception as e:
            logger.error(f"Error extracting chapter with context: {e}")
            return None
