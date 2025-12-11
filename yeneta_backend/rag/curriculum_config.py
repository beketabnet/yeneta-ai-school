"""
Ethiopian Education Curriculum Configuration
Based on Ministry of Education Curriculum Framework (KG - Grade 12)

Structure:
- Pre-primary: KG (ages 5-6)
- Primary: Grades 1-6
- Middle: Grades 7-8
- Secondary: Grades 9-10 (General)
- Preparatory: Grades 11-12 (Streamed: Natural Sciences / Social Sciences)
"""

from academics.models import GradeLevel, Stream, Subject, Curriculum, Region

# Helper to get choices for models if needed, but primarily we query the DB now.

def get_subjects_for_grade(grade: str, stream: str = None, region: str = None) -> list:
    """
    Get the list of subjects for a specific grade and stream from the database.
    
    Args:
        grade: Grade level name (e.g., "Grade 1", "Grade 11")
        stream: Stream name for Grades 11-12 (e.g., "Natural Science")
        region: Region name (e.g., "Oromia")
        
    Returns:
        List of subject names
    """
    queryset = Curriculum.objects.filter(is_active=True, grade_level__name=grade)

    if stream:
        queryset = queryset.filter(stream__name=stream)
    
    if region:
        # Filter by region if specified, or include generic (no region) + specific region
        # Logic: Get subjects specifically for this region OR subjects that are for ALL regions (if we had a way to denote that, 
        # but currently Curriculum model links to a specific Region. 
        # If we want "National" curriculum, we might need a "National" region or handle null region.
        # Assuming 'Addis Ababa' or specific regions are passed.
        # If the system is designed to have a base curriculum and regional additions, we'd need to handle that.
        # For now, let's assume we fetch what's defined for the region.
        queryset = queryset.filter(region__name=region)
    
    # If no subjects found for specific region, maybe fall back to a default region or "National"?
    # For now, just return what we found.
    
    subjects = queryset.values_list('subject__name', flat=True).distinct()
    return list(subjects)


def is_stream_required(grade: str) -> bool:
    """
    Check if stream selection is required for a given grade.
    
    Args:
        grade: Grade level (e.g., "Grade 11")
        
    Returns:
        True if stream is required, False otherwise
    """
    return grade in ["Grade 11", "Grade 12"]


def get_all_subjects() -> list:
    """
    Get a comprehensive list of all subjects across all grades.
    
    Returns:
        Sorted list of unique subject names
    """
    return list(Subject.objects.filter(is_active=True).values_list('name', flat=True).order_by('name'))
