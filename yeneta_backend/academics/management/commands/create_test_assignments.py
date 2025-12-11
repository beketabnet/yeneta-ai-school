"""
Management command to create test assignments and submissions for testing grading features.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from users.models import User
from academics.models import Assignment, Submission


class Command(BaseCommand):
    help = 'Create test assignments and submissions for testing AI grading features'

    def handle(self, *args, **options):
        self.stdout.write('Creating test assignments and submissions...')
        
        # Get or create teacher
        try:
            teacher = User.objects.get(email='teacher@yeneta.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('Teacher user not found. Please create teacher@yeneta.com first.'))
            return
        
        # Get students
        students = User.objects.filter(role='Student')
        if not students.exists():
            self.stdout.write(self.style.ERROR('No student users found. Please create students first.'))
            return
        
        # Create assignments
        assignments_data = [
            {
                'title': 'Essay: The Impact of Technology on Education',
                'description': 'Write a 500-word essay discussing how technology has transformed education in Ethiopia. Include specific examples and your personal perspective.',
                'rubric': '''Grading Rubric (100 points total):
1. Content & Ideas (40 points): Clear thesis, well-developed arguments, relevant examples
2. Organization (20 points): Logical structure, smooth transitions, coherent flow
3. Language & Style (20 points): Appropriate vocabulary, varied sentence structure, engaging tone
4. Grammar & Mechanics (20 points): Correct spelling, punctuation, and grammar''',
                'course': 'English Literature',
                'due_date': timezone.now() + timedelta(days=7)
            },
            {
                'title': 'Math Problem Set: Algebra Fundamentals',
                'description': 'Solve the following algebra problems showing all your work: 1) 2x + 5 = 15, 2) 3(x-4) = 21, 3) x² - 9 = 0',
                'rubric': '''Grading Rubric (100 points total):
1. Correct Solutions (60 points): 20 points per problem
2. Work Shown (30 points): Clear step-by-step process
3. Presentation (10 points): Neat, organized, easy to follow''',
                'course': 'Mathematics',
                'due_date': timezone.now() + timedelta(days=5)
            },
            {
                'title': 'Science Report: The Water Cycle',
                'description': 'Write a detailed report explaining the water cycle, including evaporation, condensation, precipitation, and collection. Include diagrams if possible.',
                'rubric': '''Grading Rubric (100 points total):
1. Scientific Accuracy (40 points): Correct explanation of all stages
2. Completeness (30 points): All aspects covered thoroughly
3. Clarity (20 points): Easy to understand explanations
4. Visual Aids (10 points): Quality of diagrams or illustrations''',
                'course': 'Science',
                'due_date': timezone.now() + timedelta(days=10)
            }
        ]
        
        # Sample student submissions
        submissions_data = [
            # Essay submissions
            {
                'assignment_title': 'Essay: The Impact of Technology on Education',
                'text': '''Technology has revolutionized education in Ethiopia in numerous ways. First, the introduction of computers and internet connectivity in schools has opened up a world of information to students who previously relied solely on textbooks. Students can now access online libraries, educational videos, and interactive learning platforms that make learning more engaging and effective.

Second, technology has enabled distance learning, which became especially important during the COVID-19 pandemic. Students in remote areas can now access quality education through online platforms, breaking down geographical barriers that once limited educational opportunities.

Third, educational apps and software have made learning more personalized. Students can learn at their own pace, revisit difficult concepts, and receive immediate feedback on their progress. This individualized approach helps students who might struggle in traditional classroom settings.

However, challenges remain. Not all schools have adequate technology infrastructure, and many students lack access to devices at home. Additionally, teachers need proper training to effectively integrate technology into their teaching methods.

In conclusion, while technology has brought significant improvements to education in Ethiopia, we must work to ensure equal access and proper implementation to maximize its benefits for all students.'''
            },
            {
                'assignment_title': 'Essay: The Impact of Technology on Education',
                'text': '''Technology is changing education. Computers and internet help students learn better. They can find information online and watch videos. This is good for education.

Online learning is also important. Students can study from home. This helps during pandemic. Many students use computers now.

Apps make learning fun. Students like using technology. It helps them understand lessons better. Teachers also use technology in class.

But some problems exist. Not all schools have computers. Some students don't have internet at home. This is not fair for everyone.

Technology is important for education. It helps students learn more. We need more computers in schools. This will help education in Ethiopia.'''
            },
            # Math submissions
            {
                'assignment_title': 'Math Problem Set: Algebra Fundamentals',
                'text': '''Problem 1: 2x + 5 = 15
Step 1: Subtract 5 from both sides
2x + 5 - 5 = 15 - 5
2x = 10

Step 2: Divide both sides by 2
2x/2 = 10/2
x = 5

Verification: 2(5) + 5 = 10 + 5 = 15 ✓

Problem 2: 3(x-4) = 21
Step 1: Divide both sides by 3
3(x-4)/3 = 21/3
x - 4 = 7

Step 2: Add 4 to both sides
x - 4 + 4 = 7 + 4
x = 11

Verification: 3(11-4) = 3(7) = 21 ✓

Problem 3: x² - 9 = 0
Step 1: Add 9 to both sides
x² - 9 + 9 = 0 + 9
x² = 9

Step 2: Take square root of both sides
x = ±√9
x = ±3

Therefore, x = 3 or x = -3

Verification: (3)² - 9 = 9 - 9 = 0 ✓
            (-3)² - 9 = 9 - 9 = 0 ✓'''
            },
            {
                'assignment_title': 'Math Problem Set: Algebra Fundamentals',
                'text': '''Problem 1: 2x + 5 = 15
2x = 10
x = 5

Problem 2: 3(x-4) = 21
x - 4 = 7
x = 11

Problem 3: x² - 9 = 0
x = 3'''
            },
            # Science submissions
            {
                'assignment_title': 'Science Report: The Water Cycle',
                'text': '''The Water Cycle: A Comprehensive Report

Introduction:
The water cycle, also known as the hydrological cycle, is the continuous movement of water on, above, and below the surface of the Earth. This cycle is essential for life and involves four main stages: evaporation, condensation, precipitation, and collection.

1. Evaporation:
Evaporation is the process by which water changes from a liquid state to a gaseous state (water vapor). This occurs when the sun heats water in rivers, lakes, oceans, and other bodies of water. The heat energy causes water molecules to move faster and eventually escape into the atmosphere as water vapor. Plants also contribute to this process through transpiration, where water evaporates from leaves.

2. Condensation:
As water vapor rises into the atmosphere, it cools down. When the temperature drops, the water vapor condenses into tiny water droplets or ice crystals, forming clouds. This process is called condensation. The height and temperature at which this occurs determine the type of clouds that form.

3. Precipitation:
When water droplets in clouds become too heavy, they fall back to Earth as precipitation. This can take various forms including rain, snow, sleet, or hail, depending on the atmospheric temperature. Precipitation is crucial for replenishing water sources on Earth.

4. Collection:
Precipitation that falls to Earth collects in various places. Some water flows into rivers and streams, eventually reaching oceans and lakes. Some water seeps into the ground, becoming groundwater. This collected water then begins the cycle again through evaporation.

Conclusion:
The water cycle is a continuous, natural process that maintains Earth's water balance. Understanding this cycle is crucial for water resource management and environmental conservation in Ethiopia and around the world.'''
            }
        ]
        
        created_assignments = []
        for assignment_data in assignments_data:
            assignment, created = Assignment.objects.get_or_create(
                title=assignment_data['title'],
                created_by=teacher,
                defaults={
                    'description': assignment_data['description'],
                    'rubric': assignment_data['rubric'],
                    'course': assignment_data['course'],
                    'due_date': assignment_data['due_date']
                }
            )
            created_assignments.append(assignment)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created assignment: {assignment.title}'))
            else:
                self.stdout.write(f'Assignment already exists: {assignment.title}')
        
        # Create submissions
        submission_count = 0
        for i, student in enumerate(students[:4]):  # Create submissions for first 4 students
            for submission_data in submissions_data:
                assignment = Assignment.objects.get(title=submission_data['assignment_title'])
                
                submission, created = Submission.objects.get_or_create(
                    assignment=assignment,
                    student=student,
                    defaults={
                        'submitted_text': submission_data['text']
                    }
                )
                
                if created:
                    submission_count += 1
                    self.stdout.write(f'Created submission for {student.username} - {assignment.title}')
        
        self.stdout.write(self.style.SUCCESS(f'\nSummary:'))
        self.stdout.write(self.style.SUCCESS(f'- Created {len(created_assignments)} assignments'))
        self.stdout.write(self.style.SUCCESS(f'- Created {submission_count} submissions'))
        self.stdout.write(self.style.SUCCESS('\nTest data ready for grading features!'))
