from django.db import migrations

def populate_data(apps, schema_editor):
    Region = apps.get_model('academics', 'Region')
    GradeLevel = apps.get_model('academics', 'GradeLevel')
    Stream = apps.get_model('academics', 'Stream')
    Subject = apps.get_model('academics', 'Subject')
    Curriculum = apps.get_model('academics', 'Curriculum')

    # 1. Regions
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

    for name, full_name in REGION_CHOICES:
        Region.objects.get_or_create(name=name, defaults={'code': name[:3].upper()})

    # 2. Grade Levels
    GRADE_LEVELS = [
        "KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
        "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
    ]

    for i, grade in enumerate(GRADE_LEVELS):
        GradeLevel.objects.get_or_create(name=grade, defaults={'order': i})

    # 3. Streams
    STREAM_CHOICES = [
        ('Natural Science', 'Natural Science'),
        ('Social Science', 'Social Science'),
    ]

    for name, desc in STREAM_CHOICES:
        Stream.objects.get_or_create(name=name, defaults={'description': desc})

    # 4. Subjects and Curriculum
    SUBJECTS_BY_GRADE = {
        "KG": ["Chebt (Theme-Based Learning)", "Child Care", "Communication Skills", "Language Usage", "Math in Daily Activities", "Environmental Interaction", "Skill Development Through Games"],
        "Grade 1": ["English", "Amharic", "Mathematics", "Environmental Science", "Health and Physical Education", "Performing & Visual Arts"],
        "Grade 2": ["English", "Amharic", "Mathematics", "Environmental Science", "Health and Physical Education", "Performing & Visual Arts"],
        "Grade 3": ["English", "Amharic", "Mathematics", "Environmental Science", "Health and Physical Education", "Performing & Visual Arts", "Local Language (Optional)"],
        "Grade 4": ["English", "Amharic", "Mathematics", "Environmental Science", "Health and Physical Education", "Performing & Visual Arts", "Local Language (Optional)"],
        "Grade 5": ["English", "Amharic", "Mathematics", "Environmental Science", "Health and Physical Education", "Performing & Visual Arts", "Local Language (Optional)"],
        "Grade 6": ["English", "Amharic", "Mathematics", "Environmental Science", "Health and Physical Education", "Performing & Visual Arts", "Local Language (Optional)"],
        "Grade 7": ["English", "Amharic", "Mathematics", "General Science", "Social Studies", "Health and Physical Education", "Performing & Visual Arts", "Citizenship", "Career and Technical Education", "Information Technology", "Local Language (Optional)"],
        "Grade 8": ["English", "Amharic", "Mathematics", "General Science", "Social Studies", "Health and Physical Education", "Performing & Visual Arts", "Citizenship", "Career and Technical Education", "Information Technology", "Local Language (Optional)"],
        "Grade 9": ["English", "Amharic", "Mathematics", "Physics", "Chemistry", "Biology", "Geography", "History", "Citizenship Education", "Information Technology", "Health and Physical Education (Optional)"],
        "Grade 10": ["English", "Amharic", "Mathematics", "Physics", "Chemistry", "Biology", "Geography", "History", "Citizenship Education", "Information Technology", "Health and Physical Education (Optional)"],
        "Grade 11": {
            "Natural Science": ["English", "Mathematics", "Physics", "Chemistry", "Biology", "Information Technology", "Agriculture"],
            "Social Science": ["English", "Mathematics", "Geography", "History", "Economics", "Information Technology"],
        },
        "Grade 12": {
            "Natural Science": ["English", "Mathematics", "Physics", "Chemistry", "Biology", "Information Technology", "Agriculture"],
            "Social Science": ["English", "Mathematics", "Geography", "History", "Economics", "Information Technology"],
        },
    }

    REGIONAL_SUBJECTS = {
        "Oromia": ["Afaan Oromoo", "Barnoota Hawaasaa (Social Studies)", "Herrega (Mathematics)", "Barnoota Fayyaafi Jabeenya Qaamaa (Health and Physical Education)", "Barnoota Dhaweessummaa (Technical Education)", "Saayinsii Naannoo (Environmental Science)", "Barnoota Safuu (Moral Education)"],
        "Amhara": ["Amharic", "English", "Mathematics", "Health and Physical Education", "Performing & Visual Art", "Citizenship", "Career and Technical Education", "General Science", "Information Technology", "Social Science"],
        "SNNP": ["English", "Mathematics", "Citizenship Education", "Career and Technical Education", "Integrated Science", "Environmental Science", "Information and Communication Technology", "Performance and Visual Arts", "Biology", "Chemistry", "Amharic as a mother tongue", "Amharic as a second language"],
    }

    # Helper to create curriculum
    def create_curriculum(region_obj, grade_obj, stream_obj, subject_name):
        subject_obj, _ = Subject.objects.get_or_create(name=subject_name)
        Curriculum.objects.get_or_create(
            region=region_obj,
            grade_level=grade_obj,
            stream=stream_obj,
            subject=subject_obj
        )

    # Default Region (Addis Ababa)
    default_region = Region.objects.get(name="Addis Ababa")

    for grade, subjects in SUBJECTS_BY_GRADE.items():
        grade_obj = GradeLevel.objects.get(name=grade)
        
        if isinstance(subjects, dict):
            # Streamed grades
            for stream_name, stream_subjects in subjects.items():
                stream_obj = Stream.objects.get(name=stream_name)
                for subj in stream_subjects:
                    # Create for Default Region
                    create_curriculum(default_region, grade_obj, stream_obj, subj)
                    
                    # Create for other regions (base subjects)
                    for region_obj in Region.objects.exclude(name="Addis Ababa"):
                         create_curriculum(region_obj, grade_obj, stream_obj, subj)

        else:
            # Non-streamed grades
            for subj in subjects:
                # Create for Default Region
                create_curriculum(default_region, grade_obj, None, subj)
                
                # Create for other regions (base subjects)
                for region_obj in Region.objects.exclude(name="Addis Ababa"):
                     create_curriculum(region_obj, grade_obj, None, subj)

    # Add Regional Subjects
    for region_name, subjects in REGIONAL_SUBJECTS.items():
        try:
            region_obj = Region.objects.get(name=region_name)
        except Region.DoesNotExist:
            continue # Skip if region name doesn't match exactly (e.g. SNNP vs SNNPR)

        for grade in GRADE_LEVELS:
            grade_obj = GradeLevel.objects.get(name=grade)
            
            # Determine if stream applies
            streams = [None]
            if grade in ["Grade 11", "Grade 12"]:
                streams = [Stream.objects.get(name="Natural Science"), Stream.objects.get(name="Social Science")]
            
            for stream_obj in streams:
                for subj in subjects:
                    create_curriculum(region_obj, grade_obj, stream_obj, subj)


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0023_gradelevel_region_stream_subject_curriculum'),
    ]

    operations = [
        migrations.RunPython(populate_data),
    ]
