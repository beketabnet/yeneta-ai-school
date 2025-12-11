"""
Cost Analytics - Advanced cost analysis and reporting
Provides detailed insights, trends, and recommendations for cost optimization.
"""

import os
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from .cost_tracker import cost_tracker
from .models import LLMModel, TaskType, UserRole

logger = logging.getLogger(__name__)


class CostAnalytics:
    """
    Advanced cost analytics and reporting.
    Provides insights, trends, and optimization recommendations.
    """
    
    def __init__(self):
        self.monthly_budget = float(os.getenv('MONTHLY_BUDGET_USD', 500.0))
    
    def get_cost_breakdown_by_model(self, days: int = 30) -> Dict:
        """
        Get cost breakdown by model.
        
        Args:
            days: Number of days to analyze
        
        Returns:
            Dictionary with model-wise cost breakdown
        """
        # Get usage logs from cost tracker
        usage_logs = [
            {
                'model': str(usage.model) if hasattr(usage.model, 'value') else usage.model,
                'cost_usd': usage.cost_usd,
                'input_tokens': usage.input_tokens,
                'output_tokens': usage.output_tokens,
                'timestamp': usage.timestamp.isoformat()
            }
            for usage in cost_tracker.usage_log
        ]
        
        model_costs = defaultdict(lambda: {
            'cost': 0.0,
            'requests': 0,
            'input_tokens': 0,
            'output_tokens': 0
        })
        
        for log in usage_logs:
            model = log['model']
            model_costs[model]['cost'] += log['cost_usd']
            model_costs[model]['requests'] += 1
            model_costs[model]['input_tokens'] += log['input_tokens']
            model_costs[model]['output_tokens'] += log['output_tokens']
        
        # Convert to list and sort by cost
        breakdown = [
            {
                'model': model,
                'cost': data['cost'],
                'requests': data['requests'],
                'input_tokens': data['input_tokens'],
                'output_tokens': data['output_tokens'],
                'avg_cost_per_request': data['cost'] / data['requests'] if data['requests'] > 0 else 0
            }
            for model, data in model_costs.items()
        ]
        
        breakdown.sort(key=lambda x: x['cost'], reverse=True)
        
        return {
            'breakdown': breakdown,
            'total_cost': sum(item['cost'] for item in breakdown),
            'total_requests': sum(item['requests'] for item in breakdown),
            'period_days': days
        }
    
    def get_cost_breakdown_by_task(self, days: int = 30) -> Dict:
        """
        Get cost breakdown by task type.
        
        Args:
            days: Number of days to analyze
        
        Returns:
            Dictionary with task-wise cost breakdown
        """
        # Get usage logs from cost tracker
        usage_logs = [
            {
                'task_type': str(usage.task_type) if hasattr(usage.task_type, 'value') else usage.task_type,
                'model': str(usage.model) if hasattr(usage.model, 'value') else usage.model,
                'cost_usd': usage.cost_usd,
            }
            for usage in cost_tracker.usage_log
        ]
        
        task_costs = defaultdict(lambda: {
            'cost': 0.0,
            'requests': 0,
            'models_used': set()
        })
        
        for log in usage_logs:
            task = log['task_type']
            task_costs[task]['cost'] += log['cost_usd']
            task_costs[task]['requests'] += 1
            task_costs[task]['models_used'].add(log['model'])
        
        # Convert to list
        breakdown = [
            {
                'task_type': task,
                'cost': data['cost'],
                'requests': data['requests'],
                'models_used': list(data['models_used']),
                'avg_cost_per_request': data['cost'] / data['requests'] if data['requests'] > 0 else 0
            }
            for task, data in task_costs.items()
        ]
        
        breakdown.sort(key=lambda x: x['cost'], reverse=True)
        
        return {
            'breakdown': breakdown,
            'total_cost': sum(item['cost'] for item in breakdown),
            'total_requests': sum(item['requests'] for item in breakdown),
            'period_days': days
        }
    
    def get_cost_breakdown_by_user_role(self, days: int = 30) -> Dict:
        """
        Get cost breakdown by user role.
        
        Args:
            days: Number of days to analyze
        
        Returns:
            Dictionary with role-wise cost breakdown
        """
        # Get usage logs from cost tracker
        usage_logs = [
            {
                'user_role': str(usage.user_role) if hasattr(usage.user_role, 'value') else usage.user_role,
                'user_id': usage.user_id,
                'cost_usd': usage.cost_usd,
            }
            for usage in cost_tracker.usage_log
        ]
        
        role_costs = defaultdict(lambda: {
            'cost': 0.0,
            'requests': 0,
            'unique_users': set()
        })
        
        for log in usage_logs:
            role = log['user_role']
            role_costs[role]['cost'] += log['cost_usd']
            role_costs[role]['requests'] += 1
            role_costs[role]['unique_users'].add(log['user_id'])
        
        # Convert to list
        breakdown = [
            {
                'role': role,
                'cost': data['cost'],
                'requests': data['requests'],
                'unique_users': len(data['unique_users']),
                'avg_cost_per_user': data['cost'] / len(data['unique_users']) if data['unique_users'] else 0,
                'avg_cost_per_request': data['cost'] / data['requests'] if data['requests'] > 0 else 0
            }
            for role, data in role_costs.items()
        ]
        
        breakdown.sort(key=lambda x: x['cost'], reverse=True)
        
        return {
            'breakdown': breakdown,
            'total_cost': sum(item['cost'] for item in breakdown),
            'total_requests': sum(item['requests'] for item in breakdown),
            'period_days': days
        }
    
    def get_cost_trends(self, days: int = 30) -> Dict:
        """
        Get cost trends over time.
        
        Args:
            days: Number of days to analyze
        
        Returns:
            Dictionary with daily cost trends
        """
        # Get usage logs from cost tracker
        usage_logs = [
            {
                'timestamp': usage.timestamp.isoformat(),
                'cost_usd': usage.cost_usd,
            }
            for usage in cost_tracker.usage_log
        ]
        
        daily_costs = defaultdict(lambda: {
            'cost': 0.0,
            'requests': 0,
            'free_requests': 0,
            'paid_requests': 0
        })
        
        for log in usage_logs:
            date = log['timestamp'].split('T')[0]
            daily_costs[date]['cost'] += log['cost_usd']
            daily_costs[date]['requests'] += 1
            
            if log['cost_usd'] == 0:
                daily_costs[date]['free_requests'] += 1
            else:
                daily_costs[date]['paid_requests'] += 1
        
        # Convert to list and sort by date
        trends = [
            {
                'date': date,
                'cost': data['cost'],
                'requests': data['requests'],
                'free_requests': data['free_requests'],
                'paid_requests': data['paid_requests'],
                'free_percentage': (data['free_requests'] / data['requests'] * 100) if data['requests'] > 0 else 0
            }
            for date, data in daily_costs.items()
        ]
        
        trends.sort(key=lambda x: x['date'])
        
        return {
            'trends': trends,
            'total_cost': sum(item['cost'] for item in trends),
            'total_requests': sum(item['requests'] for item in trends),
            'avg_daily_cost': sum(item['cost'] for item in trends) / len(trends) if trends else 0,
            'period_days': days
        }
    
    def get_tier_distribution(self, days: int = 30) -> Dict:
        """
        Get distribution of requests across LLM tiers.
        
        Args:
            days: Number of days to analyze
        
        Returns:
            Dictionary with tier distribution
        """
        # Get usage logs from cost tracker
        usage_logs = [
            {
                'model': str(usage.model) if hasattr(usage.model, 'value') else usage.model,
                'cost_usd': usage.cost_usd,
            }
            for usage in cost_tracker.usage_log
        ]
        
        tier_stats = {
            'ollama': {'requests': 0, 'cost': 0.0},
            'gemini': {'requests': 0, 'cost': 0.0},
            'openai': {'requests': 0, 'cost': 0.0}
        }
        
        for log in usage_logs:
            model = log['model']
            # Convert enum to string if needed
            model_str = model if isinstance(model, str) else str(model)
            
            if 'ollama' in model_str.lower():
                tier_stats['ollama']['requests'] += 1
                tier_stats['ollama']['cost'] += log['cost_usd']
            elif 'gemini' in model_str.lower():
                tier_stats['gemini']['requests'] += 1
                tier_stats['gemini']['cost'] += log['cost_usd']
            elif 'gpt' in model_str.lower() or 'openai' in model_str.lower():
                tier_stats['openai']['requests'] += 1
                tier_stats['openai']['cost'] += log['cost_usd']
        
        total_requests = sum(tier['requests'] for tier in tier_stats.values())
        
        # Calculate percentages
        distribution = [
            {
                'tier': tier,
                'requests': data['requests'],
                'cost': data['cost'],
                'percentage': (data['requests'] / total_requests * 100) if total_requests > 0 else 0
            }
            for tier, data in tier_stats.items()
        ]
        
        return {
            'distribution': distribution,
            'total_requests': total_requests,
            'total_cost': sum(item['cost'] for item in distribution),
            'period_days': days
        }
    
    def get_optimization_recommendations(self) -> List[str]:
        """
        Get cost optimization recommendations.
        
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        # Get recent analytics
        model_breakdown = self.get_cost_breakdown_by_model(days=7)
        task_breakdown = self.get_cost_breakdown_by_task(days=7)
        tier_dist = self.get_tier_distribution(days=7)
        
        # Check tier distribution
        tier_percentages = {t['tier']: t['percentage'] for t in tier_dist['distribution']}
        
        if tier_percentages.get('ollama', 0) < 60:
            recommendations.append(
                f"⚠️ Ollama usage is {tier_percentages.get('ollama', 0):.1f}% (target: 70%). "
                "Consider routing more simple tasks to Ollama for cost savings."
            )
        
        if tier_percentages.get('openai', 0) > 10:
            recommendations.append(
                f"⚠️ OpenAI usage is {tier_percentages.get('openai', 0):.1f}% (target: 5%). "
                "Consider using Gemini or Ollama for more tasks."
            )
        
        # Check expensive tasks
        if task_breakdown['breakdown']:
            most_expensive_task = task_breakdown['breakdown'][0]
            if most_expensive_task['cost'] > 10.0:
                recommendations.append(
                    f"💰 '{most_expensive_task['task_type']}' tasks cost ${most_expensive_task['cost']:.2f} "
                    f"in the last 7 days. Consider optimizing prompts or using cheaper models."
                )
        
        # Check expensive models
        if model_breakdown['breakdown']:
            for model_data in model_breakdown['breakdown'][:3]:
                if model_data['cost'] > 5.0 and 'gpt-4' in model_data['model'].lower():
                    recommendations.append(
                        f"💸 {model_data['model']} cost ${model_data['cost']:.2f}. "
                        "Consider using GPT-4o-mini or Gemini Pro for similar quality at lower cost."
                    )
        
        # Check budget status
        monthly_cost = cost_tracker.get_monthly_cost()
        budget_used_pct = (monthly_cost / self.monthly_budget * 100) if self.monthly_budget > 0 else 0
        
        if budget_used_pct > 80:
            recommendations.append(
                f"🚨 Budget alert: {budget_used_pct:.1f}% of monthly budget used. "
                "Consider increasing Ollama usage or adjusting budget."
            )
        
        # RAG recommendations
        recommendations.append(
            "✅ Enable RAG for curriculum-related queries to reduce tokens by 60-80%."
        )
        
        if not recommendations:
            recommendations.append("✅ Cost optimization is on track! Keep up the good work.")
        
        return recommendations
    
    def get_comprehensive_report(self, days: int = 30) -> Dict:
        """
        Get comprehensive cost analytics report.
        
        Args:
            days: Number of days to analyze
        
        Returns:
            Complete analytics report
        """
        return {
            'summary': cost_tracker.get_analytics_summary(),
            'model_breakdown': self.get_cost_breakdown_by_model(days),
            'task_breakdown': self.get_cost_breakdown_by_task(days),
            'role_breakdown': self.get_cost_breakdown_by_user_role(days),
            'trends': self.get_cost_trends(days),
            'tier_distribution': self.get_tier_distribution(days),
            'recommendations': self.get_optimization_recommendations(),
            'generated_at': datetime.now().isoformat(),
            'period_days': days
        }


# Singleton instance
cost_analytics = CostAnalytics()
