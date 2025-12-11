
import unittest
import logging
from typing import Sequence, Tuple, Dict, List, Optional

# Mock logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mock token counter availability
TOKEN_COUNTER_AVAILABLE = False

class StructuredDocumentProcessor:
    """
    Standalone version of the class for testing logic.
    """
    
    @classmethod
    def _smart_truncate(
        cls,
        chunk_data: Sequence[Tuple[str, Dict]],
        max_limit: int
    ) -> Dict[str, any]:
        """
        Smartly truncate content to fit limit while preserving structure.
        Strategy: Keep Start (Intro) + End (Summary) + Distributed Middle.
        """
        # Sort chunks by index/order to maintain narrative flow
        sorted_chunks = sorted(chunk_data, key=lambda x: (
            int(x[1].get('page', 0)) if x[1].get('page') else 0,
            int(x[1].get('order', 0)) if x[1].get('order') else 0,
            x[0][:20] # Fallback to text content
        ))
        
        chunks_text = [c[0] for c in sorted_chunks]
        full_text = "\n\n".join(chunks_text)
        
        # Check if we need truncation
        current_size = 0
        if TOKEN_COUNTER_AVAILABLE:
            # Mock token count
            current_size = len(full_text) // 4
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
            
        logger.info(f"⚠️ Content exceeds limit ({current_size} > {limit_val}). Applying smart truncation.")
        
        num_chunks = len(sorted_chunks)
        
        # Keep first 10% and last 10% (min 2 chunks each)
        start_idx = max(2, int(num_chunks * 0.10))
        end_idx = min(num_chunks - 2, int(num_chunks * 0.90))
        
        # Ensure indices make sense
        if start_idx >= end_idx:
            return {
                'content': full_text[:int(max_limit*4)] if not TOKEN_COUNTER_AVAILABLE else full_text,
                'chunk_count': len(sorted_chunks),
                'total_chunks': len(sorted_chunks),
                'metadata': sorted_chunks[0][1] if sorted_chunks else {},
                'truncated': True
            }

        final_chunks = []
        
        # 1. Add Start Chunks
        final_chunks.extend(sorted_chunks[:start_idx])
        
        # 2. Add Middle Chunks (Sampled)
        middle_candidates = sorted_chunks[start_idx:end_idx]
        
        if middle_candidates:
            # Simple sampling: take every Nth chunk
            step = max(2, int(len(middle_candidates) / (len(middle_candidates) * 0.5)))
            
            # Add marker before middle section
            final_chunks.append(("[...Content Truncated...]", {}))
            
            for i in range(0, len(middle_candidates), step):
                final_chunks.append(middle_candidates[i])
                
        # 3. Add End Chunks
        # Add marker before end section
        final_chunks.append(("[...Content Truncated...]", {}))
        final_chunks.extend(sorted_chunks[end_idx:])
        
        # Reassemble
        selected_texts = [c[0] for c in final_chunks]
        assembled_content = "\n\n".join(selected_texts)
        
        return {
            'content': assembled_content,
            'chunk_count': len(final_chunks),
            'total_chunks': num_chunks,
            'metadata': sorted_chunks[0][1] if sorted_chunks else {},
            'truncated': True
        }

class TestSmartTruncationStandalone(unittest.TestCase):
    def setUp(self):
        # Create dummy chunks
        self.chunks = []
        for i in range(100):
            self.chunks.append((f"Chunk {i} content. This is a paragraph of text for chunk {i}.", {'page': i, 'order': i}))

    def test_no_truncation_needed(self):
        """Test that content is not truncated if it fits within the limit."""
        result = StructuredDocumentProcessor._smart_truncate(self.chunks[:5], max_limit=10000)
        self.assertFalse(result.get('truncated', False))
        self.assertEqual(result['chunk_count'], 5)

    def test_smart_truncation_logic(self):
        """Test that smart truncation preserves start, end, and samples middle."""
        # Set a small limit to force truncation
        result = StructuredDocumentProcessor._smart_truncate(self.chunks, max_limit=1000)
        
        self.assertTrue(result['truncated'])
        content = result['content']
        
        # Check for markers
        self.assertIn("[...Content Truncated...]", content)
        
        # Check for Start (Intro)
        self.assertIn("Chunk 0", content)
        self.assertIn("Chunk 1", content)
        
        # Check for End (Summary)
        self.assertIn("Chunk 99", content)
        self.assertIn("Chunk 98", content)
        
        # Check that we have fewer chunks than total
        self.assertLess(result['chunk_count'], 100)
        
        print(f"\nOriginal chunks: 100, Kept chunks: {result['chunk_count']}")

if __name__ == '__main__':
    unittest.main()
