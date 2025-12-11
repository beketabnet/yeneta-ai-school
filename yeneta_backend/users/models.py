from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        if not username:
            raise ValueError('Users must have a username')
        
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'Admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with role-based access."""
    
    ROLE_CHOICES = [
        ('Admin', 'Administrator'),
        ('Teacher', 'Teacher'),
        ('Student', 'Student'),
        ('Parent', 'Parent'),
    ]

    REGION_CHOICES = [
        ('Tigray', 'Tigray'),
        ('Afar', 'Afar'),
        ('Amhara', 'Amhara'),
        ('Oromia', 'Oromia'),
        ('Somali', 'Somali'),
        ('Benishangul-Gumuz', 'Benishangul-Gumuz'),
        ('SNNPR', 'SNNPR'),
        ('Gambella', 'Gambella'),
        ('Harari', 'Harari'),
        ('Sidama', 'Sidama'),
        ('South West Ethiopia Peoples', 'South West Ethiopia Peoples'),
        ('Central Ethiopia', 'Central Ethiopia'),
        ('Addis Ababa', 'Addis Ababa City Administration'),
        ('Dire Dawa', 'Dire Dawa City Administration'),
    ]

    ACCOUNT_STATUS_CHOICES = [
        ('Incomplete', 'Incomplete'),
        ('Pending Review', 'Pending Review'),
        ('Active', 'Active'),
        ('Rejected', 'Rejected'),
        ('Suspended', 'Suspended'),
    ]
    
    email = models.EmailField(unique=True, max_length=255)
    username = models.CharField(max_length=150)
    first_name = models.CharField(max_length=150, default='')
    last_name = models.CharField(max_length=150, default='')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Student')
    
    # New Fields
    mobile_number = models.CharField(
        max_length=15, 
        default="+251000000000",
        help_text="Mobile number with country code, e.g., +251911223344"
    )
    region = models.CharField(max_length=50, choices=REGION_CHOICES, default='Addis Ababa')
    cv = models.FileField(upload_to='teacher_cvs/', blank=True, null=True)
    account_status = models.CharField(max_length=20, choices=ACCOUNT_STATUS_CHOICES, default='Incomplete')
    student_identification_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    grade_level = models.TextField(blank=True, null=True) # Changed to TextField to support multiple grades (JSON/CSV)
    grade = models.CharField(max_length=50, blank=True, null=True)  # For student grade (single)
    stream = models.CharField(max_length=20, choices=[('Natural', 'Natural Science'), ('Social', 'Social Science')], blank=True, null=True)
    
    # New Demographics
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], default='Other')
    age = models.IntegerField(default=18)

    parent = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='children',
        limit_choices_to={'role': 'Parent'}
    )
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.username} ({self.email})"
    
    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    def get_short_name(self):
        return self.username


class Family(models.Model):
    """Family model for grouping related users."""
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'families'
        ordering = ['name']

    def __str__(self):
        return self.name


class FamilyMembership(models.Model):
    """Membership model linking users to families."""
    ROLE_CHOICES = [
        ('Student', 'Student'),
        ('Parent', 'Parent/Guardian'),
        ('Sibling', 'Sibling'),
    ]

    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='family_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'family_memberships'
        ordering = ['-joined_at']
        unique_together = ('family', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.family.name} ({self.role})"


@receiver(post_save, sender=User)
def set_is_staff_for_admin(sender, instance, created, **kwargs):
    """Automatically set is_staff=True when role is Admin."""
    if instance.role == 'Admin' and not instance.is_staff:
        instance.is_staff = True
        instance.save(update_fields=['is_staff'])
    elif instance.role != 'Admin' and instance.is_staff and not instance.is_superuser:
        instance.is_staff = False
        instance.save(update_fields=['is_staff'])


class UserDocument(models.Model):
    """Model for storing user uploaded documents."""
    DOCUMENT_TYPES = [
        ('CV', 'Curriculum Vitae'),
        ('ID', 'Identification Card/Passport'),
        ('Transcript', 'Grade Report/Transcript'),
        ('Certification', 'Certification'),
        ('Other', 'Other'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    file = models.FileField(upload_to='user_documents/')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'user_documents'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.user.username} - {self.document_type}"
