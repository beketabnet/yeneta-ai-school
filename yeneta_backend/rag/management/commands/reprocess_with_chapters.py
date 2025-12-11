"""
Management command to reprocess existing curriculum documents with chapter metadata extraction.
"""
from django.core.management.base import BaseCommand
from rag.models import VectorStore
from rag.services import process_document_to_vector_store
import os
import shutil
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Reprocess existing curriculum documents to extract chapter metadata'

    def add_arguments(self, parser):
        parser.add_argument(
            '--grade',
            type=str,
            help='Grade level to reprocess (e.g., "Grade 7"). Leave empty to process all grades.',
        )
        parser.add_argument(
            '--subject',
            type=str,
            help='Subject to reprocess (e.g., "English"). Leave empty to process all subjects.',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Reprocess all vector stores in the database',
        )

    def handle(self, *args, **options):
        grade = options.get('grade')
        subject = options.get('subject')
        process_all = options.get('all')

        # Build filter
        filters = {'status': 'Active'}
        
        # If --all flag is used, process everything
        if process_all:
            self.stdout.write(self.style.WARNING(
                '⚠️  Processing ALL vector stores in the database...'
            ))
        else:
            # Apply filters if provided
            if grade:
                filters['grade'] = grade
            if subject:
                filters['subject'] = subject

        if not process_all and not (grade or subject):
            self.stdout.write(self.style.ERROR(
                'Please specify --grade, --subject, or --all'
            ))
            return

        # Get vector stores to reprocess
        vector_stores = VectorStore.objects.filter(**filters)

        if not vector_stores.exists():
            self.stdout.write(self.style.WARNING(
                f'No vector stores found matching criteria'
            ))
            return

        self.stdout.write(self.style.SUCCESS(
            f'\n📚 Found {vector_stores.count()} vector store(s) to reprocess\n'
        ))

        success_count = 0
        fail_count = 0

        for vs in vector_stores:
            self.stdout.write(f'Processing: {vs.grade} - {vs.subject} ({vs.file_name})')
            
            try:
                # Delete existing vector store to force fresh extraction
                if os.path.exists(vs.vector_store_path):
                    self.stdout.write(f'  🗑️  Deleting old vector store...')
                    shutil.rmtree(vs.vector_store_path)
                
                # Reprocess the document with fresh extraction
                success = process_document_to_vector_store(vs.id)
                
                if success:
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Successfully reprocessed with chapter metadata'))
                    success_count += 1
                else:
                    self.stdout.write(self.style.ERROR(f'  ✗ Failed to reprocess'))
                    fail_count += 1
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ✗ Error: {str(e)}'))
                fail_count += 1

        # Summary
        self.stdout.write(self.style.SUCCESS(
            f'\n📊 Summary:\n'
            f'   Success: {success_count}\n'
            f'   Failed: {fail_count}\n'
            f'   Total: {vector_stores.count()}\n'
        ))

        if success_count > 0:
            self.stdout.write(self.style.SUCCESS(
                '\n✅ Chapter metadata extraction complete!\n'
                'Documents now support chapter-based filtering.\n'
            ))
