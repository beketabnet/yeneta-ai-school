"""
RAG Service - Retrieval-Augmented Generation
Combines semantic search with LLM generation for accurate, context-aware responses.
"""

import os
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass

from .vector_store import vector_store
from .token_counter import token_counter
from .models import LLMModel

logger = logging.getLogger(__name__)


@dataclass
class RAGContext:
    """Context retrieved from RAG system"""
    documents: List[str]
    sources: List[str]
    relevance_scores: List[float]
    total_tokens: int


class RAGService:
    """
    Retrieval-Augmented Generation service.
    Retrieves relevant context and enhances prompts for better LLM responses.
    """
    
    def __init__(self):
        self.enabled = os.getenv('ENABLE_RAG', 'True') == 'True'
        self.top_k = int(os.getenv('RAG_TOP_K', 5))
        self.max_context_tokens = int(os.getenv('RAG_MAX_CONTEXT_TOKENS', 2000))
        self.relevance_threshold = float(os.getenv('RAG_RELEVANCE_THRESHOLD', 0.5))
        
        logger.info(
            f"RAGService initialized: enabled={self.enabled}, "
            f"top_k={self.top_k}, max_tokens={self.max_context_tokens}"
        )
    
    def retrieve_context(
        self,
        query: str,
        filter_metadata: Optional[Dict] = None,
        model: Optional[LLMModel] = None
    ) -> RAGContext:
        """
        Retrieve relevant context for a query.
        
        Args:
            query: User query
            filter_metadata: Optional metadata filters
            model: LLM model for token counting
        
        Returns:
            RAGContext with retrieved documents
        """
        if not self.enabled:
            logger.info("RAG is disabled")
            return RAGContext(
                documents=[],
                sources=[],
                relevance_scores=[],
                total_tokens=0
            )
        
        try:
            # Search vector store
            results = vector_store.search(
                query=query,
                n_results=self.top_k,
                filter_metadata=filter_metadata
            )
            
            if not results:
                logger.info("No relevant documents found")
                return RAGContext(
                    documents=[],
                    sources=[],
                    relevance_scores=[],
                    total_tokens=0
                )
            
            # Filter by relevance threshold (distance < threshold means more similar)
            filtered_results = [
                r for r in results
                if (1 - r['distance']) >= self.relevance_threshold
            ]
            
            if not filtered_results:
                logger.info("No documents meet relevance threshold")
                return RAGContext(
                    documents=[],
                    sources=[],
                    relevance_scores=[],
                    total_tokens=0
                )
            
            # Extract documents and fit within token budget
            documents = []
            sources = []
            scores = []
            total_tokens = 0
            
            for result in filtered_results:
                doc_text = result['text']
                doc_tokens = token_counter.count_tokens(doc_text, model)
                
                # Check if adding this document exceeds token budget
                if total_tokens + doc_tokens > self.max_context_tokens:
                    # Try to truncate the document
                    remaining_tokens = self.max_context_tokens - total_tokens
                    if remaining_tokens > 100:  # Only add if meaningful
                        doc_text = token_counter.truncate_text(
                            doc_text,
                            remaining_tokens,
                            model
                        )
                        doc_tokens = token_counter.count_tokens(doc_text, model)
                        documents.append(doc_text)
                        sources.append(result['metadata'].get('source', 'unknown'))
                        scores.append(1 - result['distance'])
                        total_tokens += doc_tokens
                    break
                
                documents.append(doc_text)
                sources.append(result['metadata'].get('source', 'unknown'))
                scores.append(1 - result['distance'])
                total_tokens += doc_tokens
            
            logger.info(
                f"Retrieved {len(documents)} documents, "
                f"{total_tokens} tokens, "
                f"avg relevance: {sum(scores)/len(scores):.2f}"
            )
            
            return RAGContext(
                documents=documents,
                sources=sources,
                relevance_scores=scores,
                total_tokens=total_tokens
            )
        
        except Exception as e:
            logger.error(f"RAG retrieval failed: {e}")
            return RAGContext(
                documents=[],
                sources=[],
                relevance_scores=[],
                total_tokens=0
            )
    
    def enhance_prompt(
        self,
        query: str,
        context: RAGContext,
        system_prompt: Optional[str] = None
    ) -> tuple[str, str]:
        """
        Enhance prompt with retrieved context.
        
        Args:
            query: Original user query
            context: Retrieved RAG context
            system_prompt: Optional system prompt
        
        Returns:
            Tuple of (enhanced_system_prompt, enhanced_query)
        """
        if not context.documents:
            # No context, return original
            return system_prompt or "", query
        
        # Build context section
        context_text = "\n\n".join([
            f"[Source {i+1}]: {doc}"
            for i, doc in enumerate(context.documents)
        ])
        
        # Enhance system prompt
        enhanced_system = system_prompt or ""
        if enhanced_system:
            enhanced_system += "\n\n"
        
        enhanced_system += (
            "You have access to the following relevant curriculum documents. "
            "Use this information to provide accurate, curriculum-aligned responses. "
            "Always cite sources when using information from these documents.\n\n"
            f"CONTEXT:\n{context_text}"
        )
        
        # Enhance query
        enhanced_query = (
            f"{query}\n\n"
            f"Please answer based on the provided curriculum context above."
        )
        
        return enhanced_system, enhanced_query
    
    def get_context_for_task(
        self,
        query: str,
        task_type: str,
        grade_level: Optional[str] = None,
        subject: Optional[str] = None,
        model: Optional[LLMModel] = None
    ) -> RAGContext:
        """
        Get context with task-specific filtering.
        
        Args:
            query: User query
            task_type: Type of task (tutoring, lesson_planning, etc.)
            grade_level: Optional grade level filter
            subject: Optional subject filter
            model: LLM model for token counting
        
        Returns:
            RAGContext with filtered results
        """
        # Build metadata filter
        filter_metadata = {}
        
        if grade_level:
            filter_metadata['grade_level'] = grade_level
        
        if subject:
            filter_metadata['subject'] = subject
        
        # Retrieve context
        return self.retrieve_context(
            query=query,
            filter_metadata=filter_metadata if filter_metadata else None,
            model=model
        )
    
    def estimate_token_savings(
        self,
        original_prompt: str,
        enhanced_prompt: str,
        model: Optional[LLMModel] = None
    ) -> Dict:
        """
        Estimate token savings from using RAG.
        
        Args:
            original_prompt: Original prompt without RAG
            enhanced_prompt: Enhanced prompt with RAG context
            model: LLM model for token counting
        
        Returns:
            Dictionary with token statistics
        """
        original_tokens = token_counter.count_tokens(original_prompt, model)
        enhanced_tokens = token_counter.count_tokens(enhanced_prompt, model)
        
        # RAG typically reduces output tokens by 60-80% due to more focused responses
        estimated_output_reduction = 0.7
        
        return {
            'original_input_tokens': original_tokens,
            'enhanced_input_tokens': enhanced_tokens,
            'input_token_increase': enhanced_tokens - original_tokens,
            'estimated_output_reduction': estimated_output_reduction,
            'net_token_savings': int(original_tokens * 0.5 * estimated_output_reduction)
        }
    
    def format_sources(self, context: RAGContext) -> str:
        """
        Format sources for citation.
        
        Args:
            context: RAG context with sources
        
        Returns:
            Formatted source citations
        """
        if not context.sources:
            return ""
        
        unique_sources = list(set(context.sources))
        
        citations = "\n\nSources:\n"
        for i, source in enumerate(unique_sources, 1):
            # Extract filename from path
            filename = source.split('/')[-1].split('\\')[-1]
            citations += f"{i}. {filename}\n"
        
        return citations
    
    def get_stats(self) -> Dict:
        """Get RAG service statistics"""
        vector_stats = vector_store.get_stats()
        
        return {
            'enabled': self.enabled,
            'top_k': self.top_k,
            'max_context_tokens': self.max_context_tokens,
            'relevance_threshold': self.relevance_threshold,
            'vector_store': vector_stats
        }


# Singleton instance
rag_service = RAGService()
