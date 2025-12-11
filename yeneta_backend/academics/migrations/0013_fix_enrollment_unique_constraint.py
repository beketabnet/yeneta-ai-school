# Generated migration to fix StudentEnrollmentRequest unique_together constraint

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0012_gradeitem_instructions_gradeitem_is_active_and_more'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='studentenrollmentrequest',
            unique_together={('student', 'teacher', 'subject', 'grade_level', 'stream')},
        ),
    ]
