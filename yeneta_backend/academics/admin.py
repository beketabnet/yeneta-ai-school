from django.contrib import admin
from .models import (
    Assignment, Submission, PracticeQuestion, Course, Enrollment, Unit, GradeItem, Grade,
    MasterCourse, TeacherCourseRequest, StudentEnrollmentRequest, StudentGrade,
    Region, GradeLevel, Stream, Subject, Curriculum, AssignmentType, ExamType
)

@admin.register(AssignmentType)
class AssignmentTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    search_fields = ('name',)
    list_filter = ('is_active',)

@admin.register(ExamType)
class ExamTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')
    search_fields = ('name',)
    list_filter = ('is_active',)
from .api_key_models import APIKey, APIKeyProvider, APIKeyLog


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'due_date', 'created_by', 'created_at']
    list_filter = ['course', 'due_date', 'created_at']
    search_fields = ['title', 'description', 'course']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['assignment', 'student', 'submitted_at', 'grade', 'authenticity_score']
    list_filter = ['submitted_at', 'assignment']
    search_fields = ['student__username', 'assignment__title']
    readonly_fields = ['submitted_at']


@admin.register(PracticeQuestion)
class PracticeQuestionAdmin(admin.ModelAdmin):
    list_display = ['subject', 'topic', 'created_at']
    list_filter = ['subject', 'created_at']
    search_fields = ['subject', 'topic', 'question']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'teacher', 'grade_level', 'subject', 'created_at']
    list_filter = ['grade_level', 'subject', 'created_at']
    search_fields = ['title', 'teacher__username', 'subject']
    readonly_fields = ['created_at', 'updated_at']




@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'order', 'created_at']
    list_filter = ['course', 'created_at']
    search_fields = ['title', 'course__title']
    readonly_fields = ['created_at']
    ordering = ['course', 'order']


@admin.register(GradeItem)
class GradeItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'unit', 'item_type', 'max_score', 'due_date']
    list_filter = ['item_type', 'due_date', 'unit__course']
    search_fields = ['title', 'unit__title', 'unit__course__title']
    readonly_fields = ['created_at']


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['student', 'grade_item', 'score', 'graded_by', 'graded_at']
    list_filter = ['graded_at', 'grade_item__unit__course']
    search_fields = ['student__username', 'grade_item__title']
    readonly_fields = ['created_at', 'updated_at', 'percentage']
    
    def percentage(self, obj):
        return f"{obj.percentage:.1f}%" if obj.percentage is not None else "N/A"
    percentage.short_description = 'Percentage'
    ordering = ['grade_item__unit__course', 'grade_item__unit', 'grade_item']


@admin.register(TeacherCourseRequest)
class TeacherCourseRequestAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'subject', 'grade_level', 'stream', 'status', 'requested_at', 'reviewed_at']
    list_filter = ['status', 'grade_level', 'requested_at', 'reviewed_at', 'teacher__region']
    search_fields = ['teacher__username', 'subject', 'stream']
    readonly_fields = ['requested_at', 'reviewed_at']
    ordering = ['-requested_at']


@admin.register(StudentEnrollmentRequest)
class StudentEnrollmentRequestAdmin(admin.ModelAdmin):
    list_display = ['student', 'teacher', 'subject', 'grade_level', 'family', 'status', 'requested_at']
    list_filter = ['status', 'grade_level', 'requested_at', 'reviewed_at', 'student__region', 'student__gender']
    search_fields = ['student__username', 'teacher__username', 'subject', 'family__name']
    readonly_fields = ['requested_at', 'reviewed_at']
    ordering = ['-requested_at']


@admin.register(MasterCourse)
class MasterCourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'grade_level', 'stream', 'is_active', 'created_at']
    list_filter = ['grade_level', 'stream', 'is_active', 'created_at']
    search_fields = ['name', 'code', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['name', 'grade_level']


@admin.register(APIKeyProvider)
class APIKeyProviderAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_name']
    search_fields = ['name', 'display_name']


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ['provider', 'key_value_masked', 'model_name', 'status', 'is_active', 'tokens_used_today', 'get_usage_percentage_day']
    list_filter = ['provider', 'status', 'is_active', 'model_name']
    search_fields = ['key_value', 'model_name']
    readonly_fields = ['tokens_used_today', 'tokens_used_this_minute', 'last_reset_minute', 'last_reset_day', 'created_at', 'updated_at']
    
    def key_value_masked(self, obj):
        if len(obj.key_value) > 10:
            return f"{obj.key_value[:10]}..."
        return obj.key_value
    key_value_masked.short_description = 'Key Value'
    
    def get_usage_percentage_day(self, obj):
        return f"{obj.get_usage_percentage_day():.1f}%"
    get_usage_percentage_day.short_description = 'Daily Usage'


@admin.register(APIKeyLog)
class APIKeyLogAdmin(admin.ModelAdmin):
    list_filter = ['action', 'created_at', 'api_key__provider']
    search_fields = ['api_key__key_value', 'reason']
    readonly_fields = ['created_at']


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active']
    search_fields = ['name', 'code']
    list_filter = ['is_active']
    ordering = ['name']


@admin.register(GradeLevel)
class GradeLevelAdmin(admin.ModelAdmin):
    list_display = ['name', 'order', 'is_active']
    search_fields = ['name']
    list_filter = ['is_active']
    ordering = ['order']


@admin.register(Stream)
class StreamAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active']
    search_fields = ['name', 'description']
    list_filter = ['is_active']
    ordering = ['name']


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active']
    search_fields = ['name', 'code', 'description']
    list_filter = ['is_active']
    ordering = ['name']


@admin.register(Curriculum)
class CurriculumAdmin(admin.ModelAdmin):
    list_display = ['region', 'grade_level', 'stream', 'subject', 'language', 'is_active']
    list_filter = ['region', 'grade_level', 'stream', 'language', 'is_active']
    search_fields = ['region__name', 'grade_level__name', 'subject__name', 'stream__name']
    ordering = ['region', 'grade_level', 'subject']
    autocomplete_fields = ['region', 'grade_level', 'stream', 'subject']

@admin.register(StudentGrade)
class StudentGradeAdmin(admin.ModelAdmin):
    list_display = ['student', 'subject', 'grade_level', 'get_type', 'score', 'max_score', 'percentage', 'graded_by', 'created_at']
    list_filter = ['subject', 'grade_level', 'stream', 'assignment_type', 'exam_type', 'graded_by']
    search_fields = ['student__username', 'subject', 'title']
    readonly_fields = ['created_at', 'updated_at', 'percentage']

    def get_type(self, obj):
        return obj.assignment_type or obj.exam_type or 'Unknown'
    get_type.short_description = 'Type'

    def percentage(self, obj):
        return f"{obj.percentage:.1f}%" if obj.percentage is not None else "N/A"
    percentage.short_description = 'Percentage'
    ordering = ['-created_at']
