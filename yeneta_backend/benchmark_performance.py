"""
Performance Benchmarking Script
Measures response times, throughput, and resource usage
"""

import os
import django
import time
from datetime import datetime
import statistics

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from ai_tools.llm import (
    vector_store,
    rag_service,
    embedding_service,
    cost_tracker,
    ollama_manager
)


class PerformanceBenchmark:
    """Performance benchmarking suite"""
    
    def __init__(self):
        self.results = {}
    
    def print_section(self, title):
        """Print section header"""
        print("\n" + "=" * 60)
        print(f"  {title}")
        print("=" * 60)
    
    def benchmark_function(self, name, func, iterations=10):
        """Benchmark a function"""
        print(f"\n⏱️  Benchmarking: {name}")
        print(f"   Iterations: {iterations}")
        
        times = []
        
        for i in range(iterations):
            start = time.time()
            try:
                func()
                elapsed = (time.time() - start) * 1000  # Convert to ms
                times.append(elapsed)
            except Exception as e:
                print(f"   ❌ Error in iteration {i+1}: {e}")
                continue
        
        if times:
            avg_time = statistics.mean(times)
            min_time = min(times)
            max_time = max(times)
            median_time = statistics.median(times)
            
            print(f"   ✅ Average: {avg_time:.2f}ms")
            print(f"   📊 Min: {min_time:.2f}ms, Max: {max_time:.2f}ms")
            print(f"   📈 Median: {median_time:.2f}ms")
            
            # Performance rating
            if avg_time < 100:
                rating = "🌟 Excellent"
            elif avg_time < 500:
                rating = "✅ Good"
            elif avg_time < 1000:
                rating = "⚠️  Acceptable"
            else:
                rating = "❌ Slow"
            
            print(f"   {rating}")
            
            self.results[name] = {
                'avg_ms': avg_time,
                'min_ms': min_time,
                'max_ms': max_time,
                'median_ms': median_time,
                'iterations': len(times)
            }
            
            return avg_time
        else:
            print(f"   ❌ All iterations failed")
            return None
    
    def benchmark_embedding_generation(self):
        """Benchmark embedding generation"""
        self.print_section("EMBEDDING GENERATION")
        
        # Single text
        def single_embed():
            embedding_service.embed_text("This is a test sentence for benchmarking.")
        
        self.benchmark_function("Single Text Embedding", single_embed, iterations=10)
        
        # Batch embeddings
        def batch_embed():
            texts = ["Test sentence " + str(i) for i in range(10)]
            embedding_service.embed_texts(texts)
        
        self.benchmark_function("Batch Embedding (10 texts)", batch_embed, iterations=5)
    
    def benchmark_vector_search(self):
        """Benchmark vector store search"""
        self.print_section("VECTOR STORE SEARCH")
        
        stats = vector_store.get_stats()
        total_chunks = stats.get('total_chunks', 0)
        
        if total_chunks == 0:
            print("⚠️  No chunks in vector store. Skipping search benchmark.")
            return
        
        print(f"   Vector store size: {total_chunks} chunks")
        
        # Simple search
        def simple_search():
            vector_store.search("Ethiopian education", n_results=5)
        
        self.benchmark_function("Simple Search (top 5)", simple_search, iterations=10)
        
        # Complex search with filter
        def filtered_search():
            vector_store.search(
                "curriculum standards",
                n_results=10,
                filter_metadata={'type': 'curriculum'}
            )
        
        self.benchmark_function("Filtered Search (top 10)", filtered_search, iterations=10)
    
    def benchmark_rag_retrieval(self):
        """Benchmark RAG context retrieval"""
        self.print_section("RAG CONTEXT RETRIEVAL")
        
        # Context retrieval
        def retrieve_context():
            rag_service.retrieve_context(
                query="Explain photosynthesis",
                filter_metadata=None
            )
        
        self.benchmark_function("RAG Context Retrieval", retrieve_context, iterations=10)
        
        # Prompt enhancement
        def enhance_prompt():
            context = rag_service.retrieve_context("Ethiopian education system")
            if context.documents:
                rag_service.enhance_prompt(
                    query="Explain the education system",
                    context=context
                )
        
        self.benchmark_function("RAG Prompt Enhancement", enhance_prompt, iterations=10)
    
    def benchmark_cost_tracking(self):
        """Benchmark cost tracking operations"""
        self.print_section("COST TRACKING")
        
        # Get analytics
        def get_analytics():
            cost_tracker.get_analytics_summary()
        
        self.benchmark_function("Get Analytics Summary", get_analytics, iterations=20)
        
        # Get daily costs
        def get_daily_costs():
            cost_tracker.get_daily_costs(30)
        
        self.benchmark_function("Get Daily Costs (30 days)", get_daily_costs, iterations=20)
    
    def benchmark_ollama_health(self):
        """Benchmark Ollama health checks"""
        self.print_section("OLLAMA HEALTH CHECKS")
        
        if not ollama_manager.is_available():
            print("⚠️  Ollama not available. Skipping health check benchmark.")
            return
        
        # Health check
        def health_check():
            ollama_manager.check_health(force=True)
        
        self.benchmark_function("Ollama Health Check", health_check, iterations=5)
        
        # Get status
        def get_status():
            ollama_manager.get_status()
        
        self.benchmark_function("Ollama Get Status", get_status, iterations=10)
    
    def generate_report(self):
        """Generate performance report"""
        self.print_section("PERFORMANCE REPORT")
        
        if not self.results:
            print("No benchmark results available.")
            return
        
        # Sort by average time
        sorted_results = sorted(
            self.results.items(),
            key=lambda x: x[1]['avg_ms']
        )
        
        print("\n📊 Performance Summary (sorted by speed):\n")
        
        for name, metrics in sorted_results:
            avg = metrics['avg_ms']
            
            # Performance indicator
            if avg < 100:
                indicator = "🌟"
            elif avg < 500:
                indicator = "✅"
            elif avg < 1000:
                indicator = "⚠️ "
            else:
                indicator = "❌"
            
            print(f"{indicator} {name}")
            print(f"   Average: {avg:.2f}ms | Median: {metrics['median_ms']:.2f}ms")
            print(f"   Range: {metrics['min_ms']:.2f}ms - {metrics['max_ms']:.2f}ms")
            print()
        
        # Overall assessment
        avg_times = [m['avg_ms'] for m in self.results.values()]
        overall_avg = statistics.mean(avg_times)
        
        print(f"📈 Overall Average: {overall_avg:.2f}ms")
        
        if overall_avg < 200:
            print("🌟 Excellent performance! System is highly optimized.")
        elif overall_avg < 500:
            print("✅ Good performance. System is production ready.")
        elif overall_avg < 1000:
            print("⚠️  Acceptable performance. Consider optimization.")
        else:
            print("❌ Performance needs improvement. Review slow operations.")
        
        # Recommendations
        print("\n💡 Recommendations:")
        
        slow_operations = [
            (name, metrics['avg_ms'])
            for name, metrics in self.results.items()
            if metrics['avg_ms'] > 1000
        ]
        
        if slow_operations:
            print("   • Optimize slow operations:")
            for name, avg_time in slow_operations:
                print(f"     - {name}: {avg_time:.2f}ms")
        
        fast_operations = [
            name for name, metrics in self.results.items()
            if metrics['avg_ms'] < 100
        ]
        
        if fast_operations:
            print(f"   • {len(fast_operations)} operations are highly optimized")
        
        if overall_avg < 500:
            print("   • Current performance is suitable for production")
            print("   • Can handle high concurrent load")
        
        print()
    
    def run_all_benchmarks(self):
        """Run all performance benchmarks"""
        print("\n" + "⏱️ " * 30)
        print("   PERFORMANCE BENCHMARKING")
        print("⏱️ " * 30)
        
        print(f"\nStarted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        start_time = time.time()
        
        # Run benchmarks
        self.benchmark_embedding_generation()
        self.benchmark_vector_search()
        self.benchmark_rag_retrieval()
        self.benchmark_cost_tracking()
        self.benchmark_ollama_health()
        
        # Generate report
        self.generate_report()
        
        # Total time
        total_time = time.time() - start_time
        
        print(f"\n⏱️  Total benchmark time: {total_time:.2f} seconds")
        print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        print("\n" + "=" * 60 + "\n")


def main():
    """Run performance benchmarks"""
    benchmark = PerformanceBenchmark()
    benchmark.run_all_benchmarks()


if __name__ == '__main__':
    main()
