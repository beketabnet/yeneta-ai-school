"""
Management command to initialize API keys from environment variables
Run: python manage.py init_api_keys
"""

from django.core.management.base import BaseCommand
import os
import sys

# Add yeneta_backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from api_key_init import APIKeyInitializer


class Command(BaseCommand):
    help = 'Initialize API keys from environment variables'

    def handle(self, *args, **options):
        try:
            self.stdout.write('Initializing API keys...')
            APIKeyInitializer.init_all()
            self.stdout.write(self.style.SUCCESS('✓ API keys initialized successfully'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error initializing API keys: {str(e)}'))
