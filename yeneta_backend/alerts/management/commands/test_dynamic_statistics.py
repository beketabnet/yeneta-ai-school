"""
Management command to test dynamic statistics updates
"""
from django.core.management.base import BaseCommand
from alerts.models import SmartAlert
from users.models import User


class Command(BaseCommand):
    help = 'Test dynamic statistics updates by modifying alerts'

    def handle(self, *args, **options):
        self.stdout.write('Testing Dynamic Statistics Updates...\n')
        
        # Get users
        try:
            admin = User.objects.get(email='admin@yeneta.com')
            teacher = User.objects.get(email='teacher@yeneta.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('Required users not found'))
            return
        
        # Initial statistics
        self.stdout.write(self.style.SUCCESS('\n=== INITIAL STATE ==='))
        self.print_statistics(admin)
        
        # Test 1: Assign some alerts
        self.stdout.write(self.style.SUCCESS('\n=== TEST 1: Assigning Alerts ==='))
        unassigned_alerts = SmartAlert.objects.filter(assigned_to__isnull=True)[:2]
        for alert in unassigned_alerts:
            alert.assigned_to = admin
            alert.status = 'In Progress'
            alert.save()
            self.stdout.write(f'  ✓ Assigned alert #{alert.id} to {admin.username}')
        
        self.print_statistics(admin)
        
        # Test 2: Mark alerts as requiring attention
        self.stdout.write(self.style.SUCCESS('\n=== TEST 2: Marking Alerts as Requiring Attention ==='))
        alerts_to_flag = SmartAlert.objects.filter(requires_immediate_attention=False)[:2]
        for alert in alerts_to_flag:
            alert.requires_immediate_attention = True
            alert.save()
            self.stdout.write(f'  ✓ Marked alert #{alert.id} as requiring attention')
        
        self.print_statistics(admin)
        
        # Test 3: Resolve some alerts
        self.stdout.write(self.style.SUCCESS('\n=== TEST 3: Resolving Alerts ==='))
        alerts_to_resolve = SmartAlert.objects.filter(status='In Progress')[:1]
        for alert in alerts_to_resolve:
            alert.status = 'Resolved'
            alert.save()
            self.stdout.write(f'  ✓ Resolved alert #{alert.id}')
        
        self.print_statistics(admin)
        
        # Test 4: Unassign an alert
        self.stdout.write(self.style.SUCCESS('\n=== TEST 4: Unassigning Alert ==='))
        assigned_alert = SmartAlert.objects.filter(assigned_to=admin).first()
        if assigned_alert:
            assigned_alert.assigned_to = None
            assigned_alert.status = 'New'
            assigned_alert.save()
            self.stdout.write(f'  ✓ Unassigned alert #{assigned_alert.id}')
        
        self.print_statistics(admin)
        
        self.stdout.write(self.style.SUCCESS('\n✅ Dynamic statistics test complete!'))
        self.stdout.write('\nThe statistics should update automatically in the frontend when:')
        self.stdout.write('  • Alerts are assigned/unassigned')
        self.stdout.write('  • Alert status changes')
        self.stdout.write('  • Alerts are marked as requiring attention')
        self.stdout.write('  • New alerts are created')
    
    def print_statistics(self, user):
        """Print current statistics."""
        total = SmartAlert.objects.count()
        requires_attention = SmartAlert.objects.filter(requires_immediate_attention=True).count()
        unassigned = SmartAlert.objects.filter(assigned_to__isnull=True).count()
        assigned_to_user = SmartAlert.objects.filter(assigned_to=user).count()
        
        self.stdout.write(f'  Total Alerts: {total}')
        self.stdout.write(f'  Requires Attention: {requires_attention}')
        self.stdout.write(f'  Unassigned: {unassigned}')
        self.stdout.write(f'  Assigned to {user.username}: {assigned_to_user}')
