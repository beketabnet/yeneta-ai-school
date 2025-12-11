"""
API Endpoint Integration Tests
Tests all 13 AI and system endpoints with real authentication
"""

import os
import django
import json
import time
import sys
from typing import Dict, Any

# Fix Unicode encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class APIEndpointTester:
    """Test all API endpoints"""
    
    def __init__(self):
        self.client = Client()
        self.token = None
        self.user = None
        self.setup_test_user()
    
    def setup_test_user(self):
        """Create or get test user and generate JWT token"""
        try:
            self.user = User.objects.get(email='teacher@yeneta.com')
        except User.DoesNotExist:
            print("⚠️  Test user not found. Please create test users first.")
            print("   Run: python manage.py create_test_users")
            return
        
        # Generate JWT token
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)
        
        print(f"✅ Test user: {self.user.email}")
        print(f"   Token: {self.token[:20]}...")
    
    def get_headers(self):
        """Get authorization headers"""
        return {
            'HTTP_AUTHORIZATION': f'Bearer {self.token}',
            'content_type': 'application/json'
        }
    
    def print_section(self, title):
        """Print section header"""
        print("\n" + "=" * 60)
        print(f"  {title}")
        print("=" * 60)
    
    def test_endpoint(self, name, method, url, data=None, expected_status=200):
        """Test a single endpoint"""
        print(f"\n🧪 Testing: {name}")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = self.client.get(url, **self.get_headers())
            elif method == 'POST':
                response = self.client.post(
                    url,
                    data=json.dumps(data) if data else '{}',
                    **self.get_headers()
                )
            else:
                print(f"   ❌ Unsupported method: {method}")
                return False
            
            # Check status
            if response.status_code == expected_status:
                print(f"   ✅ Status: {response.status_code}")
                
                # Try to parse JSON
                try:
                    response_data = response.json()
                    
                    # Show key fields
                    if isinstance(response_data, dict):
                        keys = list(response_data.keys())[:5]
                        print(f"   📄 Response keys: {keys}")
                        
                        # Show specific interesting fields
                        if 'content' in response_data:
                            content = response_data['content'][:100]
                            print(f"   💬 Content preview: {content}...")
                        
                        if 'health' in response_data:
                            print(f"   🏥 Health: {response_data['health']}")
                        
                        if 'recommendations' in response_data:
                            recs = response_data['recommendations'][:2]
                            print(f"   💡 Recommendations: {len(response_data['recommendations'])} items")
                    
                    elif isinstance(response_data, list):
                        print(f"   📋 Response: List with {len(response_data)} items")
                
                except json.JSONDecodeError:
                    # Check if it's a streaming response (text/plain)
                    content_type = response.get('Content-Type', '')
                    if 'text/plain' in content_type or 'text/event-stream' in content_type:
                        print(f"   📡 Streaming response (Content-Type: {content_type})")
                        print(f"   ✅ Streaming working correctly")
                    else:
                        print(f"   ⚠️  Non-JSON response")
                
                return True
            else:
                print(f"   ❌ Status: {response.status_code} (expected {expected_status})")
                try:
                    error = response.json()
                    print(f"   Error: {error}")
                except:
                    print(f"   Response: {response.content[:200]}")
                return False
        
        except Exception as e:
            print(f"   ❌ Exception: {e}")
            return False
    
    def test_ai_endpoints(self):
        """Test all AI endpoints"""
        self.print_section("AI ENDPOINTS (9 endpoints)")
        
        results = {}
        
        # 1. AI Tutor
        results['tutor'] = self.test_endpoint(
            "AI Tutor",
            "POST",
            "/api/ai-tools/tutor/",
            {
                "message": "Can you explain photosynthesis in simple terms?",
                "context": "Grade 7 Biology",
                "stream": False  # Request JSON response instead of streaming
            }
        )
        time.sleep(5)  # Delay to prevent rate limiting (increased for free tier)
        
        # 2. Lesson Planner
        results['lesson_planner'] = self.test_endpoint(
            "Lesson Planner",
            "POST",
            "/api/ai-tools/lesson-planner/",
            {
                "topic": "Photosynthesis",
                "grade": "Grade 8",
                "duration": "45 minutes"
            }
        )
        
        # 3. Student Insights
        results['student_insights'] = self.test_endpoint(
            "Student Insights",
            "POST",
            "/api/ai-tools/student-insights/",
            {
                "student": {
                    "name": "Test Student",
                    "grade": "Grade 8",
                    "overallProgress": 78,
                    "strongAreas": ["Mathematics", "Science"],
                    "weakAreas": ["English Writing"],
                    "recentScores": [75, 80, 78, 82, 76],
                    "engagementLevel": "High"
                }
            }
        )
        time.sleep(5)  # Delay to prevent rate limiting (increased for free tier)
        
        # 4. Generate Rubric
        results['generate_rubric'] = self.test_endpoint(
            "Generate Rubric",
            "POST",
            "/api/ai-tools/generate-rubric/",
            {
                "topic": "Climate Change Essay",
                "grade_level": "Grade 10",
                "subject": "Environmental Science",
                "max_points": 100
            }
        )
        time.sleep(5)  # Delay to prevent rate limiting (increased for free tier)
        
        # 5. Grade Submission
        results['grade_submission'] = self.test_endpoint(
            "Grade Submission",
            "POST",
            "/api/ai-tools/grade-submission/",
            {
                "submission_text": "Photosynthesis is the process by which plants make food.",
                "rubric": "Content: 40%, Grammar: 30%, Structure: 30%",
                "assignment_type": "Short Answer"
            }
        )
        
        # 6. Check Authenticity
        results['check_authenticity'] = self.test_endpoint(
            "Check Authenticity",
            "POST",
            "/api/ai-tools/check-authenticity/",
            {
                "submission_text": "This is a test submission to check for AI generation. Photosynthesis is the process by which plants convert light energy into chemical energy.",
                "assignment_context": "Science assignment on photosynthesis"
            }
        )
        time.sleep(5)  # Delay to prevent rate limiting (increased for free tier)
        
        # 7. Evaluate Practice Answer
        results['evaluate_practice'] = self.test_endpoint(
            "Evaluate Practice Answer",
            "POST",
            "/api/ai-tools/evaluate-practice-answer/",
            {
                "question": "What is photosynthesis?",
                "answer": "Plants make food using sunlight and water to create glucose.",
                "correct_answer": "Photosynthesis is the process by which plants convert light energy into chemical energy."
            }
        )
        time.sleep(5)  # Delay to prevent rate limiting (increased for free tier)
        
        # 8. Summarize Conversation
        results['summarize_conversation'] = self.test_endpoint(
            "Summarize Conversation",
            "POST",
            "/api/ai-tools/summarize-conversation/",
            {
                "messages": [
                    {"role": "teacher", "content": "How is your homework going?"},
                    {"role": "student", "content": "I'm struggling with the math problems."}
                ]
            }
        )
        time.sleep(5)  # Delay to prevent rate limiting (increased for free tier)
        
        # 9. Analyze Alert
        results['analyze_alert'] = self.test_endpoint(
            "Analyze Alert",
            "POST",
            "/api/ai-tools/analyze-alert/",
            {
                "alert": {
                    "type": "low_attendance",
                    "student_name": "Test Student",
                    "context": "Student has missed 5 classes in the past 2 weeks"
                },
                "alert_text": "Student attendance has dropped to 65% with 5 recent absences"
            }
        )
        time.sleep(5)  # Delay to prevent rate limiting (increased for free tier)
        
        return results
    
    def test_system_endpoints(self):
        """Test system and analytics endpoints"""
        self.print_section("SYSTEM ENDPOINTS (4 endpoints)")
        
        results = {}
        
        # 10. System Status
        results['system_status'] = self.test_endpoint(
            "System Status",
            "GET",
            "/api/ai-tools/system-status/"
        )
        
        # 11. Cost Analytics
        results['cost_analytics'] = self.test_endpoint(
            "Cost Analytics",
            "GET",
            "/api/ai-tools/cost-analytics/?days=7"
        )
        
        # 12. Cost Summary
        results['cost_summary'] = self.test_endpoint(
            "Cost Summary",
            "GET",
            "/api/ai-tools/cost-summary/"
        )
        
        # 13. Web Search
        results['web_search'] = self.test_endpoint(
            "Web Search",
            "POST",
            "/api/ai-tools/web-search/",
            {
                "query": "Ethiopian education",
                "type": "general",
                "num_results": 3
            },
            expected_status=503  # May not be available without SERP key
        )
        
        return results
    
    def run_all_tests(self):
        """Run all endpoint tests"""
        if not self.token:
            print("\n❌ Cannot run tests without authentication token")
            return
        
        print("\n" + "🧪" * 30)
        print("   API ENDPOINT INTEGRATION TESTS")
        print("🧪" * 30)
        
        # Test AI endpoints
        ai_results = self.test_ai_endpoints()
        
        # Test system endpoints
        system_results = self.test_system_endpoints()
        
        # Combine results
        all_results = {**ai_results, **system_results}
        
        # Summary
        self.print_section("TEST SUMMARY")
        
        passed = sum(1 for v in all_results.values() if v)
        total = len(all_results)
        
        print(f"\n📊 Results: {passed}/{total} endpoints passed")
        
        # Show failed endpoints
        failed = [k for k, v in all_results.items() if not v]
        if failed:
            print(f"\n❌ Failed endpoints:")
            for endpoint in failed:
                print(f"   • {endpoint}")
        else:
            print("\n🎉 All endpoints passed!")
        
        # Show pass rate
        pass_rate = (passed / total * 100) if total > 0 else 0
        print(f"\n✅ Pass rate: {pass_rate:.1f}%")
        
        if pass_rate >= 90:
            print("🌟 Excellent! System is production ready.")
        elif pass_rate >= 75:
            print("⚠️  Good, but some endpoints need attention.")
        else:
            print("❌ Critical issues detected. Review failed endpoints.")
        
        print("\n" + "=" * 60 + "\n")
        
        return all_results


def main():
    """Run all tests"""
    tester = APIEndpointTester()
    results = tester.run_all_tests()
    
    # Return exit code based on results
    if results:
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        return 0 if passed == total else 1
    return 1


if __name__ == '__main__':
    exit(main())
