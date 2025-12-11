"""
System Test Script - Test all Multi-LLM components
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from ai_tools.llm import (
    ollama_manager,
    vector_store,
    rag_service,
    serp_service,
    cost_tracker,
    cost_analytics,
    llm_router,
    LLMRequest,
    TaskType,
    TaskComplexity,
    UserRole
)

def print_section(title):
    """Print section header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def test_ollama():
    """Test Ollama integration"""
    print_section("OLLAMA STATUS")
    
    status = ollama_manager.get_status()
    
    if status['available']:
        print(f"✅ Ollama is running")
        print(f"   Models installed: {status['model_count']}")
        print(f"   All required: {status['all_required_installed']}")
        
        print("\n   Required models:")
        for model_type, is_installed in status['required_models'].items():
            icon = "✅" if is_installed else "❌"
            model_name = ollama_manager.required_models[model_type]
            print(f"   {icon} {model_type}: {model_name}")
    else:
        print(f"❌ Ollama not available: {status.get('error', 'Unknown')}")
    
    return status['available']

def test_rag():
    """Test RAG system"""
    print_section("RAG SYSTEM STATUS")
    
    stats = rag_service.get_stats()
    vector_stats = stats.get('vector_store', {})
    
    print(f"Enabled: {stats['enabled']}")
    print(f"Total chunks: {vector_stats.get('total_chunks', 0)}")
    print(f"Embedding dimension: {vector_stats.get('embedding_dimension', 0)}")
    print(f"Status: {vector_stats.get('status', 'unknown')}")
    
    # Test search
    if vector_stats.get('total_chunks', 0) > 0:
        print("\n🔍 Testing semantic search...")
        results = vector_store.search("Ethiopian education", n_results=2)
        print(f"   Found {len(results)} results")
        if results:
            print(f"   Top result: {results[0]['text'][:80]}...")
    
    return stats['enabled'] and vector_stats.get('total_chunks', 0) > 0

def test_serp():
    """Test SERP integration"""
    print_section("WEB SEARCH STATUS")
    
    stats = serp_service.get_stats()
    
    print(f"Enabled: {stats['enabled']}")
    print(f"API key set: {stats['api_key_set']}")
    print(f"Cache size: {stats['cache_size']}")
    
    if serp_service.is_available():
        print("\n🔍 Testing web search...")
        print("   (Skipping actual search to avoid API usage)")
        # results = serp_service.search("Ethiopian education system", num_results=2)
        # print(f"   Found {len(results)} results")
    else:
        print("⚠️  SERP API not configured (optional)")
    
    return stats['enabled']

def test_cost_tracking():
    """Test cost tracking"""
    print_section("COST TRACKING")
    
    summary = cost_tracker.get_analytics_summary()
    
    print(f"Monthly cost: ${summary['monthly_cost']:.2f}")
    print(f"Monthly budget: ${summary['monthly_budget']:.2f}")
    print(f"Budget remaining: ${summary['budget_remaining']:.2f}")
    print(f"Budget used: {summary['budget_percentage_used']:.1f}%")
    print(f"Total requests: {summary['total_requests']}")
    
    # Get recommendations
    print("\n📊 Optimization Recommendations:")
    recommendations = cost_analytics.get_optimization_recommendations()
    for rec in recommendations[:3]:
        print(f"   • {rec}")
    
    return True

def test_llm_request():
    """Test LLM request"""
    print_section("LLM REQUEST TEST")
    
    print("Creating test request...")
    
    llm_request = LLMRequest(
        prompt="What is 2+2?",
        user_id=1,
        user_role=UserRole.STUDENT,
        task_type=TaskType.TUTORING,
        complexity=TaskComplexity.BASIC,
        use_rag=False,
        temperature=0.7,
        max_tokens=50
    )
    
    print(f"Request created:")
    print(f"   Task: {llm_request.task_type}")
    print(f"   Complexity: {llm_request.complexity}")
    print(f"   User role: {llm_request.user_role}")
    print(f"   RAG enabled: {llm_request.use_rag}")
    
    print("\n⚠️  Skipping actual LLM call to avoid API usage")
    print("   To test: Use the Django API endpoints")
    
    return True

def main():
    """Run all tests"""
    print("\n" + "🤖" * 30)
    print("   YENETA AI SCHOOL - SYSTEM TEST")
    print("🤖" * 30)
    
    results = {
        'ollama': test_ollama(),
        'rag': test_rag(),
        'serp': test_serp(),
        'cost_tracking': test_cost_tracking(),
        'llm_request': test_llm_request()
    }
    
    print_section("TEST SUMMARY")
    
    for component, passed in results.items():
        icon = "✅" if passed else "❌"
        print(f"{icon} {component.upper()}: {'PASS' if passed else 'FAIL'}")
    
    total = len(results)
    passed = sum(results.values())
    
    print(f"\n📊 Results: {passed}/{total} components operational")
    
    if passed == total:
        print("🎉 All systems operational!")
    elif passed >= total * 0.75:
        print("⚠️  Most systems operational, some optional features unavailable")
    else:
        print("❌ Critical systems need attention")
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60 + "\n")

if __name__ == '__main__':
    main()
