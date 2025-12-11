"""
Cost Tracker - Monitor and manage LLM usage costs
Tracks usage, enforces budgets, and provides analytics.
"""

import os
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

from .models import LLMUsage, UserRole, LLMModel

logger = logging.getLogger(__name__)


class CostTracker:
    """
    Track and manage LLM costs with budget enforcement.
    Provides real-time cost monitoring and usage analytics.
    """
    
    def __init__(self):
        self.usage_log: List[LLMUsage] = []
        self.monthly_budget = float(os.getenv('MONTHLY_BUDGET_USD', 500.0))
        self.alert_threshold = float(os.getenv('BUDGET_ALERT_THRESHOLD', 0.80))
        self.tracking_enabled = os.getenv('COST_TRACKING_ENABLED', 'True') == 'True'
        
        # Per-user daily limits
        self.daily_limits = {
            UserRole.STUDENT: float(os.getenv('STUDENT_DAILY_LIMIT', 0.10)),
            UserRole.TEACHER: float(os.getenv('TEACHER_DAILY_LIMIT', 1.00)),
            UserRole.PARENT: float(os.getenv('PARENT_DAILY_LIMIT', 0.10)),
            UserRole.ADMIN: float(os.getenv('ADMIN_DAILY_LIMIT', 5.00)),
        }
        
        # Storage path for usage logs
        self.log_dir = Path(os.getenv('LOG_FILE', './logs/yeneta.log')).parent
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.usage_file = self.log_dir / 'llm_usage.jsonl'
        
        # Load existing usage data
        self._load_usage_data()
        
        logger.info(f"CostTracker initialized. Monthly budget: ${self.monthly_budget}")
    
    def _load_usage_data(self):
        """Load usage data from persistent storage"""
        if not self.usage_file.exists():
            return
        
        try:
            with open(self.usage_file, 'r') as f:
                for line in f:
                    if line.strip():
                        data = json.loads(line)
                        # Only load current month's data
                        timestamp = datetime.fromisoformat(data['timestamp'])
                        if timestamp.month == datetime.now().month:
                            self.usage_log.append(self._dict_to_usage(data))
            
            logger.info(f"Loaded {len(self.usage_log)} usage records from storage")
        except Exception as e:
            logger.error(f"Failed to load usage data: {e}")
    
    def _dict_to_usage(self, data: Dict) -> LLMUsage:
        """Convert dictionary to LLMUsage object"""
        try:
            model = LLMModel(data['model'])
        except ValueError:
            logger.debug(f"Invalid model found in usage log: {data['model']}. Defaulting to GEMINI_FLASH.")
            # Fallback to a safe default if the model name in logs is no longer valid
            model = LLMModel.GEMINI_FLASH

        return LLMUsage(
            user_id=data['user_id'],
            user_role=UserRole(data['user_role']),
            model=model,
            task_type=data['task_type'],
            input_tokens=data['input_tokens'],
            output_tokens=data['output_tokens'],
            cost_usd=data['cost_usd'],
            latency_ms=data['latency_ms'],
            timestamp=datetime.fromisoformat(data['timestamp']),
            success=data.get('success', True),
            error_message=data.get('error_message'),
            metadata=data.get('metadata', {}),
        )
    
    def _save_usage(self, usage: LLMUsage):
        """Append usage to persistent storage"""
        if not self.tracking_enabled:
            return
        
        try:
            with open(self.usage_file, 'a') as f:
                f.write(json.dumps(usage.to_dict()) + '\n')
        except Exception as e:
            logger.error(f"Failed to save usage data: {e}")
    
    def track_usage(self, usage: LLMUsage):
        """
        Track a new LLM usage event.
        
        Args:
            usage: LLMUsage object with usage details
        """
        if not self.tracking_enabled:
            return
        
        self.usage_log.append(usage)
        self._save_usage(usage)
        
        # Check budget alerts
        self._check_budget_alerts()
        
        logger.info(
            f"Tracked usage: {usage.model.value} | "
            f"User: {usage.user_id} ({usage.user_role.value}) | "
            f"Cost: ${usage.cost_usd:.4f} | "
            f"Tokens: {usage.input_tokens + usage.output_tokens}"
        )
    
    def check_user_limit(self, user_id: int, user_role: UserRole) -> bool:
        """
        Check if user has exceeded their daily limit.
        
        Args:
            user_id: User ID
            user_role: User role
        
        Returns:
            True if within limit, False if exceeded
        """
        if not self.tracking_enabled:
            return True
        
        daily_limit = self.daily_limits.get(user_role, 1.0)
        today_cost = self.get_user_cost_today(user_id)
        
        if today_cost >= daily_limit:
            logger.warning(
                f"User {user_id} ({user_role.value}) exceeded daily limit: "
                f"${today_cost:.4f} / ${daily_limit:.2f}"
            )
            return False
        
        return True
    
    def get_user_cost_today(self, user_id: int) -> float:
        """Get total cost for a user today"""
        today = datetime.now().date()
        return sum(
            usage.cost_usd
            for usage in self.usage_log
            if usage.user_id == user_id and usage.timestamp.date() == today
        )
    
    def get_monthly_cost(self) -> float:
        """Get total cost for current month"""
        current_month = datetime.now().month
        return sum(
            usage.cost_usd
            for usage in self.usage_log
            if usage.timestamp.month == current_month
        )
    
    def get_budget_remaining(self) -> float:
        """Get remaining budget for current month"""
        return max(0, self.monthly_budget - self.get_monthly_cost())
    
    def get_budget_percentage_used(self) -> float:
        """Get percentage of monthly budget used"""
        if self.monthly_budget == 0:
            return 0.0
        return (self.get_monthly_cost() / self.monthly_budget) * 100
    
    def _check_budget_alerts(self):
        """Check if budget alerts should be triggered"""
        percentage_used = self.get_budget_percentage_used()
        alert_percentage = self.alert_threshold * 100
        
        if percentage_used >= alert_percentage:
            logger.warning(
                f"BUDGET ALERT: {percentage_used:.1f}% of monthly budget used "
                f"(${self.get_monthly_cost():.2f} / ${self.monthly_budget:.2f})"
            )
    
    def get_usage_by_model(self) -> Dict[str, Dict]:
        """Get usage statistics grouped by model"""
        stats = defaultdict(lambda: {
            'count': 0,
            'total_cost': 0.0,
            'total_tokens': 0,
            'avg_latency': 0.0,
        })
        
        for usage in self.usage_log:
            model = usage.model.value
            stats[model]['count'] += 1
            stats[model]['total_cost'] += usage.cost_usd
            stats[model]['total_tokens'] += usage.input_tokens + usage.output_tokens
            stats[model]['avg_latency'] += usage.latency_ms
        
        # Calculate averages
        for model, data in stats.items():
            if data['count'] > 0:
                data['avg_latency'] /= data['count']
        
        return dict(stats)
    
    def get_usage_by_user_role(self) -> Dict[str, Dict]:
        """Get usage statistics grouped by user role"""
        stats = defaultdict(lambda: {
            'count': 0,
            'total_cost': 0.0,
            'total_tokens': 0,
            'unique_users': set(),
        })
        
        for usage in self.usage_log:
            role = usage.user_role.value
            stats[role]['count'] += 1
            stats[role]['total_cost'] += usage.cost_usd
            stats[role]['total_tokens'] += usage.input_tokens + usage.output_tokens
            stats[role]['unique_users'].add(usage.user_id)
        
        # Convert sets to counts
        for role, data in stats.items():
            data['unique_users'] = len(data['unique_users'])
        
        return dict(stats)
    
    def get_daily_costs(self, days: int = 30) -> Dict[str, float]:
        """Get daily costs for the last N days"""
        daily_costs = defaultdict(float)
        cutoff_date = datetime.now() - timedelta(days=days)
        
        for usage in self.usage_log:
            if usage.timestamp >= cutoff_date:
                date_key = usage.timestamp.strftime('%Y-%m-%d')
                daily_costs[date_key] += usage.cost_usd
        
        return dict(sorted(daily_costs.items()))
    
    def get_tier_distribution(self) -> Dict[str, Dict]:
        """Get usage distribution across LLM tiers"""
        from .models import LLMTier
        
        tier_stats = defaultdict(lambda: {
            'count': 0,
            'total_cost': 0.0,
            'percentage': 0.0,
        })
        
        total_count = len(self.usage_log)
        
        for usage in self.usage_log:
            tier = LLMModel.get_tier(usage.model).value
            tier_stats[tier]['count'] += 1
            tier_stats[tier]['total_cost'] += usage.cost_usd
        
        # Calculate percentages
        for tier, data in tier_stats.items():
            if total_count > 0:
                data['percentage'] = (data['count'] / total_count) * 100
        
        return dict(tier_stats)
    
    def get_analytics_summary(self) -> Dict:
        """Get comprehensive analytics summary"""
        return {
            'monthly_budget': self.monthly_budget,
            'monthly_cost': self.get_monthly_cost(),
            'budget_remaining': self.get_budget_remaining(),
            'budget_percentage_used': self.get_budget_percentage_used(),
            'total_requests': len(self.usage_log),
            'usage_by_model': self.get_usage_by_model(),
            'usage_by_role': self.get_usage_by_user_role(),
            'tier_distribution': self.get_tier_distribution(),
            'daily_costs': self.get_daily_costs(30),
        }
    
    def reset_monthly_data(self):
        """Reset data for new month (called automatically)"""
        current_month = datetime.now().month
        self.usage_log = [
            usage for usage in self.usage_log
            if usage.timestamp.month == current_month
        ]
        logger.info("Monthly usage data reset")


# Singleton instance
cost_tracker = CostTracker()
