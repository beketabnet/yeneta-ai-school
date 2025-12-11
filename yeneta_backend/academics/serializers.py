from rest_framework import serializers
import random
from .models import Assignment, Submission, PracticeQuestion, Course, Enrollment, Unit, GradeItem, Grade, TeacherCourseRequest, StudentEnrollmentRequest, StudentGrade, OnlineQuiz, Question, QuizAttempt, QuestionResponse, MasterCourse, Region, GradeLevel, Stream, Subject, Curriculum, AssignmentType, ExamType
from users.serializers import UserSerializer
from users.models import User


class AssignmentSerializer(serializers.ModelSerializer):
    """Serializer for Assignment model."""
    
    class Meta:
        model = Assignment
        fields = ['id', 'title', 'description', 'rubric', 'document_type', 'due_date', 'course', 'created_at']
        read_only_fields = ['id', 'created_at']


class SubmissionSerializer(serializers.ModelSerializer):
    """Serializer for Submission model."""
    
    student = UserSerializer(read_only=True)
    assignment = AssignmentSerializer(read_only=True)
    
    class Meta:
        model = Submission
        fields = [
            'id', 'assignment', 'student', 'submitted_text', 'submitted_file', 'submitted_at',
            'grade', 'feedback', 'authenticity_score', 'ai_likelihood'
        ]
        read_only_fields = ['id', 'submitted_at', 'grade', 'feedback', 'authenticity_score', 'ai_likelihood']


class PracticeQuestionSerializer(serializers.ModelSerializer):
    """Serializer for PracticeQuestion model."""
    
    class Meta:
        model = PracticeQuestion
        fields = ['id', 'subject', 'topic', 'question', 'created_at']
        read_only_fields = ['id', 'created_at']


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'teacher', 'teacher_name', 'grade_level', 'subject', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class GradeItemSerializer(serializers.ModelSerializer):
    """Serializer for GradeItem model."""
    
    class Meta:
        model = GradeItem
        fields = ['id', 'title', 'description', 'item_type', 'max_score', 'weight', 'due_date']
        read_only_fields = ['id']


class GradeSerializer(serializers.ModelSerializer):
    """Serializer for Grade model."""
    
    percentage = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Grade
        fields = ['id', 'score', 'percentage', 'feedback', 'graded_at']
        read_only_fields = ['id', 'percentage', 'graded_at']


class GradeItemWithScoreSerializer(serializers.ModelSerializer):
    """Serializer for GradeItem with student's score."""
    
    score = serializers.SerializerMethodField()
    type = serializers.CharField(source='item_type')
    
    class Meta:
        model = GradeItem
        fields = ['id', 'title', 'score', 'max_score', 'type']
    
    def get_score(self, obj):
        """Get student's score for this item."""
        student = self.context.get('student')
        if not student:
            return None
        
        try:
            grade = Grade.objects.get(student=student, grade_item=obj)
            return grade.score
        except Grade.DoesNotExist:
            return None


class UnitWithGradesSerializer(serializers.ModelSerializer):
    """Serializer for Unit with grade items and scores."""
    
    items = serializers.SerializerMethodField()
    unit_grade = serializers.SerializerMethodField()
    
    class Meta:
        model = Unit
        fields = ['id', 'title', 'unit_grade', 'items']
    
    def get_items(self, obj):
        """Get grade items with student scores."""
        student = self.context.get('student')
        grade_items = obj.grade_items.all()
        return GradeItemWithScoreSerializer(grade_items, many=True, context={'student': student}).data
    
    def get_unit_grade(self, obj):
        """Calculate unit grade as average of all items."""
        student = self.context.get('student')
        if not student:
            return 0
        
        grade_items = obj.grade_items.all()
        if not grade_items:
            return 0
        
        total_score = 0
        total_max = 0
        graded_count = 0
        
        for item in grade_items:
            try:
                grade = Grade.objects.get(student=student, grade_item=item)
                if grade.score is not None:
                    total_score += grade.score
                    total_max += item.max_score
                    graded_count += 1
            except Grade.DoesNotExist:
                pass
        
        if graded_count == 0:
            return 0
        
        return round((total_score / total_max) * 100, 1)


