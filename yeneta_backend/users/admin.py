from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from .models import Family, FamilyMembership

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for custom User model."""
    
    list_display = ['email', 'username', 'first_name', 'last_name', 'role', 'gender', 'age', 'region', 'mobile_number', 'is_active', 'is_staff', 'date_joined']
    list_filter = ['role', 'gender', 'region', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'username', 'first_name', 'last_name', 'mobile_number']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('username', 'first_name', 'last_name', 'role', 'gender', 'age', 'region', 'mobile_number', 'grade_level', 'grade', 'parent')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'first_name', 'last_name', 'role', 'gender', 'age', 'region', 'mobile_number', 'password1', 'password2', 'is_staff', 'is_active'),
        }),
    )


class FamilyMembershipInline(admin.TabularInline):
    """Inline admin for FamilyMembership."""
    
    model = FamilyMembership
    extra = 1
    fields = ['user', 'role', 'is_active', 'joined_at']
    readonly_fields = ['joined_at']


@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    """Admin interface for Family model."""
    
    list_display = ['name', 'member_count', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name', 'members__user__username']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [FamilyMembershipInline]
    
    def member_count(self, obj):
        return obj.members.filter(is_active=True).count()
    member_count.short_description = 'Active Members'


@admin.register(FamilyMembership)
class FamilyMembershipAdmin(admin.ModelAdmin):
    """Admin interface for FamilyMembership model."""
    
    list_display = ['family', 'user', 'role', 'is_active', 'joined_at']
    list_filter = ['role', 'is_active', 'joined_at', 'family', 'user__region', 'user__gender']
    search_fields = ['family__name', 'user__username', 'user__email']
    readonly_fields = ['joined_at']
    ordering = ['-joined_at']
