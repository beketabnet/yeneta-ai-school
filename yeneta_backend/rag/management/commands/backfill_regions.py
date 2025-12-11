import os
from django.core.management.base import BaseCommand
from rag.models import VectorStore, ExamVectorStore

class Command(BaseCommand):
    help = 'Backfill region information from file paths for VectorStores'

    def handle(self, *args, **options):
        self.stdout.write('Starting backfill process...')
        
        # Region mapping (folder name -> db value)
        # Add underscores as they appear in paths
        regions_map = {
            'Tigray': 'Tigray',
            'Afar': 'Afar',
            'Amhara': 'Amhara',
            'Oromia': 'Oromia',
            'Somali': 'Somali',
            'Benishangul-Gumuz': 'Benishangul-Gumuz',
            'Benishangul_Gumuz': 'Benishangul-Gumuz',
            'SNNPR': 'SNNPR',
            'Gambella': 'Gambella',
            'Harari': 'Harari',
            'Sidama': 'Sidama',
            'South_West_Ethiopia_Peoples': 'South West Ethiopia Peoples',
            'Central_Ethiopia': 'Central Ethiopia',
            'Addis_Ababa': 'Addis Ababa',
            'Dire_Dawa': 'Dire Dawa',
        }

        # 1. Backfill Curriculum Vector Stores
        self.stdout.write('\nProcessing Curriculum Vector Stores...')
        vector_stores = VectorStore.objects.all()
        updated_count = 0
        
        for store in vector_stores:
            if not store.file:
                continue
                
            path_parts = store.file.name.split('/')
            # Expected format: rag_documents/{Region}/...
            # path_parts[0] is 'rag_documents'
            # path_parts[1] should be Region
            
            if len(path_parts) > 1:
                potential_region = path_parts[1]
                
                # Check if this part matches a known region
                mapped_region = None
                
                # Direct match or underscore match
                if potential_region in regions_map:
                    mapped_region = regions_map[potential_region]
                
                if mapped_region and store.region != mapped_region:
                    old_region = store.region
                    store.region = mapped_region
                    store.save()
                    self.stdout.write(f'Updated {store.file_name}: {old_region} -> {mapped_region}')
                    updated_count += 1
                elif not mapped_region:
                    self.stdout.write(self.style.WARNING(f'Could not extract region from path: {store.file.name} (found: {potential_region})'))
            else:
                 self.stdout.write(self.style.WARNING(f'Invalid path format: {store.file.name}'))

        self.stdout.write(self.style.SUCCESS(f'Updated {updated_count} Curriculum Vector Stores'))

        # 2. Backfill Exam Vector Stores
        self.stdout.write('\nProcessing Exam Vector Stores...')
        exam_stores = ExamVectorStore.objects.all()
        updated_exam_count = 0
        
        for store in exam_stores:
            if not store.file:
                continue
                
            path_parts = store.file.name.split('/')
            # Expected format: exam_documents/{Region}/...
            
            if len(path_parts) > 1:
                potential_region = path_parts[1]
                
                mapped_region = None
                if potential_region in regions_map:
                    mapped_region = regions_map[potential_region]
                
                if mapped_region and store.region != mapped_region:
                    old_region = store.region
                    store.region = mapped_region
                    store.save()
                    self.stdout.write(f'Updated {store.file_name}: {old_region} -> {mapped_region}')
                    updated_exam_count += 1
                elif not mapped_region:
                    self.stdout.write(self.style.WARNING(f'Could not extract region from path: {store.file.name} (found: {potential_region})'))

        self.stdout.write(self.style.SUCCESS(f'Updated {updated_exam_count} Exam Vector Stores'))
