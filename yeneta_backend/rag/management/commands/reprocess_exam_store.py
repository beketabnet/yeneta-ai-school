"""
Management command to reprocess exam vector stores.
Usage: python manage.py reprocess_exam_store <exam_store_id>
"""

from django.core.management.base import BaseCommand
from rag.models import ExamVectorStore
from rag.services import process_document_to_vector_store
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Reprocess an exam vector store by ID'

    def add_arguments(self, parser):
        parser.add_argument(
            'exam_store_id',
            type=int,
            help='ID of the exam vector store to reprocess'
        )

    def handle(self, *args, **options):
        exam_store_id = options['exam_store_id']
        
        try:
            exam_store = ExamVectorStore.objects.get(id=exam_store_id)
            
            self.stdout.write(
                self.style.WARNING(
                    f'Reprocessing exam store {exam_store_id}: '
                    f'{exam_store.exam_type} - {exam_store.subject} '
                    f'(Year: {exam_store.exam_year or "All"})'
                )
            )
            
            # Set status to Processing
            exam_store.status = 'Processing'
            exam_store.save()
            
            # Process the document
            success = process_document_to_vector_store(exam_store_id, is_exam=True)
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Successfully reprocessed exam store {exam_store_id}'
                    )
                )
                
                # Reload to get updated values
                exam_store.refresh_from_db()
                self.stdout.write(
                    f'   Status: {exam_store.status}'
                )
                self.stdout.write(
                    f'   Chunks: {exam_store.chunk_count}'
                )
                self.stdout.write(
                    f'   Path: {exam_store.vector_store_path}'
                )
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f'❌ Failed to reprocess exam store {exam_store_id}'
                    )
                )
                
        except ExamVectorStore.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(
                    f'❌ Exam vector store with ID {exam_store_id} not found'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'❌ Error reprocessing exam store: {str(e)}'
                )
            )
