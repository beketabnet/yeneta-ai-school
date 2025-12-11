"""
SERP Service - Web Search Integration
Provides web search capabilities using SERP API for real-time information.
"""

import os
import logging
import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class SERPService:
    """
    Web search service using SERP API.
    Provides real-time web search for AI responses.
    """
    
    def __init__(self):
        self.api_key = os.getenv('SERP_API_KEY', '')
        self.base_url = 'https://serpapi.com/search'
        self.enabled = bool(self.api_key) and os.getenv('ENABLE_WEB_SEARCH', 'True') == 'True'
        self.max_results = int(os.getenv('SERP_MAX_RESULTS', 5))
        self.timeout = int(os.getenv('SERP_TIMEOUT', 10))
        
        # Cache for search results (simple in-memory cache)
        self._cache = {}
        self._cache_ttl = timedelta(hours=1)
        
        logger.info(
            f"SERPService initialized: enabled={self.enabled}, "
            f"max_results={self.max_results}"
        )
    
    def is_available(self) -> bool:
        """Check if SERP service is available"""
        return self.enabled and bool(self.api_key)
    
    def search(
        self,
        query: str,
        num_results: Optional[int] = None,
        search_type: str = 'general'
    ) -> List[Dict]:
        """
        Perform web search.
        
        Args:
            query: Search query
            num_results: Number of results (default: max_results)
            search_type: Type of search (general, news, scholar)
        
        Returns:
            List of search result dictionaries
        """
        if not self.is_available():
            logger.warning("SERP service not available")
            return []
        
        # Check cache
        cache_key = f"{query}_{search_type}_{num_results}"
        if cache_key in self._cache:
            cached_result, cached_time = self._cache[cache_key]
            if datetime.now() - cached_time < self._cache_ttl:
                logger.info(f"Returning cached results for: {query}")
                return cached_result
        
        num_results = num_results or self.max_results
        
        try:
            params = {
                'api_key': self.api_key,
                'q': query,
                'num': num_results,
                'engine': 'google'
            }
            
            # Add search type specific parameters
            if search_type == 'news':
                params['tbm'] = 'nws'
            elif search_type == 'scholar':
                params['engine'] = 'google_scholar'
            
            response = requests.get(
                self.base_url,
                params=params,
                timeout=self.timeout
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Parse results
            results = self._parse_results(data, search_type)
            
            # Cache results
            self._cache[cache_key] = (results, datetime.now())
            
            logger.info(f"Found {len(results)} results for: {query}")
            return results
        
        except requests.exceptions.Timeout:
            logger.error(f"SERP API timeout for query: {query}")
            return []
        
        except requests.exceptions.RequestException as e:
            logger.error(f"SERP API error: {e}")
            return []
        
        except Exception as e:
            logger.error(f"Unexpected error in SERP search: {e}")
            return []
    
    def _parse_results(self, data: Dict, search_type: str) -> List[Dict]:
        """
        Parse SERP API response.
        
        Args:
            data: API response data
            search_type: Type of search
        
        Returns:
            List of parsed results
        """
        results = []
        
        if search_type == 'scholar':
            # Parse scholar results
            for item in data.get('organic_results', []):
                results.append({
                    'title': item.get('title', ''),
                    'snippet': item.get('snippet', ''),
                    'link': item.get('link', ''),
                    'publication_info': item.get('publication_info', {}),
                    'cited_by': item.get('inline_links', {}).get('cited_by', {}).get('total', 0),
                    'type': 'scholar'
                })
        
        elif search_type == 'news':
            # Parse news results
            for item in data.get('news_results', []):
                results.append({
                    'title': item.get('title', ''),
                    'snippet': item.get('snippet', ''),
                    'link': item.get('link', ''),
                    'source': item.get('source', ''),
                    'date': item.get('date', ''),
                    'type': 'news'
                })
        
        else:
            # Parse general results
            for item in data.get('organic_results', []):
                results.append({
                    'title': item.get('title', ''),
                    'snippet': item.get('snippet', ''),
                    'link': item.get('link', ''),
                    'displayed_link': item.get('displayed_link', ''),
                    'type': 'general'
                })
            
            # Add knowledge graph if available
            if 'knowledge_graph' in data:
                kg = data['knowledge_graph']
                results.insert(0, {
                    'title': kg.get('title', ''),
                    'snippet': kg.get('description', ''),
                    'link': kg.get('website', ''),
                    'type': 'knowledge_graph'
                })
        
        return results
    
    def search_for_context(
        self,
        query: str,
        max_chars: int = 2000
    ) -> str:
        """
        Search and format results as context for LLM.
        
        Args:
            query: Search query
            max_chars: Maximum characters for context
        
        Returns:
            Formatted context string
        """
        results = self.search(query, num_results=3)
        
        if not results:
            return ""
        
        context_parts = ["Web Search Results:\n"]
        current_length = len(context_parts[0])
        
        for i, result in enumerate(results, 1):
            result_text = (
                f"\n[{i}] {result['title']}\n"
                f"{result['snippet']}\n"
                f"Source: {result['link']}\n"
            )
            
            if current_length + len(result_text) > max_chars:
                break
            
            context_parts.append(result_text)
            current_length += len(result_text)
        
        return ''.join(context_parts)
    
    def search_ethiopian_education(self, query: str) -> List[Dict]:
        """
        Search specifically for Ethiopian education content.
        
        Args:
            query: Search query
        
        Returns:
            List of relevant results
        """
        # Enhance query with Ethiopian context
        enhanced_query = f"{query} Ethiopian education curriculum"
        
        return self.search(enhanced_query, num_results=5)
    
    def search_teaching_resources(self, topic: str, grade: Optional[str] = None) -> List[Dict]:
        """
        Search for teaching resources.
        
        Args:
            topic: Topic to search for
            grade: Optional grade level
        
        Returns:
            List of teaching resources
        """
        query = f"teaching resources {topic}"
        if grade:
            query += f" grade {grade}"
        
        query += " lesson plans activities"
        
        return self.search(query, num_results=5)
    
    def get_latest_news(self, topic: str, limit: int = 5) -> List[Dict]:
        """
        Get latest news on a topic.
        
        Args:
            topic: Topic to search for
            limit: Number of results
        
        Returns:
            List of news articles
        """
        return self.search(topic, num_results=limit, search_type='news')
    
    def search_academic(self, query: str, limit: int = 5) -> List[Dict]:
        """
        Search academic/scholarly content.
        
        Args:
            query: Search query
            limit: Number of results
        
        Returns:
            List of academic results
        """
        return self.search(query, num_results=limit, search_type='scholar')
    
    def clear_cache(self):
        """Clear search cache"""
        self._cache.clear()
        logger.info("SERP cache cleared")
    
    def get_stats(self) -> Dict:
        """Get SERP service statistics"""
        return {
            'enabled': self.enabled,
            'api_key_set': bool(self.api_key),
            'max_results': self.max_results,
            'cache_size': len(self._cache),
            'timeout': self.timeout
        }


# Singleton instance
serp_service = SERPService()