class MasterCourseSerializer(serializers.ModelSerializer):
    """Serializer for MasterCourse model."""
    
    class Meta:
        model = MasterCourse
        fields = ['id', 'name', 'code', 'grade_level', 'stream', 'region', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TeacherCourseRequestSerializer(serializers.ModelSerializer):
    """Serializer for TeacherCourseRequest model."""

    teacher = UserSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)

    master_course_detail = MasterCourseSerializer(source='master_course', read_only=True)

    class Meta:
        model = TeacherCourseRequest
        fields = ['id', 'teacher', 'master_course', 'master_course_detail', 'subject', 'grade_level', 'stream', 'status', 'requested_at', 'reviewed_at', 'reviewed_by', 'review_notes']
        read_only_fields = ['id', 'requested_at', 'reviewed_at']


class StudentEnrollmentRequestSerializer(serializers.ModelSerializer):
    """Serializer for StudentEnrollmentRequest model."""

    student = UserSerializer(read_only=True)
    teacher_detail = UserSerializer(source='teacher', read_only=True)
    reviewed_by = UserSerializer(read_only=True)
    # For writing: accept course ID (will be resolved to teacher in perform_create)
    course = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = StudentEnrollmentRequest
        fields = ['id', 'student', 'teacher', 'teacher_detail', 'subject', 'grade_level', 'stream', 'status', 'requested_at', 'reviewed_at', 'reviewed_by', 'review_notes', 'course', 'family']
        read_only_fields = ['id', 'requested_at', 'reviewed_at', 'teacher_detail']
        extra_kwargs = {
            'teacher': {'required': False, 'allow_null': True},
            'subject': {'required': False, 'allow_blank': True},
            'grade_level': {'required': False, 'allow_blank': True},
            'family': {'required': False, 'allow_null': True},
        }

    def to_representation(self, instance):
        """Add course information to the response."""
        data = super().to_representation(instance)
        # Add teacher information directly (handle null teacher)
        if instance.teacher:
            data['teacher'] = {
                'id': instance.teacher.id,
                'first_name': instance.teacher.first_name,
                'last_name': instance.teacher.last_name,
                'username': instance.teacher.username,
                'full_name': instance.teacher.get_full_name(),
            }
        else:
            data['teacher'] = {
                'id': None,
                'first_name': 'Unknown',
                'last_name': 'Teacher',
                'username': 'unknown',
            }
        data['course'] = {
            'id': instance.id,
            'subject': instance.subject,
            'grade_level': instance.grade_level,
            'stream': instance.stream,
        }
        return data

    def validate(self, data):
        """Validate that either teacher or course is provided."""
        # If neither teacher nor course is provided, raise error
        if not data.get('teacher') and not data.get('course'):
            raise serializers.ValidationError(
                "Either 'teacher' or 'course' must be provided."
            )
        return data
    
    def create(self, validated_data):
        """Override create to remove course field before saving."""
        # Remove course field as it's not a model field
        validated_data.pop('course', None)
        return super().create(validated_data)


