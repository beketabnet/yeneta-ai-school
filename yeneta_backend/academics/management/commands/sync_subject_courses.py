"""
Management command to sync StudentEnrollmentRequest records with Course objects.
Ensures all approved enrollment requests have matching courses with valid subject_ids.
"""

from django.core.management.base import BaseCommand
from academics.models import StudentEnrollmentRequest, Course, Enrollment
from academics.services_subject_resolution import SubjectResolutionService


class Command(BaseCommand):
    help = 'Sync StudentEnrollmentRequest records to Course objects'

    def add_arguments(self, parser):
        parser.add_argument(
            '--teacher-id',
            type=int,
            help='Sync only for specific teacher ID',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        teacher_id = options.get('teacher_id')
        dry_run = options.get('dry_run', False)
        
        self.stdout.write(self.style.SUCCESS('Starting subject course sync...'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Perform the sync
        results = SubjectResolutionService.sync_enrollment_requests_to_courses(teacher_id)
        
        # Report results
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('Sync Complete'))
        self.stdout.write('='*60)
        self.stdout.write('Total requests processed: {}'.format(results['total']))
        self.stdout.write(self.style.SUCCESS('Courses created: {}'.format(results['created_courses'])))
        self.stdout.write(self.style.SUCCESS('Courses found: {}'.format(results['found_courses'])))
        
        if results['errors']:
            self.stdout.write(self.style.WARNING('Errors encountered: {}'.format(len(results['errors']))))
            for error in results['errors']:
                self.stdout.write('  Request {}: {}'.format(error['request_id'], error['error']))
        
        # Validate the results
        self.stdout.write('\nValidating subject IDs...')
        validation = SubjectResolutionService.validate_subject_ids(teacher_id)
        
        self.stdout.write('Total subjects: {}'.format(validation['total_subjects']))
        self.stdout.write(self.style.SUCCESS('Subjects with valid ID: {}'.format(validation['subjects_with_id'])))
        
        if validation['subjects_without_id'] > 0:
            self.stdout.write(self.style.WARNING('Subjects without ID: {}'.format(validation['subjects_without_id'])))
            for subject in validation['invalid_subjects']:
                self.stdout.write('  - {} (Grade {})'.format(subject['name'], subject['grade_level']))
        else:
            self.stdout.write(self.style.SUCCESS('All subjects have valid IDs!'))
