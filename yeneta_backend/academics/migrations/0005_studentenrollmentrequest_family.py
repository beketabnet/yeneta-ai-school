from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_family_familymembership'),
        ('academics', '0004_teachercourserequest_studentenrollmentrequest'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentenrollmentrequest',
            name='family',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='enrollment_requests', to='users.family'),
        ),
        migrations.AlterUniqueTogether(
            name='studentenrollmentrequest',
            unique_together={('student', 'teacher', 'subject', 'grade_level', 'stream', 'family')},
        ),
    ]
