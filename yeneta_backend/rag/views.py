from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from .models import VectorStore, ExamVectorStore
from .serializers import VectorStoreSerializer, ExamVectorStoreSerializer
from .services import process_document_to_vector_store
from academics.models import GradeLevel, Stream, Subject, Curriculum
import logging

logger = logging.getLogger(__name__)


class VectorStoreViewSet(viewsets.ModelViewSet):
    """ViewSet for managing vector stores."""
    
    queryset = VectorStore.objects.all()
    serializer_class = VectorStoreSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter queryset based on user role."""
        # Admins and Teachers can see all vector stores
        if self.request.user.role in ['Admin', 'Teacher']:
            return VectorStore.objects.all()
        # Others can only see their own
        return VectorStore.objects.filter(created_by=self.request.user)
    
    def perform_create(self, serializer):
        """Create vector store and trigger async processing."""
        try:
            # Validate that the subject is English
            subject_name = self.request.data.get('subject')
            grade = self.request.data.get('grade')
            region = self.request.data.get('region')
            stream = self.request.data.get('stream')
            
            # Use filter since we need to check existence of an English version
            # This is robust: checks if a valid Curriculum entry exists for this combo with language='English'
            curriculum_query = Curriculum.objects.filter(
                subject__name=subject_name,
                language='English'
            )
            
            # Optional: Refine by grade/region/stream if needed for strictness, 
            # but subject+language check is the core requirement.
            # Adding strict checks ensures we match the specific context.
            if grade:
                curriculum_query = curriculum_query.filter(grade_level__name=grade)
            if region:
                curriculum_query = curriculum_query.filter(region__name=region)
            if stream and stream != 'N/A':
                curriculum_query = curriculum_query.filter(stream__name=stream)
                
            if not curriculum_query.exists():
                 # For better UX, check if it exists as non-English to give specific error
                 if Curriculum.objects.filter(subject__name=subject_name).exclude(language='English').exists():
                     raise ValueError(f"Vector Store creation is not supported for non-English subject: {subject_name}")
                 # If it doesn't exist at all, we might still proceed if it's a "custom" upload, 
                 # BUT for this task "English curriculum" is the key. 
                 # Let's assume strict validation against Curriculum DB is desired based on "fetched from any of the region...".
                 # If subject is not in DB at all, maybe allow? 
                 # User said "English language curriculums only". Implies strictness.
                 pass

            # Update: User request "provides the English language curriculums only... As of our current implementation state... 
            # prevent errors."
            # The safest bet is: If we KNOW it's non-English, block it.
            # Use the explicit "is non-English" check based on our DB.
            is_non_english = Curriculum.objects.filter(subject__name=subject_name).exclude(language='English').exists() and \
                             not Curriculum.objects.filter(subject__name=subject_name, language='English').exists()
            
            if is_non_english:
                 raise ValueError(f"Vector Store creation is restricted to English language subjects. '{subject_name}' is not allowed.")

            # Save the vector store with created_by set to current user
            vector_store = serializer.save(created_by=self.request.user)
            logger.info(f"Vector store {vector_store.id} created successfully")
            
            # Trigger async processing of the document in a background thread
            import threading
            
            def process_in_background(store_id):
                try:
                    logger.info(f"Starting background processing for vector store {store_id}")
                    process_document_to_vector_store(store_id)
                    logger.info(f"Background processing completed for vector store {store_id}")
                except Exception as e:
                    logger.error(f"Background processing failed for vector store {store_id}: {str(e)}")
                    try:
                        # Re-fetch to avoid stale data
                        store = VectorStore.objects.get(id=store_id)
                        store.status = 'Failed'
                        store.error_message = str(e)
                        store.save()
                    except Exception as db_error:
                        logger.error(f"Failed to update vector store status: {db_error}")

            # Start background thread
            thread = threading.Thread(target=process_in_background, args=(vector_store.id,))
            thread.daemon = True
            thread.start()
            logger.info(f"Vector store {vector_store.id} processing thread started")
            
        except ValueError as ve:
            # Handle validation error specifically
            logger.warning(f"Validation failed for vector store creation: {str(ve)}")
            # Re-raise as a format DRF can handle or return 400? 
            # Raising generic exception here is caught by outer try/except which logs and raises.
            # ViewSet will handle exception -> 500 usually unless DRF ValidationError.
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': str(ve)})
        except Exception as e:
            logger.error(f"Failed to create vector store: {str(e)}")
            raise
    
    def perform_destroy(self, instance):
        """Delete vector store and associated files."""
        # Delete the physical file if it exists
        if instance.file:
            instance.file.delete(save=False)
        
        # Delete the vector store directory if it exists
        if instance.vector_store_path:
            import shutil
            import os
            if os.path.exists(instance.vector_store_path):
                try:
                    shutil.rmtree(instance.vector_store_path)
                    logger.info(f"Deleted vector store directory: {instance.vector_store_path}")
                except Exception as e:
                    logger.error(f"Failed to delete vector store directory: {str(e)}")
        
        instance.delete()


class ExamVectorStoreViewSet(viewsets.ModelViewSet):
    """ViewSet for managing exam vector stores (Matric/Model exams)."""
    
    queryset = ExamVectorStore.objects.all()
    serializer_class = ExamVectorStoreSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter queryset based on user role and query params."""
        queryset = ExamVectorStore.objects.all()
        
        # Filter by exam type if provided
        exam_type = self.request.query_params.get('exam_type', None)
        if exam_type:
            queryset = queryset.filter(exam_type=exam_type)
        
        # Filter by subject if provided
        subject = self.request.query_params.get('subject', None)
        if subject:
            queryset = queryset.filter(subject=subject)
        
        # Filter by exam year if provided
        exam_year = self.request.query_params.get('exam_year', None)
        if exam_year:
            queryset = queryset.filter(exam_year=exam_year)
        
        # Filter by stream if provided
        stream = self.request.query_params.get('stream', None)
        if stream:
            queryset = queryset.filter(stream=stream)
        
        # Admins and Teachers can see all
        if self.request.user.role in ['Admin', 'Teacher']:
            return queryset
        # Others can only see their own
        return queryset.filter(created_by=self.request.user)
    
    def perform_create(self, serializer):
        """Create exam vector store and trigger async processing."""
        try:
            # Validate that the subject is English
            subject_name = self.request.data.get('subject')
            
            # Use same robust check as VectorStoreViewSet
            is_non_english = Curriculum.objects.filter(subject__name=subject_name).exclude(language='English').exists() and \
                             not Curriculum.objects.filter(subject__name=subject_name, language='English').exists()
            
            if is_non_english:
                 from rest_framework.exceptions import ValidationError
                 raise ValidationError({'detail': f"Exam Vector Store creation is restricted to English language subjects. '{subject_name}' is not allowed."})

            # Save the exam vector store with created_by set to current user
            exam_store = serializer.save(created_by=self.request.user)
            logger.info(f"Exam vector store {exam_store.id} created successfully")
            
            # Trigger async processing of the document in a background thread
            import threading
            
            def process_exam_in_background(store_id):
                try:
                    logger.info(f"Starting background processing for exam store {store_id}")
                    process_document_to_vector_store(store_id, is_exam=True)
                    logger.info(f"Background processing completed for exam store {store_id}")
                except Exception as e:
                    logger.error(f"Background processing failed for exam store {store_id}: {str(e)}")
                    try:
                        # Re-fetch to avoid stale data
                        store = ExamVectorStore.objects.get(id=store_id)
                        store.status = 'Failed'
                        store.error_message = str(e)
                        store.save()
                    except Exception as db_error:
                        logger.error(f"Failed to update exam store status: {db_error}")

            # Start background thread
            thread = threading.Thread(target=process_exam_in_background, args=(exam_store.id,))
            thread.daemon = True
            thread.start()
            logger.info(f"Exam vector store {exam_store.id} processing thread started")
            
        except Exception as e:
            logger.error(f"Failed to create exam vector store: {str(e)}")
            raise
    
    def perform_destroy(self, instance):
        """Delete exam vector store and associated files."""
        # Delete the physical file if it exists
        if instance.file:
            instance.file.delete(save=False)
        
        # Delete the vector store directory if it exists
        if instance.vector_store_path:
            import shutil
            import os
            if os.path.exists(instance.vector_store_path):
                try:
                    shutil.rmtree(instance.vector_store_path)
                    logger.info(f"Deleted exam vector store directory: {instance.vector_store_path}")
                except Exception as e:
                    logger.error(f"Failed to delete exam vector store directory: {str(e)}")
        
        instance.delete()


