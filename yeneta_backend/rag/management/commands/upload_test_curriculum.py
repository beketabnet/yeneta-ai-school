"""
Management command to upload test curriculum data to vector store.
This creates sample curriculum content for testing the chapter extraction feature.
"""

from django.core.management.base import BaseCommand
from ai_tools.llm import vector_store, document_processor, DocumentChunk
import uuid


class Command(BaseCommand):
    help = 'Upload test curriculum data to vector store for chapter extraction testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--grade',
            type=str,
            default='Grade 7',
            help='Grade level (default: Grade 7)'
        )
        parser.add_argument(
            '--subject',
            type=str,
            default='English',
            help='Subject (default: English)'
        )

    def handle(self, *args, **options):
        grade = options['grade']
        subject = options['subject']
        
        self.stdout.write(self.style.SUCCESS(f'\n📚 Uploading test curriculum for {grade} {subject}...\n'))
        
        # Sample curriculum content for Grade 7 English
        curriculum_data = {
            'Grade 7': {
                'English': [
                    {
                        'unit': 'Unit One',
                        'title': 'Reading Comprehension and Analysis',
                        'topics': [
                            'Identifying main ideas and supporting details',
                            'Making inferences from text',
                            'Analyzing author\'s purpose and tone',
                            'Understanding literary devices'
                        ],
                        'objectives': [
                            'Students will identify the main idea and supporting details in a passage',
                            'Students will make logical inferences based on textual evidence',
                            'Students will analyze the author\'s purpose and intended audience',
                            'Students will recognize and explain common literary devices'
                        ],
                        'moe_code': 'ENG.7.1.1',
                        'duration': '6 lessons (270 minutes)',
                        'prerequisites': 'Basic reading skills, understanding of paragraph structure'
                    },
                    {
                        'unit': 'Unit Two',
                        'title': 'Grammar and Sentence Structure',
                        'topics': [
                            'Parts of speech review',
                            'Simple, compound, and complex sentences',
                            'Subject-verb agreement',
                            'Proper use of punctuation'
                        ],
                        'objectives': [
                            'Students will identify and use all parts of speech correctly',
                            'Students will construct simple, compound, and complex sentences',
                            'Students will apply subject-verb agreement rules',
                            'Students will use punctuation marks appropriately'
                        ],
                        'moe_code': 'ENG.7.2.1',
                        'duration': '8 lessons (360 minutes)',
                        'prerequisites': 'Basic grammar knowledge, sentence writing skills'
                    },
                    {
                        'unit': 'Unit Three',
                        'title': 'Writing Skills and Composition',
                        'topics': [
                            'Paragraph structure and organization',
                            'Descriptive writing techniques',
                            'Narrative writing elements',
                            'Editing and revision strategies'
                        ],
                        'objectives': [
                            'Students will write well-organized paragraphs with clear topic sentences',
                            'Students will use descriptive language to create vivid imagery',
                            'Students will write narrative compositions with proper story elements',
                            'Students will edit and revise their work for clarity and coherence'
                        ],
                        'moe_code': 'ENG.7.3.1',
                        'duration': '10 lessons (450 minutes)',
                        'prerequisites': 'Basic writing skills, understanding of paragraph structure'
                    },
                    {
                        'unit': 'Unit Four',
                        'title': 'Vocabulary Development',
                        'topics': [
                            'Context clues for word meaning',
                            'Prefixes, suffixes, and root words',
                            'Synonyms and antonyms',
                            'Academic vocabulary'
                        ],
                        'objectives': [
                            'Students will use context clues to determine word meanings',
                            'Students will analyze word parts to understand new vocabulary',
                            'Students will identify and use synonyms and antonyms effectively',
                            'Students will incorporate academic vocabulary in their writing'
                        ],
                        'moe_code': 'ENG.7.4.1',
                        'duration': '5 lessons (225 minutes)',
                        'prerequisites': 'Basic vocabulary knowledge, dictionary skills'
                    },
                    {
                        'unit': 'Unit Five',
                        'title': 'Speaking and Listening Skills',
                        'topics': [
                            'Oral presentation techniques',
                            'Active listening strategies',
                            'Group discussion participation',
                            'Formal vs. informal language'
                        ],
                        'objectives': [
                            'Students will deliver clear and organized oral presentations',
                            'Students will demonstrate active listening through appropriate responses',
                            'Students will participate effectively in group discussions',
                            'Students will use appropriate language for different contexts'
                        ],
                        'moe_code': 'ENG.7.5.1',
                        'duration': '7 lessons (315 minutes)',
                        'prerequisites': 'Basic communication skills, confidence in speaking'
                    }
                ],
                'Mathematics': [
                    {
                        'unit': 'Unit One',
                        'title': 'Integers and Operations',
                        'topics': [
                            'Understanding positive and negative numbers',
                            'Adding and subtracting integers',
                            'Multiplying and dividing integers',
                            'Order of operations with integers'
                        ],
                        'objectives': [
                            'Students will understand the concept of integers and their real-world applications',
                            'Students will perform addition and subtraction of integers accurately',
                            'Students will multiply and divide integers following proper rules',
                            'Students will apply order of operations to solve complex integer problems'
                        ],
                        'moe_code': 'MATH.7.1.1',
                        'duration': '8 lessons (360 minutes)',
                        'prerequisites': 'Basic arithmetic operations, number line understanding'
                    },
                    {
                        'unit': 'Chapter Three',
                        'title': 'Fractions, Decimals, and Percentages',
                        'topics': [
                            'Converting between fractions, decimals, and percentages',
                            'Operations with fractions',
                            'Decimal operations',
                            'Percentage calculations and applications'
                        ],
                        'objectives': [
                            'Students will convert fluently between fractions, decimals, and percentages',
                            'Students will perform operations with fractions accurately',
                            'Students will solve problems involving decimal operations',
                            'Students will calculate percentages and apply them to real-world situations'
                        ],
                        'moe_code': 'MATH.7.3.1',
                        'duration': '10 lessons (450 minutes)',
                        'prerequisites': 'Basic fraction concepts, decimal place value'
                    }
                ]
            }
        }
        
        # Get curriculum for specified grade and subject
        if grade not in curriculum_data:
            self.stdout.write(self.style.ERROR(f'❌ No test data available for {grade}'))
            return
        
        if subject not in curriculum_data[grade]:
            self.stdout.write(self.style.ERROR(f'❌ No test data available for {grade} {subject}'))
            return
        
        units = curriculum_data[grade][subject]
        
        # Create document chunks for each unit
        chunks = []
        for unit_data in units:
            # Create comprehensive text for the unit
            unit_text = f"""
{unit_data['unit']}: {unit_data['title']}

TOPICS COVERED:
{chr(10).join(['- ' + topic for topic in unit_data['topics']])}

LEARNING OBJECTIVES:
{chr(10).join(['- ' + obj for obj in unit_data['objectives']])}

ETHIOPIAN MOE CURRICULUM CODE: {unit_data['moe_code']}

ESTIMATED DURATION: {unit_data['duration']}

PREREQUISITES: {unit_data['prerequisites']}

This unit is part of the {grade} {subject} curriculum aligned with Ethiopian Ministry of Education standards.
"""
            
            # Create a DocumentChunk
            chunk = DocumentChunk(
                text=unit_text.strip(),
                metadata={
                    'source': f'{grade}_{subject}_curriculum.pdf',
                    'grade': grade,
                    'subject': subject,
                    'unit': unit_data['unit'],
                    'title': unit_data['title'],
                    'moe_code': unit_data['moe_code'],
                    'page': units.index(unit_data) + 1,
                    'chunk_index': units.index(unit_data)
                },
                chunk_id=str(uuid.uuid4()),
                source=f'{grade}_{subject}_curriculum.pdf',
                page_number=units.index(unit_data) + 1,
                section=unit_data['unit']
            )
            chunks.append(chunk)
            
            self.stdout.write(f'  ✓ Created chunk for {unit_data["unit"]}: {unit_data["title"]}')
        
        # Add chunks to vector store
        self.stdout.write(self.style.WARNING(f'\n📤 Uploading {len(chunks)} chunks to vector store...'))
        
        try:
            added_count = vector_store.add_documents(chunks)
            
            if added_count > 0:
                self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully uploaded {added_count} curriculum units!'))
                self.stdout.write(self.style.SUCCESS(f'\n📊 Summary:'))
                self.stdout.write(f'   Grade: {grade}')
                self.stdout.write(f'   Subject: {subject}')
                self.stdout.write(f'   Units: {len(chunks)}')
                self.stdout.write(f'   Vector Store: Ready for chapter extraction\n')
                
                self.stdout.write(self.style.WARNING('\n💡 You can now test chapter extraction with:'))
                for unit_data in units:
                    self.stdout.write(f'   - "{unit_data["unit"]}"')
                self.stdout.write('')
            else:
                self.stdout.write(self.style.ERROR('\n❌ Failed to upload curriculum data'))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ Error uploading curriculum: {str(e)}'))
            self.stdout.write(self.style.ERROR(f'   Make sure ChromaDB and embedding service are properly configured'))
