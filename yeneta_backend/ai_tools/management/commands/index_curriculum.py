"""
Django management command to index curriculum documents for RAG.
Usage: python manage.py index_curriculum [directory_path]
"""

from django.core.management.base import BaseCommand, CommandError
from ai_tools.llm import vector_store, document_processor
import os


class Command(BaseCommand):
    help = 'Index curriculum documents for RAG system'
    
    def add_arguments(self, parser):
        parser.add_argument(
            'directory',
            nargs='?',
            type=str,
            default='media/curriculum_docs',
            help='Directory containing curriculum documents (default: media/curriculum_docs)'
        )
        
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing index before adding new documents'
        )
        
        parser.add_argument(
            '--recursive',
            action='store_true',
            default=True,
            help='Process subdirectories recursively (default: True)'
        )
    
    def handle(self, *args, **options):
        directory = options['directory']
        clear_existing = options['clear']
        recursive = options['recursive']
        
        # Validate directory
        if not os.path.exists(directory):
            raise CommandError(f'Directory not found: {directory}')
        
        if not os.path.isdir(directory):
            raise CommandError(f'Not a directory: {directory}')
        
        self.stdout.write(self.style.SUCCESS(f'\n📚 Indexing curriculum documents from: {directory}\n'))
        
        # Clear existing if requested
        if clear_existing:
            self.stdout.write(self.style.WARNING('🗑️  Clearing existing index...'))
            vector_store.clear_collection()
            self.stdout.write(self.style.SUCCESS('✅ Index cleared\n'))
        
        # Index directory
        self.stdout.write('📄 Processing documents...')
        
        try:
            result = vector_store.index_directory(
                directory_path=directory,
                recursive=recursive,
                clear_existing=False  # Already cleared above if needed
            )
            
            # Display results
            self.stdout.write(self.style.SUCCESS('\n✅ Indexing complete!\n'))
            self.stdout.write(f"  📁 Files processed: {result['files_processed']}")
            self.stdout.write(f"  📝 Chunks generated: {result['chunks_generated']}")
            self.stdout.write(f"  💾 Chunks indexed: {result['chunks_indexed']}")
            
            # Display stats
            stats = vector_store.get_stats()
            self.stdout.write(f"\n📊 Vector Store Stats:")
            self.stdout.write(f"  📚 Total chunks: {stats['total_chunks']}")
            self.stdout.write(f"  🔢 Embedding dimension: {stats['embedding_dimension']}")
            self.stdout.write(f"  📂 Collection: {stats['collection_name']}")
            self.stdout.write(f"  💿 Storage: {stats['persist_directory']}\n")
            
            if result['chunks_indexed'] == 0:
                self.stdout.write(self.style.WARNING(
                    '⚠️  No documents were indexed. Check if the directory contains supported files (.pdf, .txt, .md, .docx)'
                ))
        
        except Exception as e:
            raise CommandError(f'Indexing failed: {str(e)}')