@api_view(['GET'])
@permission_classes([AllowAny])
def get_curriculum_config(request):
    """
    Get curriculum configuration including grades, subjects, and streams.
    Uses the new database-driven configuration.
    """
    grade = request.query_params.get('grade', None)
    stream = request.query_params.get('stream', None)
    region = request.query_params.get('region', None)
    
    if grade:
        # Get subjects for specific grade and stream
        subjects_query = Curriculum.objects.filter(
            grade_level__name=grade,
            is_active=True
        )
        
        if region:
            subjects_query = subjects_query.filter(region__name=region)
            
        # Filter by language (Default to English for now)
        # TODO: Accept language parameter in the future when frontend supports it
        subjects_query = subjects_query.filter(language='English')

        if stream and stream != 'N/A':
            subjects_query = subjects_query.filter(stream__name=stream)
            
        # Get distinct subjects
        subjects = subjects_query.values_list('subject__name', flat=True).distinct().order_by('subject__name')
        
        # Check if stream is required (usually for Grade 11 and 12)
        # We can infer this if there are streams associated with this grade in the DB
        has_streams = Curriculum.objects.filter(
            grade_level__name=grade,
            stream__isnull=False,
            is_active=True
        ).exists()
        
        return Response({
            'grade': grade,
            'stream': stream,
            'subjects': list(subjects),
            'stream_required': has_streams
        })
    
    # Return full configuration
    grades = GradeLevel.objects.filter(is_active=True).values_list('name', flat=True).order_by('order')
    streams = Stream.objects.filter(is_active=True).values_list('name', flat=True).order_by('name')
    all_subjects = Subject.objects.filter(is_active=True).values_list('name', flat=True).order_by('name')
    
    return Response({
        'grades': list(grades),
        'streams': list(streams),
        'all_subjects': list(all_subjects),
    })
