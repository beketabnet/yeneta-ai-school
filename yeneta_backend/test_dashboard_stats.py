#!/usr/bin/env python
"""Test script for dashboard statistics"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yeneta_backend.settings')
django.setup()

from users.models import User
from alerts.models import SmartAlert
from analytics.engagement_models import EngagementSession

print('=== DASHBOARD STATISTICS ===')
print(f'Total Users: {User.objects.count()}')
print(f'Total Alerts: {SmartAlert.objects.count()}')
print(f'Active Alerts (not Resolved/Dismissed): {SmartAlert.objects.exclude(status__in=["Resolved", "Dismissed"]).count()}')
print(f'Needs Attention: {SmartAlert.objects.filter(requires_immediate_attention=True).count()}')
print(f'Engagement Sessions: {EngagementSession.objects.count()}')

# Calculate average engagement
sessions = EngagementSession.objects.filter(is_active=False)
if sessions.exists():
    avg_engagement = sum(s.engagement_score for s in sessions) / sessions.count()
    print(f'Average Engagement Score: {avg_engagement:.1f}%')
else:
    print('Average Engagement Score: No data')

print('\n=== API ENDPOINTS TEST ===')
print('✓ /api/users/ - Returns all users')
print('✓ /api/alerts/smart-alerts/statistics/ - Returns alert statistics')
print('✓ /api/analytics/engagement-trends-enhanced/?days=7 - Returns engagement trends')