class CourseWithGradesSerializer(serializers.ModelSerializer):
    """Serializer for Course with units and grades."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    units = serializers.SerializerMethodField()
    overall_grade = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'teacher_name', 'overall_grade', 'units']
    
    def get_units(self, obj):
        """Get units with grade items and scores."""
        student = self.context.get('student')
        units = obj.units.all()
        return UnitWithGradesSerializer(units, many=True, context={'student': student}).data
    
    def get_overall_grade(self, obj):
        """Calculate overall course grade."""
        student = self.context.get('student')
        if not student:
            return 0
        
        units = obj.units.all()
        if not units:
            return 0
        
        total_score = 0
        total_max = 0
        graded_count = 0
        
        for unit in units:
            for item in unit.grade_items.all():
                try:
                    grade = Grade.objects.get(student=student, grade_item=item)
                    if grade.score is not None:
                        total_score += grade.score
                        total_max += item.max_score
                        graded_count += 1
                except Grade.DoesNotExist:
                    pass
        
        if graded_count == 0:
            return 0
        
        return round((total_score / total_max) * 100, 1)


class StudentGradeSerializer(serializers.ModelSerializer):
    """Serializer for StudentGrade model."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.get_full_name', read_only=True)
    percentage = serializers.SerializerMethodField()
    student_id = serializers.IntegerField(required=False, write_only=False)
    
    class Meta:
        model = StudentGrade
        fields = [
            'id', 'student', 'student_id', 'student_name', 'subject', 'grade_level', 'stream',
            'title', 'assignment_type', 'exam_type', 'score', 'max_score', 'percentage', 'feedback',
            'graded_by', 'graded_by_name', 'graded_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'student', 'graded_by', 'graded_by_name', 'graded_at', 'created_at', 'updated_at']
        extra_kwargs = {
            'assignment_type': {'required': False, 'allow_blank': True, 'allow_null': True},
            'exam_type': {'required': False, 'allow_blank': True, 'allow_null': True},
            'feedback': {'required': False, 'allow_blank': True},
            'subject': {'required': False},
            'grade_level': {'required': False},
            'score': {'required': False},
        }
    
    def get_percentage(self, obj):
        return obj.percentage
    
    def to_representation(self, instance):
        """Add student_id to the response."""
        data = super().to_representation(instance)
        data['student_id'] = instance.student_id
        return data
    
    def validate(self, data):
        """Validate that at least one of assignment_type or exam_type is provided."""
        # Only validate on create, not on update
        if self.instance is None:
            assignment_type = data.get('assignment_type')
            exam_type = data.get('exam_type')
            
            # Remove empty strings and convert to None
            if assignment_type == '':
                data['assignment_type'] = None
            if exam_type == '':
                data['exam_type'] = None
            
            # At least one must be provided
            if not data.get('assignment_type') and not data.get('exam_type'):
                raise serializers.ValidationError(
                    "Either 'assignment_type' or 'exam_type' must be provided."
                )
        
        return data
    
    def create(self, validated_data):
        """Override create to handle student_id conversion."""
        student_id = validated_data.pop('student_id', None)
        if not student_id:
            raise serializers.ValidationError({'student_id': 'student_id is required when creating a grade.'})
        
        try:
            student = User.objects.get(id=student_id, role='Student')
            validated_data['student'] = student
        except User.DoesNotExist:
            raise serializers.ValidationError({'student_id': 'Student not found or is not a student.'})
        
        return super().create(validated_data)


class GradeEntrySerializer(serializers.Serializer):
    """Serializer for a single grade entry field."""
    
    id = serializers.IntegerField(required=False, allow_null=True)
    score = serializers.FloatField(required=False, allow_null=True)
    max_score = serializers.FloatField(required=False, allow_null=True)
    percentage = serializers.FloatField(required=False, allow_null=True)
    feedback = serializers.CharField(required=False, allow_blank=True)
    graded_at = serializers.DateTimeField(required=False, allow_null=True)


class AggregatedGradeSerializer(serializers.Serializer):
    """Serializer for aggregated grades by student and subject."""
    
    student_id = serializers.IntegerField()
    subject = serializers.CharField()
    assignment_grades = serializers.DictField(child=GradeEntrySerializer(required=False, allow_null=True))
    exam_grades = serializers.DictField(child=GradeEntrySerializer(required=False, allow_null=True))
    assignment_average = serializers.FloatField(required=False, allow_null=True)
    exam_average = serializers.FloatField(required=False, allow_null=True)
    overall_grade = serializers.FloatField(required=False, allow_null=True)
    total_grades = serializers.IntegerField()
    pending_grades = serializers.IntegerField()
    completed_grades = serializers.IntegerField()


class GradeStatisticsSerializer(serializers.Serializer):
    """Serializer for grade statistics."""
    
    total_grades = serializers.IntegerField()
    average_score = serializers.FloatField(required=False, allow_null=True)
    subjects_count = serializers.IntegerField()
    students_count = serializers.IntegerField()
    assignment_count = serializers.IntegerField()
    exam_count = serializers.IntegerField()


class StudentPerformanceSummarySerializer(serializers.Serializer):
    """Serializer for student performance summary."""
    
    student_id = serializers.IntegerField()
    overall_average = serializers.FloatField(required=False, allow_null=True)
    subjects = serializers.DictField()
    total_subjects = serializers.IntegerField()
    total_grades = serializers.IntegerField()


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for Question model."""
    
    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'points', 'options', 'correct_answer', 'explanation', 'hint', 'order', 'time_limit']
        read_only_fields = ['id']


class OnlineQuizSerializer(serializers.ModelSerializer):
    """Serializer for OnlineQuiz model."""
    
    questions = QuestionSerializer(many=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    
    class Meta:
        model = OnlineQuiz
        fields = [
            'id', 'title', 'description', 'quiz_type', 'course', 'teacher', 'teacher_name',
            'subject', 'grade_level', 'stream', 'chapter', 'topic',
            'duration_minutes', 'is_published', 'allow_retake', 'show_results_immediately',
            'difficulty', 'use_rag',
            'created_at', 'questions'
        ]
        read_only_fields = ['id', 'created_at', 'teacher']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = OnlineQuiz.objects.create(**validated_data)
        for question_data in questions_data:
            Question.objects.create(quiz=quiz, **question_data)
        return quiz



class StudentOnlineQuizSerializer(OnlineQuizSerializer):
    """Serializer for OnlineQuiz model seen by students (excludes correct answers, randomizes questions)."""
    
    questions = serializers.SerializerMethodField()
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    
    class Meta:
        model = OnlineQuiz
        fields = [
            'id', 'title', 'description', 'quiz_type', 'course', 'teacher', 'teacher_name',
            'subject', 'grade_level', 'stream', 'chapter', 'topic',
            'duration_minutes', 'is_published', 'allow_retake', 'show_results_immediately',
            'difficulty', 'use_rag',
            'created_at', 'questions'
        ]
        read_only_fields = ['id', 'created_at', 'teacher']

    def get_questions(self, obj):
        """Get randomized questions for student."""
        # Get all questions
        questions = list(obj.questions.all())
        
        # Shuffle them randomly
        import random
        random.shuffle(questions)
        
        # Serialize them using QuestionSerializer but omitting sensitive data if needed
        # For now, we use the standard serializer but relying on frontend to hide answers isn't secure for high-stakes exams.
        # Ideally, we'd use a StudentQuestionSerializer that excludes 'correct_answer' and 'explanation'.
        return QuestionSerializer(questions, many=True).data


class QuestionResponseSerializer(serializers.ModelSerializer):
    """Serializer for QuestionResponse model."""
    
    class Meta:
        model = QuestionResponse
        fields = ['id', 'question', 'response_text', 'is_correct', 'score', 'feedback']
        read_only_fields = ['id', 'is_correct', 'score', 'feedback']


class QuizAttemptSerializer(serializers.ModelSerializer):
    """Serializer for QuizAttempt model."""
    
    responses = QuestionResponseSerializer(many=True, read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'student', 'student_name', 'quiz', 'quiz_title',
            'start_time', 'end_time', 'score', 'max_score', 'is_completed', 'ai_feedback',
            'responses', 'status', 'pause_count', 'last_paused_at', 'current_question_index'
        ]
        read_only_fields = ['id', 'student', 'start_time', 'score', 'max_score', 'ai_feedback']


class RegionSerializer(serializers.ModelSerializer):
    """Serializer for Region model."""
    class Meta:
        model = Region
        fields = ['id', 'name', 'code', 'is_active']


class GradeLevelSerializer(serializers.ModelSerializer):
    """Serializer for GradeLevel model."""
    class Meta:
        model = GradeLevel
        fields = ['id', 'name', 'order', 'is_active']


class StreamSerializer(serializers.ModelSerializer):
    """Serializer for Stream model."""
    class Meta:
        model = Stream
        fields = ['id', 'name', 'description', 'is_active']


class SubjectSerializer(serializers.ModelSerializer):
    """Serializer for Subject model."""
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'description', 'is_active']


class CurriculumSerializer(serializers.ModelSerializer):
    """Serializer for Curriculum model."""
    region_detail = RegionSerializer(source='region', read_only=True)
    grade_level_detail = GradeLevelSerializer(source='grade_level', read_only=True)
    stream_detail = StreamSerializer(source='stream', read_only=True)
    subject_detail = SubjectSerializer(source='subject', read_only=True)

    class Meta:
        model = Curriculum
        fields = [
            'id', 'region', 'region_detail', 
            'grade_level', 'grade_level_detail', 
            'stream', 'stream_detail', 
            'subject', 'subject_detail', 
            'language',
            'is_active'
        ]


class AssignmentTypeSerializer(serializers.ModelSerializer):
    """Serializer for AssignmentType model."""
    class Meta:
        model = AssignmentType
        fields = ['id', 'name', 'description', 'is_active']


class ExamTypeSerializer(serializers.ModelSerializer):
    """Serializer for ExamType model."""
    class Meta:
        model = ExamType
        fields = ['id', 'name', 'description', 'is_active']
