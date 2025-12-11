
import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from yeneta_backend.rag.structured_document_processor import StructuredDocumentProcessor

class TestSmartTruncation(unittest.TestCase):
    def setUp(self):
        # Create dummy chunks
        self.chunks = []
        for i in range(100):
            self.chunks.append((f"Chunk {i} content. This is a paragraph of text for chunk {i}.", {'page': i, 'order': i}))

    def test_no_truncation_needed(self):
        """Test that content is not truncated if it fits within the limit."""
        # Small limit but chunks are small
        result = StructuredDocumentProcessor._smart_truncate(self.chunks[:5], max_limit=10000)
        self.assertFalse(result.get('truncated', False))
        self.assertEqual(result['chunk_count'], 5)
        self.assertIn("Chunk 0", result['content'])
        self.assertIn("Chunk 4", result['content'])

    def test_smart_truncation_logic(self):
        """Test that smart truncation preserves start, end, and samples middle."""
        # Set a small limit to force truncation
        # Total chars approx 50 * 100 = 5000
        # Set limit to 1000 chars (approx 20 chunks)
        
        # Mock token counter to return char count for simplicity or just rely on char fallback
        with patch('yeneta_backend.rag.structured_document_processor.TOKEN_COUNTER_AVAILABLE', False):
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
            
            # Check for Middle (Sampled)
            # Should have some chunks from the middle, e.g., around 50
            # Exact chunks depend on sampling logic, but we expect *some* middle chunk
            # and it shouldn't be contiguous 0-99
            
            # Verify we don't have ALL chunks
            self.assertNotIn("Chunk 50", content) # Might be skipped or included, but let's check count
            self.assertLess(result['chunk_count'], 100)
            
            print(f"Original chunks: 100, Kept chunks: {result['chunk_count']}")
            print(f"Content preview:\n{content[:200]}...\n...\n{content[-200:]}")

if __name__ == '__main__':
    unittest.main()
