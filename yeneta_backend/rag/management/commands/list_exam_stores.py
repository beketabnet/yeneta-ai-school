"""
Management command to list all exam vector stores.
Usage: python manage.py list_exam_stores
"""

from django.core.management.base import BaseCommand
from rag.models import ExamVectorStore


class Command(BaseCommand):
    help = 'List all exam vector stores'

    def handle(self, *args, **options):
        exam_stores = ExamVectorStore.objects.all().order_by('exam_type', 'subject')
        
        if not exam_stores.exists():
            self.stdout.write(self.style.WARNING('No exam stores found'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'\nFound {exam_stores.count()} exam store(s):\n'))
        self.stdout.write('=' * 100)
        
        for store in exam_stores:
            status_style = self.style.SUCCESS if store.status == 'Active' else self.style.WARNING
            
            self.stdout.write(
                f"\nID: {store.id} | "
                f"{store.exam_type} - {store.subject} | "
                f"Year: {store.exam_year or 'All'} | "
                f"Stream: {store.stream} | "
                f"Status: {status_style(store.status)} | "
                f"Chunks: {store.chunk_count}"
            )
            
            if store.chapter:
                self.stdout.write(f"  Chapter: {store.chapter}")
            
            if store.vector_store_path:
                self.stdout.write(f"  Path: {store.vector_store_path}")
        
        self.stdout.write('\n' + '=' * 100 + '\n')
