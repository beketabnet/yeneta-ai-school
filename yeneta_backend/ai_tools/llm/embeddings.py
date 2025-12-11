"""
Embeddings Service - Generate embeddings for RAG system
Supports multiple embedding models with fallback mechanisms.
"""

import os
import logging
from typing import List, Optional
import numpy as np

logger = logging.getLogger(__name__)

# Try to import embedding providers
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logger.warning("sentence-transformers not available. Install with: pip install sentence-transformers")

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    logger.warning("Ollama not available for embeddings")

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("Google Generative AI not available for embeddings")


class EmbeddingService:
    """
    Unified embedding service supporting multiple providers.
    Provides fallback mechanisms for offline scenarios.
    """
    
    def __init__(self):
        self.embedding_model = os.getenv('EMBEDDING_MODEL', 'sentence-transformers')
        self.sentence_transformer_model = os.getenv(
            'SENTENCE_TRANSFORMER_MODEL',
            'all-MiniLM-L6-v2'
        )
        self.ollama_embedding_model = os.getenv(
            'OLLAMA_EMBEDDING_MODEL',
            'mxbai-embed-large:latest'
        )
        
        self.model = None
        self._init_embedding_model()
        
        logger.info(f"EmbeddingService initialized with model: {self.embedding_model}")
    
    def _init_embedding_model(self):
        """Initialize the embedding model based on configuration"""
        
        # Try Sentence Transformers first (best for offline)
        if self.embedding_model == 'sentence-transformers' and SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.model = SentenceTransformer(self.sentence_transformer_model)
                logger.info(f"Loaded Sentence Transformer: {self.sentence_transformer_model}")
                return
            except Exception as e:
                logger.error(f"Failed to load Sentence Transformer: {e}")
        
        # Try Ollama embeddings
        if self.embedding_model == 'ollama' and OLLAMA_AVAILABLE:
            try:
                # Test Ollama connection
                ollama.list()
                logger.info(f"Using Ollama embeddings: {self.ollama_embedding_model}")
                return
            except Exception as e:
                logger.error(f"Failed to connect to Ollama: {e}")
        
        # Fallback to Sentence Transformers if available
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.model = SentenceTransformer(self.sentence_transformer_model)
                self.embedding_model = 'sentence-transformers'
                logger.info(f"Fallback to Sentence Transformer: {self.sentence_transformer_model}")
                return
            except Exception as e:
                logger.error(f"Failed to load fallback Sentence Transformer: {e}")
        
        logger.warning("No embedding model available! RAG will not work.")
    
    def embed_text(self, text: str) -> Optional[List[float]]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to embed
        
        Returns:
            List of floats representing the embedding, or None if failed
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for embedding")
            return None
        
        try:
            if self.embedding_model == 'sentence-transformers' and self.model:
                embedding = self.model.encode(text, convert_to_numpy=True)
                return embedding.tolist()
            
            elif self.embedding_model == 'ollama' and OLLAMA_AVAILABLE:
                response = ollama.embeddings(
                    model=self.ollama_embedding_model,
                    prompt=text
                )
                return response['embedding']
            
            elif self.embedding_model == 'gemini' and GENAI_AVAILABLE:
                # Gemini embeddings (if needed in future)
                result = genai.embed_content(
                    model='models/embedding-001',
                    content=text,
                    task_type='retrieval_document'
                )
                return result['embedding']
            
            else:
                logger.error("No embedding model available")
                return None
        
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            return None
    
    def embed_texts(self, texts: List[str]) -> List[Optional[List[float]]]:
        """
        Generate embeddings for multiple texts (batch processing).
        
        Args:
            texts: List of texts to embed
        
        Returns:
            List of embeddings (or None for failed embeddings)
        """
        if not texts:
            return []
        
        try:
            if self.embedding_model == 'sentence-transformers' and self.model:
                # Batch encoding is more efficient
                embeddings = self.model.encode(texts, convert_to_numpy=True)
                return [emb.tolist() for emb in embeddings]
            
            else:
                # Fall back to individual encoding
                return [self.embed_text(text) for text in texts]
        
        except Exception as e:
            logger.error(f"Batch embedding failed: {e}")
            # Fall back to individual encoding
            return [self.embed_text(text) for text in texts]
    
    def embed_query(self, query: str) -> Optional[List[float]]:
        """
        Generate embedding for a search query.
        
        Args:
            query: Search query text
        
        Returns:
            Query embedding
        """
        # For most models, query and document embeddings are the same
        # But some models (like Gemini) have different task types
        
        if self.embedding_model == 'gemini' and GENAI_AVAILABLE:
            try:
                result = genai.embed_content(
                    model='models/embedding-001',
                    content=query,
                    task_type='retrieval_query'
                )
                return result['embedding']
            except Exception as e:
                logger.error(f"Failed to generate query embedding: {e}")
                return None
        
        # Default: use same method as document embedding
        return self.embed_text(query)
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings produced by this model"""
        
        if self.embedding_model == 'sentence-transformers' and self.model:
            return self.model.get_sentence_embedding_dimension()
        
        elif self.embedding_model == 'ollama':
            # mxbai-embed-large produces 1024-dimensional embeddings
            return 1024
        
        elif self.embedding_model == 'gemini':
            # Gemini embedding-001 produces 768-dimensional embeddings
            return 768
        
        else:
            # Default fallback
            return 384
    
    def cosine_similarity(
        self,
        embedding1: List[float],
        embedding2: List[float]
    ) -> float:
        """
        Calculate cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding
            embedding2: Second embedding
        
        Returns:
            Cosine similarity score (0 to 1)
        """
        try:
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            return float(dot_product / (norm1 * norm2))
        
        except Exception as e:
            logger.error(f"Failed to calculate cosine similarity: {e}")
            return 0.0


# Singleton instance
embedding_service = EmbeddingService()
