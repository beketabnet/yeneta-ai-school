"""
Vector Store - ChromaDB-based vector database for RAG
Stores and retrieves document embeddings for semantic search.
"""

import os
import logging
from typing import List, Dict, Optional, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)

try:
    import chromadb
    from chromadb.config import Settings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    logger.warning("ChromaDB not available. Install with: pip install chromadb")

from .embeddings import embedding_service
from .document_processor import DocumentChunk


class VectorStore:
    """
    Vector database for storing and retrieving document embeddings.
    Uses ChromaDB for efficient similarity search.
    """
    
    def __init__(
        self,
        collection_name: str = "yeneta_curriculum",
        persist_directory: Optional[str] = None
    ):
        """
        Initialize vector store.
        
        Args:
            collection_name: Name of the collection
            persist_directory: Directory to persist the database
        """
        if not CHROMADB_AVAILABLE:
            logger.error("ChromaDB not available. Vector store will not work.")
            self.client = None
            self.collection = None
            return
        
        self.collection_name = collection_name
        
        # Set persist directory
        if persist_directory is None:
            persist_directory = os.getenv(
                'VECTOR_DB_PATH',
                './data/vector_db'
            )
        
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        
        # Initialize ChromaDB client
        try:
            self.client = chromadb.PersistentClient(
                path=str(self.persist_directory),
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name=collection_name,
                metadata={"description": "Ethiopian curriculum documents for RAG"}
            )
            
            logger.info(
                f"VectorStore initialized: {collection_name} "
                f"at {self.persist_directory}"
            )
        
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            self.client = None
            self.collection = None
    
    def add_documents(
        self,
        chunks: List[DocumentChunk],
        batch_size: int = 100
    ) -> int:
        """
        Add document chunks to the vector store.
        
        Args:
            chunks: List of DocumentChunk objects
            batch_size: Number of chunks to process at once
        
        Returns:
            Number of chunks successfully added
        """
        if not self.collection:
            logger.error("Vector store not initialized")
            return 0
        
        if not chunks:
            logger.warning("No chunks to add")
            return 0
        
        added_count = 0
        
        # Process in batches
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            
            try:
                # Extract texts
                texts = [chunk.text for chunk in batch]
                
                # Generate embeddings
                logger.info(f"Generating embeddings for batch {i//batch_size + 1}")
                embeddings = embedding_service.embed_texts(texts)
                
                # Filter out failed embeddings
                valid_items = [
                    (chunk, emb) for chunk, emb in zip(batch, embeddings)
                    if emb is not None
                ]
                
                if not valid_items:
                    logger.warning(f"No valid embeddings in batch {i//batch_size + 1}")
                    continue
                
                valid_chunks, valid_embeddings = zip(*valid_items)
                
                # Prepare data for ChromaDB
                ids = [chunk.chunk_id for chunk in valid_chunks]
                documents = [chunk.text for chunk in valid_chunks]
                metadatas = [chunk.metadata for chunk in valid_chunks]
                embeddings_list = list(valid_embeddings)  # Convert tuple to list
                
                # Add to collection
                self.collection.add(
                    ids=ids,
                    embeddings=embeddings_list,
                    documents=documents,
                    metadatas=metadatas
                )
                
                added_count += len(valid_chunks)
                logger.info(f"Added {len(valid_chunks)} chunks to vector store")
            
            except Exception as e:
                logger.error(f"Failed to add batch {i//batch_size + 1}: {e}")
        
        logger.info(f"Total chunks added: {added_count}/{len(chunks)}")
        return added_count
    
    def search(
        self,
        query: str,
        n_results: int = 5,
        filter_metadata: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Search for similar documents using semantic search.
        
        Args:
            query: Search query
            n_results: Number of results to return
            filter_metadata: Optional metadata filters (e.g., {'grade': 'Grade 7', 'subject': 'Math'})
        
        Returns:
            List of search results with text, metadata, and scores
        """
        if not self.collection:
            logger.error("Vector store not initialized")
            return []
        
        try:
            # Generate query embedding
            query_embedding = embedding_service.embed_query(query)
            
            if query_embedding is None:
                logger.error("Failed to generate query embedding")
                return []
            
            # Convert filter_metadata to ChromaDB where clause format
            where_clause = None
            if filter_metadata and len(filter_metadata) > 0:
                if len(filter_metadata) == 1:
                    # Single filter: {"field": {"$eq": "value"}}
                    key, value = list(filter_metadata.items())[0]
                    where_clause = {key: {"$eq": value}}
                else:
                    # Multiple filters: {"$and": [{"field1": {"$eq": "value1"}}, {"field2": {"$eq": "value2"}}]}
                    conditions = [{key: {"$eq": value}} for key, value in filter_metadata.items()]
                    where_clause = {"$and": conditions}
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_clause
            )
            
            # Format results
            formatted_results = []
            
            if results and results['documents']:
                for i in range(len(results['documents'][0])):
                    result = {
                        'text': results['documents'][0][i],
                        'metadata': results['metadatas'][0][i],
                        'distance': results['distances'][0][i],
                        'id': results['ids'][0][i]
                    }
                    formatted_results.append(result)
            
            logger.info(f"Search returned {len(formatted_results)} results")
            return formatted_results
        
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []
    
    def get_by_id(self, chunk_id: str) -> Optional[Dict]:
        """
        Get a specific chunk by ID.
        
        Args:
            chunk_id: Chunk ID
        
        Returns:
            Chunk data or None
        """
        if not self.collection:
            return None
        
        try:
            result = self.collection.get(ids=[chunk_id])
            
            if result and result['documents']:
                return {
                    'text': result['documents'][0],
                    'metadata': result['metadatas'][0],
                    'id': result['ids'][0]
                }
            
            return None
        
        except Exception as e:
            logger.error(f"Failed to get chunk {chunk_id}: {e}")
            return None
    
    def delete_by_source(self, source: str) -> int:
        """
        Delete all chunks from a specific source.
        
        Args:
            source: Source file path
        
        Returns:
            Number of chunks deleted
        """
        if not self.collection:
            return 0
        
        try:
            # Get all chunks from this source
            results = self.collection.get(
                where={"source": source}
            )
            
            if results and results['ids']:
                self.collection.delete(ids=results['ids'])
                logger.info(f"Deleted {len(results['ids'])} chunks from {source}")
                return len(results['ids'])
            
            return 0
        
        except Exception as e:
            logger.error(f"Failed to delete chunks from {source}: {e}")
            return 0
    
    def clear_collection(self):
        """Clear all data from the collection"""
        if not self.collection:
            return
        
        try:
            # Delete the collection and recreate it
            self.client.delete_collection(self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "Ethiopian curriculum documents for RAG"}
            )
            logger.info(f"Cleared collection: {self.collection_name}")
        
        except Exception as e:
            logger.error(f"Failed to clear collection: {e}")
    
    def get_stats(self) -> Dict:
        """Get statistics about the vector store"""
        if not self.collection:
            return {
                'total_chunks': 0,
                'collection_name': self.collection_name,
                'status': 'not_initialized'
            }
        
        try:
            count = self.collection.count()
            
            return {
                'total_chunks': count,
                'collection_name': self.collection_name,
                'persist_directory': str(self.persist_directory),
                'embedding_dimension': embedding_service.get_embedding_dimension(),
                'status': 'active'
            }
        
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {
                'total_chunks': 0,
                'collection_name': self.collection_name,
                'status': 'error',
                'error': str(e)
            }
    
    def index_directory(
        self,
        directory_path: str,
        recursive: bool = True,
        clear_existing: bool = False
    ) -> Dict:
        """
        Index all documents in a directory.
        
        Args:
            directory_path: Path to directory
            recursive: Process subdirectories
            clear_existing: Clear existing data before indexing
        
        Returns:
            Indexing statistics
        """
        from .document_processor import document_processor
        
        if clear_existing:
            self.clear_collection()
        
        # Process documents
        logger.info(f"Processing documents from {directory_path}")
        chunks = document_processor.process_directory(directory_path, recursive)
        
        if not chunks:
            logger.warning("No chunks generated from directory")
            return {
                'files_processed': 0,
                'chunks_generated': 0,
                'chunks_indexed': 0,
                'status': 'no_documents'
            }
        
        # Add to vector store
        logger.info(f"Indexing {len(chunks)} chunks")
        indexed_count = self.add_documents(chunks)
        
        # Get unique sources
        sources = set(chunk.source for chunk in chunks)
        
        return {
            'files_processed': len(sources),
            'chunks_generated': len(chunks),
            'chunks_indexed': indexed_count,
            'status': 'success'
        }


# Singleton instance
vector_store = VectorStore(
    collection_name=os.getenv('VECTOR_DB_COLLECTION', 'yeneta_curriculum'),
    persist_directory=os.getenv('VECTOR_DB_PATH', './data/vector_db')
)
