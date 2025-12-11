from django.utils import timezone
from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import OnlineQuiz, Question, QuizAttempt, QuestionResponse, StudentGrade, Course
from .serializers import OnlineQuizSerializer, QuizAttemptSerializer, QuestionResponseSerializer, StudentOnlineQuizSerializer
from ai_tools.llm.llm_service import LLMService
from ai_tools.quiz_generator_rag_enhancer import QuizGeneratorRAGEnhancer
from ai_tools.tutor_rag_enhancer import TutorRAGEnhancer
from typing import List
import json
import logging

logger = logging.getLogger(__name__)

class OnlineQuizViewSet(viewsets.ModelViewSet):
    """ViewSet for managing online quizzes."""
    
    queryset = OnlineQuiz.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.user.role == 'Student':
            return StudentOnlineQuizSerializer
        return OnlineQuizSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'Teacher':
            return OnlineQuiz.objects.filter(teacher=user)
        elif user.role == 'Student':
            # 1. Quizzes explicitly shared with this student
            shared_quizzes = OnlineQuiz.objects.filter(is_published=True, shared_with=user)
            
            # 2. Quizzes explicitly shared with others (exclude)
            # Logic: If a quiz has ANY shared_with users, it is private to them.
            # If it has NO shared_with users, it acts as "public to course".
            # However, enforcing "public to course" requires efficient queries.
            # For simplicity and robust permission:
            # - Show if in shared_with
            # - OR (is_published=True AND shared_with is empty)
            
            # Since strict targeting is requested, we prioritize explicit sharing logic.
            # BUT for backward compatibility, unmodified quizzes have empty shared_with.
            # Let's use Q objects.
            from django.db.models import Q
            return OnlineQuiz.objects.filter(
                Q(is_published=True) & 
                (Q(shared_with=user) | Q(shared_with__isnull=True))
            ).distinct()
            
        return OnlineQuiz.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a quiz."""
        quiz = self.get_object()
        quiz.is_published = True
        quiz.save()
        return Response({'status': 'published'})

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share a quiz with specific users (publishes it)."""
        quiz = self.get_object()
        student_ids = request.data.get('student_ids', [])
        
        quiz.is_published = True
        quiz.save()
        
        if student_ids:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            students = User.objects.filter(id__in=student_ids, role='Student')
            quiz.shared_with.set(students)
            
        return Response({'status': 'shared', 'message': f'Quiz published and shared with {len(student_ids)} students'})

    @action(detail=True, methods=['post'])
    def start_attempt(self, request, pk=None):
        """Start a quiz attempt for a student."""
        if request.user.role != 'Student':
            return Response({'error': 'Only students can take quizzes'}, status=status.HTTP_403_FORBIDDEN)
            
        quiz = self.get_object()
        
        # Check for existing attempts
        existing_attempts = QuizAttempt.objects.filter(student=request.user, quiz=quiz)
        
        # Check for incomplete attempt to resume
        incomplete_attempt = existing_attempts.filter(status__in=['in_progress', 'paused']).first()
        if incomplete_attempt:
            if incomplete_attempt.status == 'paused':
                incomplete_attempt.status = 'in_progress'
                incomplete_attempt.save()
            return Response(QuizAttemptSerializer(incomplete_attempt).data)

        # Check if retake is allowed for completed attempts
        if existing_attempts.filter(status='completed').exists() and not quiz.allow_retake:
            return Response({'error': 'You have already taken this quiz'}, status=status.HTTP_400_BAD_REQUEST)
            
        attempt = QuizAttempt.objects.create(
            student=request.user,
            quiz=quiz,
            max_score=quiz.questions.aggregate(total=Sum('points'))['total'] or 0,
            status='in_progress'
        )
        
        return Response(QuizAttemptSerializer(attempt).data)

    @action(detail=True, methods=['post'])
    def pause_attempt(self, request, pk=None):
        """Pause a quiz attempt."""
        quiz = self.get_object()
        attempt = QuizAttempt.objects.filter(
            student=request.user, 
            quiz=quiz, 
            status='in_progress'
        ).first()
        
        if not attempt:
            return Response({'error': 'No active attempt found'}, status=status.HTTP_404_NOT_FOUND)
            
        current_index = request.data.get('current_question_index', 0)
        
        attempt.status = 'paused'
        attempt.pause_count += 1
        attempt.last_paused_at = timezone.now()
        attempt.current_question_index = current_index
        attempt.save()
        
        return Response({'status': 'paused'})

    @action(detail=True, methods=['get'])
    def get_eligible_students(self, request, pk=None):
        """Get students eligible for this quiz based on enrollment."""
        quiz = self.get_object()
        
        # Get students enrolled in courses taught by this teacher
        # matching the quiz's grade, subject, and stream
        from .models import TeacherCourseRequest, StudentEnrollmentRequest
        
        # 1. Get courses approved for this teacher
        # Note: We prioritize finding students directly via enrollments, 
        # but this check could be used to validation permissions if needed.
        
        # 2. Get students enrolled in these courses
        # Finding students who have an approved enrollment request 
        # for the same grade and subject.
        
        # Robust Grade Filtering: Handle "7" vs "Grade 7" mismatch
        q_grade = str(quiz.grade_level)
        possible_grades = [q_grade]
        if q_grade.isdigit():
            possible_grades.append(f"Grade {q_grade}")
        elif q_grade.startswith("Grade "):
             possible_grades.append(q_grade.replace("Grade ", ""))
        
        enrollments = StudentEnrollmentRequest.objects.filter(
            teacher=request.user, # Ensure we only get students enrolled with THIS teacher
            status='approved',
            subject=quiz.subject,
            grade_level__in=possible_grades
        )
        
        if quiz.stream:
            enrollments = enrollments.filter(stream=quiz.stream)

        student_ids = enrollments.values_list('student_id', flat=True)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        eligible_students = User.objects.filter(id__in=student_ids, role='Student')
        
        return Response([{
            'id': s.id,
            'username': s.username,
            'email': s.email,
            'role': s.role
        } for s in eligible_students])

    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        """Export quiz as PDF."""
        quiz = self.get_object()
        
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
            from reportlab.lib import colors
            from reportlab.lib.enums import TA_CENTER, TA_LEFT
            from reportlab.pdfbase import pdfmetrics
            from reportlab.pdfbase.ttfonts import TTFont
            import os
            from io import BytesIO
            from django.http import HttpResponse
            
            # Register Ethiopic-compatible font
            font_name = 'Helvetica'  # Default fallback
            try:
                # Try Ebrima first (Standard on Windows 10/11 for Ethiopic/African scripts)
                ebrima_path = r'C:\Windows\Fonts\ebrima.ttf'
                nyala_path = r'C:\Windows\Fonts\nyala.ttf'
                
                if os.path.exists(ebrima_path):
                    pdfmetrics.registerFont(TTFont('Ebrima', ebrima_path))
                    font_name = 'Ebrima'
                elif os.path.exists(nyala_path):
                    pdfmetrics.registerFont(TTFont('Nyala', nyala_path))
                    font_name = 'Nyala'
                else:
                    logger.warning("No Ethiopic font found (Ebrima/Nyala). Amharic text may not render correctly.")
            except Exception as e:
                logger.warning(f"Failed to register Ethiopic font: {e}")

            # Create PDF buffer
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
            story = []
            styles = getSampleStyleSheet()
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                fontName=font_name,
                textColor=colors.HexColor('#1e40af'),
                spaceAfter=12,
                alignment=TA_CENTER
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                fontName=font_name,
                textColor=colors.HexColor('#1e40af'),
                spaceAfter=6,
                spaceBefore=12
            )
            
            question_style = ParagraphStyle(
                'Question',
                parent=styles['Normal'],
                fontSize=11,
                fontName=font_name,
                spaceAfter=6
            )
            
            option_style = ParagraphStyle(
                'Option',
                parent=styles['Normal'],
                fontSize=10,
                fontName=font_name,
                leftIndent=20,
                spaceAfter=3
            )
            
            # Title
            story.append(Paragraph(quiz.title, title_style))
            story.append(Spacer(1, 0.2*inch))
            
            # Administrative info table
            admin_data = [
                ['Subject:', quiz.subject, 'Grade:', quiz.grade_level],
                ['Topic:', quiz.topic, 'Duration:', f"{quiz.duration_minutes} minutes"],
                ['Difficulty:', quiz.difficulty, 'Type:', quiz.quiz_type],
            ]
            
            admin_table = Table(admin_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
            admin_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
                ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#e5e7eb')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), font_name),  # Apply font to table content
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            story.append(admin_table)
            story.append(Spacer(1, 0.3*inch))
            
            # Description
            if quiz.description:
                story.append(Paragraph("Description", heading_style))
                story.append(Paragraph(quiz.description, styles['Normal']))
                story.append(Spacer(1, 0.2*inch))
            
            # Questions
            story.append(Paragraph("Questions", heading_style))
            
            questions = quiz.questions.all().order_by('order')
            for i, question in enumerate(questions, 1):
                # Question text
                q_text = f"{i}. {question.text} ({question.points} pts)"
                story.append(Paragraph(q_text, question_style))
                
                # Options for Multiple Choice
                if question.question_type == 'multiple_choice' and question.options:
                    for j, option in enumerate(question.options):
                        option_label = chr(65 + j) # A, B, C...
                        story.append(Paragraph(f"{option_label}. {option}", option_style))
                
                # True/False
                elif question.question_type == 'true_false':
                    story.append(Paragraph("True / False", option_style))
                
                # Space between questions
                story.append(Spacer(1, 0.15*inch))
            
            # Answer Key (on new page)
            story.append(PageBreak())
            story.append(Paragraph("Answer Key", title_style))
            story.append(Spacer(1, 0.2*inch))
            
            for i, question in enumerate(questions, 1):
                answer_text = f"{i}. {question.correct_answer}"
                if question.explanation:
                    answer_text += f" - {question.explanation}"
                story.append(Paragraph(answer_text, styles['Normal']))
                story.append(Spacer(1, 0.1*inch))
                
            doc.build(story)
            buffer.seek(0)
            
            response = HttpResponse(buffer, content_type='application/pdf')
            filename = f"quiz_{quiz.id}_{quiz.title.replace(' ', '_')}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except ImportError:
            return Response({'error': 'PDF generation library not installed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Error generating PDF: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing quiz questions."""
    queryset = Question.objects.all()
    from .serializers import QuestionSerializer # Import locally to avoid circulars if any
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'Teacher':
             return Question.objects.filter(quiz__teacher=user)
        elif user.role == 'Student':
             # Students generally shouldn't list all questions directly, usually via Quiz
             # But if needed for taking the quiz:
             return Question.objects.filter(quiz__is_published=True)
        return Question.objects.none()


class QuizAttemptViewSet(viewsets.ModelViewSet):
    """ViewSet for managing quiz attempts."""
    
    queryset = QuizAttempt.objects.all()
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'Student':
            return QuizAttempt.objects.filter(student=user)
        elif user.role == 'Teacher':
            return QuizAttempt.objects.filter(quiz__teacher=user)
        return QuizAttempt.objects.none()

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit a quiz attempt."""
        attempt = self.get_object()
        if attempt.is_completed:
             return Response({'error': 'Quiz already submitted'}, status=status.HTTP_400_BAD_REQUEST)
             
        attempt.end_time = timezone.now()
        attempt.is_completed = True
        
        responses_data = request.data.get('responses', [])
        total_score = 0
        
        # Process responses
        for resp_data in responses_data:
            question_id = resp_data.get('question_id')
            response_text = resp_data.get('response_text')
            
            try:
                question = Question.objects.get(id=question_id, quiz=attempt.quiz)
            except Question.DoesNotExist:
                continue
                
            # Auto-grade objective questions
            is_correct = False
            score = 0
            feedback = ""
            
            if question.question_type in ['multiple_choice', 'true_false']:
                # Simple string comparison for now
                # For MC, correct_answer might be index or text
                if str(response_text).strip().lower() == str(question.correct_answer).strip().lower():
                    is_correct = True
                    score = question.points
                else:
                    # Check if correct_answer is an index (e.g. "0", "1")
                    try:
                        idx = int(question.correct_answer)
                        if question.options and 0 <= idx < len(question.options):
                             if str(response_text) == question.options[idx] or str(response_text) == str(idx):
                                 is_correct = True
                                 score = question.points
                    except ValueError:
                        pass
            
            # Save response
            QuestionResponse.objects.create(
                attempt=attempt,
                question=question,
                response_text=response_text,
                is_correct=is_correct if question.question_type in ['multiple_choice', 'true_false'] else None, # None for subjective
                score=score,
                feedback=feedback
            )
            total_score += score
            
        attempt.score = total_score
        attempt.save()
        
        # Trigger AI Grading for subjective questions (async in production, sync here for now)
        self._grade_subjective_questions(attempt)
        
        # Update StudentGrade
        self._update_gradebook(attempt)
        
        return Response(QuizAttemptSerializer(attempt).data)

    def _grade_subjective_questions(self, attempt):
        """Grade subjective questions using AI."""
        subjective_responses = attempt.responses.filter(
            question__question_type__in=['short_answer', 'essay', 'work_out'],
            score=0 # Only grade if not already graded (though we set 0 default)
        )
        
        if not subjective_responses.exists():
            return

        llm_service = LLMService()
        from ai_tools.essay_grader_enhancer import EssayGraderEnhancer
        
        for response in subjective_responses:
            question = response.question
            
            # Construct a dynamic rubric from the question details
            rubric = {
                'total_points': question.points,
                'criteria': [
                    {
                        'name': 'Accuracy & Completeness',
                        'points': question.points,
                        'description': f"Correct Answer/Key: {question.correct_answer}. Explanation: {question.explanation}"
                    }
                ]
            }
            
            # Build enhanced prompt
            prompt = EssayGraderEnhancer.build_grading_prompt(
                submission_text=response.response_text,
                rubric=rubric,
                assignment_description=question.text,
                assessment_type=question.question_type,
                grade_level=str(attempt.quiz.grade_level)
            )
            
            try:
                result = llm_service.generate_json(prompt)
                if result:
                    # Extract score and feedback
                    score = float(result.get('overallScore', 0))
                    feedback = result.get('overallFeedback', '')
                    
                    # Ensure score is within bounds
                    score = min(max(score, 0), question.points)
                    
                    response.score = score
                    response.feedback = feedback
                    response.is_correct = score >= (question.points * 0.5)
                    response.save()
            except Exception as e:
                logger.error(f"Error grading question {question.id}: {e}")
        
        # Recalculate total score
        attempt.score = attempt.responses.aggregate(total=Sum('score'))['total'] or 0
        attempt.save()

    def _update_gradebook(self, attempt):
        """Update or create StudentGrade entry."""
        # Find or create StudentGrade
        # We need to map Quiz to StudentGrade fields
        
        # Try to find matching grade item if linked to a course unit (future improvement)
        # For now, create a generic StudentGrade entry
        
        StudentGrade.objects.update_or_create(
            student=attempt.student,
            subject=attempt.quiz.subject,
            grade_level=attempt.quiz.grade_level,
            title=attempt.quiz.title,  # Use title to distinguish quizzes
            assignment_type='quiz' if attempt.quiz.quiz_type == 'Quiz' else None,
            exam_type=attempt.quiz.quiz_type if attempt.quiz.quiz_type != 'Quiz' else None,
            defaults={
                'score': attempt.score,
                'max_score': attempt.max_score,
                'graded_by': attempt.quiz.teacher,
                'graded_at': timezone.now(),
                'feedback': f"Auto-graded quiz: {attempt.quiz.title}"
            }
        )


def _build_question_count_retry_prompt(
    num_questions_needed: int,
    num_questions_received: int,
    subject: str,
    grade_level: str,
    topic: str,
    difficulty: str,
    question_types: List[str],
    context: str = "",
    attempt_number: int = 1
) -> str:
    """
    Build a retry prompt with progressively stronger emphasis on question count.
    
    Args:
        num_questions_needed: Target number of questions
        num_questions_received: Number of questions received in previous attempt
        subject: Subject name
        grade_level: Grade level
        topic: Topic/chapter
        difficulty: Difficulty level
        question_types: List of allowed question types
        context: RAG context (if available)
        attempt_number: Which retry attempt this is (1, 2, 3...)
    
    Returns:
        Enhanced retry prompt
    """
    missing_count = num_questions_needed - num_questions_received
    
    # Progressive emphasis based on attempt number
    if attempt_number == 1:
        emphasis = "IMPORTANT"
    elif attempt_number == 2:
        emphasis = "🚨 CRITICAL 🚨"
    else:
        emphasis = "⚠️⚠️⚠️ ABSOLUTELY MANDATORY ⚠️⚠️⚠️"
    
    prompt = f"""
{emphasis}: You previously generated {num_questions_received} questions, but I need EXACTLY {num_questions_needed} questions.

Generate {missing_count} MORE unique questions to complete the quiz.

Subject: {subject}
Grade: {grade_level}
Topic: {topic}
Difficulty: {difficulty}
Allowed Question Types: {', '.join(question_types)}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY {missing_count} new questions (no more, no less)
2. Do NOT repeat any previous questions
3. Ensure questions are DIFFERENT from what you already generated
4. Return ONLY the JSON object with the "questions" array
5. Use DOUBLE QUOTES for all JSON strings

DIVERSITY STRATEGY (Use these dimensions to find NEW questions):
- 🧠 FACTUAL RECALL: Ask about specific details you haven't asked yet.
- 💡 CONCEPTUAL: Ask "Why" or "How" something works.
- 🌍 SCENARIO: Create a simple situation where the concept applies.
- 📖 VOCABULARY: Ask for definitions or synonyms of key terms.
- 🕵️ INFERENCE: Ask what is implied but not stated.


"""
    
    if context:
        # Truncate context for retry to save tokens
        truncated_context = context[:3000] + "..." if len(context) > 3000 else context
        prompt += f"\nReference Context:\n{truncated_context}\n\n"
    
    prompt += f"""
JSON FORMAT:
{{
    "questions": [
        // ... {missing_count} question objects here ...
    ]
}}

COUNT CHECK: Before submitting, count your questions: 1, 2, 3... up to {missing_count}
"""
    
    return prompt


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz_view(request):
    """Generate a quiz using AI."""

    topic = request.data.get('topic')
    subject = request.data.get('subject')
    grade_level = request.data.get('grade_level')
    quiz_type = request.data.get('quiz_type', 'Quiz') # Quiz, Mid Exam, Final Exam
    num_questions = request.data.get('num_questions', 5)
    total_points = request.data.get('total_points', 10) # Default to 10 points
    difficulty = request.data.get('difficulty', 'Medium')
    use_rag = request.data.get('use_rag', False)
    question_types = request.data.get('question_types', ['multiple_choice']) # List of types
    question_counts = request.data.get('question_counts', {}) # Dict of count per type
    time_limits = request.data.get('time_limits', {}) # Dict of time limits per question type
    region = request.data.get('region', None)
    
    # Calculate average time limit for backward compatibility
    if time_limits:
        time_limit = sum(time_limits.get(qt, 60) for qt in question_types) // len(question_types) if question_types else 60
    else:
        time_limit = request.data.get('time_limit', 60) # Fallback to single time_limit
    
    if not subject:
        return Response({'error': 'Subject is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Subject-aware question type validation and filtering
    math_subjects = ['mathematics', 'physics', 'chemistry']
    is_math_subject = any(s in subject.lower() for s in math_subjects)
    
    # Filter question types based on subject
    validated_question_types = []
    for qtype in question_types:
        if qtype == 'work_out' and not is_math_subject:
            logger.warning(f"Removing 'work_out' question type - not applicable for {subject}")
            continue
        if qtype == 'essay' and 'mathematics' in subject.lower():
            logger.warning(f"Removing 'essay' question type - not typical for {subject}")
            continue
        validated_question_types.append(qtype)
    
    # Ensure at least one question type remains
    if not validated_question_types:
        validated_question_types = ['multiple_choice']
        logger.info(f"No valid question types after filtering, defaulting to multiple_choice")
    
    question_types = validated_question_types
    
    # Allow overriding num_questions if counts are provided and consistent
    if question_counts:
        # Sum only validated types
        total_count = sum(question_counts.get(qt, 0) for qt in question_types)
        if total_count > 0:
            logger.info(f"Using sum of question_counts ({total_count}) instead of num_questions ({num_questions})")
            num_questions = total_count

    llm_service = LLMService()
    
    context = ""
    rag_info = "Standard generation (No RAG)"
    
    if use_rag and topic:
        try:
            from rag.chapter_aware_rag import ChapterBoundaryDetector, ChapterContentExtractor
            from rag.services import query_curriculum_documents  # Import as function, not from rag_service
            
            # 1. Detect Chapter
            chapter_num = ChapterBoundaryDetector.detect_chapter_number(topic)
            
            if chapter_num:
                logger.info(f"📚 Detected Chapter {chapter_num} for Quiz Generation")
                
                # 2. Extract Full Chapter Content via Service
                documents = query_curriculum_documents(  # Call as function
                    grade=grade_level,
                    subject=subject,
                    query=f"chapter {chapter_num}",
                    chapter=str(chapter_num),
                    region=region,
                    extract_full_chapter=True
                )
                
                if documents and any(d.get('full_chapter') for d in documents):
                    logger.info(f"✅ Full chapter content extracted via service for Chapter {chapter_num}")
                    context, _ = QuizGeneratorRAGEnhancer.format_quiz_context(documents, topic, {'number': chapter_num})
                    rag_info = f"Full Chapter {chapter_num} Content"
                else:
                    logger.warning(f"⚠️ Full chapter extraction failed, falling back to standard RAG")
                    # Fallback to standard RAG
                    documents = query_curriculum_documents(
                        grade=grade_level,
                        subject=subject,
                        query=topic,
                        region=region,
                        top_k=10
                    )

                    if documents:
                        context, _ = QuizGeneratorRAGEnhancer.format_quiz_context(documents, topic, {'number': chapter_num})
                        rag_info = "Standard RAG (Chunks)"
                    else:
                        logger.warning("⚠️ No documents retrieved from RAG")
                        rag_info = "RAG: No documents found"
            
            else:
                # No specific chapter detected, use standard RAG with topic
                logger.info(f"ℹ️ No specific chapter number detected for '{topic}', using standard RAG")
                documents = query_curriculum_documents(
                    grade=grade_level,
                    subject=subject,
                    query=topic,
                    region=region,
                    top_k=10
                )
                
                if documents:
                    context, _ = QuizGeneratorRAGEnhancer.format_quiz_context(documents, topic, {})
                    rag_info = "Standard RAG (Topic-based)"
                else:
                    rag_info = "RAG: No documents found"

        except Exception as e:
            logger.error(f"❌ RAG Error in Quiz Generator: {e}")
            # Continue without RAG context
            rag_info = f"RAG Error: {str(e)}"

    # Build Prompt
    chapter_title = None
    chapter_objectives = None
    topics = None
    has_explicit_objectives = False
    
    if context:
        # Extract chapter information for better question generation
        try:
            from ai_tools.chapter_assistant_enhancer import ChapterAssistantEnhancer
            
            # Pre-extract chapter info from RAG context
            chapter_extracted_info = ChapterAssistantEnhancer.pre_extract_from_rag_context(
                rag_context=context,
                chapter_number=chapter_num if 'chapter_num' in locals() else None
            )
            
            chapter_title = chapter_extracted_info.get('chapter_title')
            chapter_objectives = chapter_extracted_info.get('objectives', [])
            topics = chapter_extracted_info.get('topics', [])
            has_explicit_objectives = chapter_extracted_info.get('has_explicit_objectives', False)
            
            logger.info(f"📚 Extracted chapter info: title='{chapter_title}', objectives={len(chapter_objectives)}, topics={len(topics)}, explicit_objectives={has_explicit_objectives}")
            
        except Exception as e:
            logger.warning(f"⚠️ Could not extract chapter info: {e}")
        
        # Use the enhanced textbook-aligned prompt with chapter objectives
        prompt = QuizGeneratorRAGEnhancer.build_textbook_aligned_prompt(
            context=context,
            topic=topic,
            subject=subject,
            grade_level=grade_level,
            quiz_type=quiz_type,
            difficulty=difficulty,
            num_questions=num_questions,
            question_types=question_types,
            rag_info=rag_info,
            chapter_title=chapter_title,
            chapter_objectives=chapter_objectives,
            topics=topics,
            has_explicit_objectives=has_explicit_objectives,
            time_limit=time_limit,
            total_points=total_points,
            question_counts=question_counts
        )
    else:
        # Standard prompt for non-RAG generation
        topic_str = f'on the topic: "{topic}"' if topic else "covering general topics suitable for this grade level"
        
        type_instruction = f"Allowed Question Types: {', '.join(question_types)}"
        if question_counts:
             dist_lines = [f"{count} {qt.replace('_', ' ').title()} questions" for qt, count in question_counts.items() if qt in question_types and count > 0]
             if dist_lines:
                 type_instruction = "GENERATE EXACTLY:\n- " + "\n- ".join(dist_lines)

        prompt = f"""
        Generate a {difficulty} {quiz_type} for {subject} Grade {grade_level} {topic_str}.
        
        Generate {num_questions} questions worth a TOTAL of {total_points} points.
        The sum of all question points MUST be exactly {total_points}.
        Distribute points based on difficulty (e.g., harder questions = more points).
        {type_instruction}
        
        Return a JSON object with the following structure:
        {{
            "title": "Quiz Title",
            "description": "Brief description based on {rag_info}",
            "questions": [
                {{
                    "text": "Question text",
                    "type": "multiple_choice",  // One of: multiple_choice, true_false, short_answer, essay, work_out
                    "points": 1.0,
                    "time_limit": {time_limit}, // Recommended time limit in seconds
                    "options": ["Option A", "Option B", "Option C", "Option D"], // Only for multiple_choice
                    "correct_answer": "Option A", // Or index, or True/False, or sample answer
                    "explanation": "Explanation for the correct answer",
                    "hint": "Hint for the student"
                }}
            ]
        }}
        """
    
    try:
        quiz_data = llm_service.generate_json(
            prompt,
            metadata={
                'num_questions': num_questions,
                'question_types': question_types,
                'difficulty': difficulty
            }
        )
        
        # Validate that quiz_data is a dict before proceeding
        if not isinstance(quiz_data, dict):
            logger.error(f"LLM returned non-dict type: {type(quiz_data)}")
            return Response({
                'error': f'Invalid response format from LLM: expected dict, got {type(quiz_data).__name__}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Validate quiz quality
        questions = quiz_data.get('questions', [])
        validation_warnings = []
        
        # 1. Check and FIX question count
        if len(questions) != num_questions:
            warning = f"Expected {num_questions} questions, got {len(questions)}"
            logger.warning(f"⚠️ {warning}")
            validation_warnings.append(warning)
            
            # AUTO-FIX: Trim or pad to correct count
            if len(questions) > num_questions:
                # Too many questions - keep the first num_questions
                quiz_data['questions'] = questions[:num_questions]
                logger.info(f"✂️ Trimmed quiz from {len(questions)} to {num_questions} questions")
        # 1. Filter initial questions (Duplicates & Assignments)
        def filter_questions(qs):
            seen = set()
            unique = []
            valid = []
            
            # Deduplicate
            for q in qs:
                # Handle string questions (auto-convert)
                if isinstance(q, str):
                    q = {
                        "text": q,
                        "type": "short_answer", # Default to short answer if just text
                        "points": 1.0,
                        "explanation": "Generated from fallback text",
                        "correct_answer": "Check textbook"
                    }
                
                if not isinstance(q, dict):
                    continue
                
                # Normalize keys: 'question' -> 'text'
                if 'question' in q and 'text' not in q:
                    q['text'] = q['question']
                    
                text = q.get('text', '').lower().strip()
                
                # If text is empty, try to find any string value to identify duplicate
                if not text:
                     # Fallback to first string value found
                     for v in q.values():
                         if isinstance(v, str):
                             text = v.lower().strip()
                             break
                
                if text and text not in seen:
                    seen.add(text)
                    unique.append(q)
                else:
                    logger.warning(f"🗑️ Removed duplicate: {text[:30]}...")
            
            # Filter assignments
            assignment_keywords = ['interview', 'visit', 'survey', 'collect samples', 'presentation', 'project', 'research and report', 'ask them', 'in groups', 'work with a partner']
            for q in unique:
                text = q.get('text', '').lower()
                if not any(keyword in text for keyword in assignment_keywords):
                    valid.append(q)
                else:
                    logger.warning(f"🗑️ Removed assignment: {text[:30]}...")
            
            return valid

        # Apply filtering to initial batch
        questions = filter_questions(questions)
        quiz_data['questions'] = questions
        
        # 2. Check count and retry if needed
        if len(questions) < num_questions:
            missing_count = num_questions - len(questions)
            logger.info(f"⚠️ Missing {missing_count} questions after filtering. Attempting to generate more...")
            
            for attempt in range(1, 4):
                try:
                    logger.info(f"📝 Retry attempt {attempt}/3 for {missing_count} missing questions")
                    
                    retry_prompt = _build_question_count_retry_prompt(
                        num_questions_needed=num_questions,
                        num_questions_received=len(questions),
                        subject=subject,
                        grade_level=grade_level,
                        topic=topic,
                        difficulty=difficulty,
                        question_types=question_types,
                        context=context,
                        attempt_number=attempt
                    )
                    
                    # Force JSON mode for retry
                    retry_data = llm_service.generate_json(retry_prompt)
                    
                    if isinstance(retry_data, dict):
                        new_questions = retry_data.get('questions', [])
                        if new_questions:
                            # Filter new questions (handles strings now)
                            valid_new = filter_questions(new_questions)
                            
                            # Add only if not already in main list
                            current_texts = set(q.get('text', '').lower().strip() for q in questions)
                            added_count = 0
                            for q in valid_new:
                                q_text = q.get('text', '').lower().strip()
                                if q_text not in current_texts:
                                    questions.append(q)
                                    current_texts.add(q_text)
                                    added_count += 1
                            
                            quiz_data['questions'] = questions
                            logger.info(f"✅ Added {added_count} valid questions. Total: {len(questions)}")
                            
                            if len(questions) >= num_questions:
                                if len(questions) > num_questions:
                                    quiz_data['questions'] = questions[:num_questions]
                                break
                            
                            missing_count = num_questions - len(questions)
                except Exception as e:
                    logger.error(f"❌ Retry failed: {e}")
                    # Don't break, try next attempt

        # Final count check
        final_count = len(questions)
        if final_count < num_questions:
            missing_after_filter = num_questions - final_count
            logger.warning(f"⚠️ After filtering, only {final_count}/{num_questions} questions remain. Need {missing_after_filter} more.")
            validation_warnings.append(f"After filtering, regenerated {missing_after_filter} questions to reach target count")
            
            # Note: In production, you might want to trigger regeneration here
            # For now, we'll just trim to what we have or pad with a message
            if final_count == 0:
                return Response({
                    'error': 'All generated questions were filtered out as duplicates or assignment-type. Please try again.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # 5. Final trim to exactly {num_questions} questions
        if len(questions) > num_questions:
            quiz_data['questions'] = questions[:num_questions]
            logger.info(f"✂️ Final trim to exactly {num_questions} questions")
        
        # 6. Enforce Main Topic / Chapter Title
        # The user wants the "Main Topic" displayed at the top.
        # We use the extracted chapter_title if available, as it's more accurate than LLM generation.
        if use_rag and chapter_title and "Chapter" not in chapter_title and "Unit" not in chapter_title:
             # Clean up title
             clean_title = chapter_title.strip()
             final_title = f"{clean_title} - {quiz_type}"
             quiz_data['title'] = final_title
             logger.info(f"🏷️ Enforced Quiz Title: {final_title}")
        elif topic:
             # Fallback to user-provided topic if RAG didn't give a good title
             final_title = f"{topic} - {quiz_type}"
             if quiz_data.get('title') != final_title:
                 quiz_data['title'] = final_title
                 logger.info(f"🏷️ Enforced Quiz Title (Topic): {final_title}")

        # Add validation warnings to response if any
        if validation_warnings:
            quiz_data['validation_warnings'] = validation_warnings
            logger.warning(f"Quiz generated with {len(validation_warnings)} validation warnings")
        
        # 3. Normalize Points to match Total Points
        current_total = sum(float(q.get('points', 0)) for q in questions)
        
        if abs(current_total - total_points) > 0.1: # Allow small float error
            logger.info(f"⚖️ Normalizing points. Current: {current_total}, Target: {total_points}")
            
            # Strategy: Proportional distribution
            # 1. Calculate relative weights based on initial points (or difficulty)
            # 2. Distribute total_points according to weights
            # 3. Round to nearest 0.5 for clean numbers
            # 4. Adjust last question to fix rounding errors
            
            cleaned_questions = []
            running_total = 0
            
            for i, q in enumerate(questions):
                # Ensure points is positive
                orig_points = max(float(q.get('points', 1)), 0.5) 
                
                # Calculate weight
                weight = orig_points / current_total if current_total > 0 else 1.0 / len(questions)
                
                # Assign new target points
                new_points_raw = weight * total_points
                
                # Round to nearest 0.5
                new_points = round(new_points_raw * 2) / 2
                
                # Ensure minimum 0.5 points
                if new_points < 0.5:
                    new_points = 0.5
                
                q['points'] = new_points
                running_total += new_points
                cleaned_questions.append(q)
            
            # Final Adjustment (fix rounding drift)
            diff = total_points - running_total
            if diff != 0:
                # Add remainder to the last question (or largest question)
                # Adding to the last question is simplest
                last_q = cleaned_questions[-1]
                last_q['points'] = max(0.5, last_q['points'] + diff)
                # Round again just in case
                last_q['points'] = round(last_q['points'] * 2) / 2
                logger.info(f"🔧 Adjusted last question by {diff} to match total")

            questions = cleaned_questions

        return Response(quiz_data)
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

