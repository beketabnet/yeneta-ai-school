# Generated migration for StudentGrade model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('academics', '0006_apikey_apikeyprovider_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudentGrade',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('subject', models.CharField(max_length=100)),
                ('assignment_type', models.CharField(blank=True, choices=[('Quiz', 'Quiz'), ('Assignment', 'Assignment'), ('Homework', 'Homework'), ('Project', 'Project'), ('Lab Report', 'Lab Report'), ('Presentation', 'Presentation'), ('Group Work', 'Group Work'), ('Essay', 'Essay'), ('Critical Analysis', 'Critical Analysis')], max_length=50, null=True)),
                ('exam_type', models.CharField(blank=True, choices=[('Quiz', 'Quiz'), ('Mid Exam', 'Mid Exam'), ('Final Exam', 'Final Exam')], max_length=50, null=True)),
                ('score', models.FloatField()),
                ('max_score', models.FloatField(default=100)),
                ('feedback', models.TextField(blank=True)),
                ('graded_at', models.DateTimeField(auto_now=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('graded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='graded_student_grades', to=settings.AUTH_USER_MODEL)),
                ('student', models.ForeignKey(limit_choices_to={'role': 'Student'}, on_delete=django.db.models.deletion.CASCADE, related_name='student_grades', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'student_grades',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='studentgrade',
            index=models.Index(fields=['student', 'subject'], name='academics_s_student_idx'),
        ),
        migrations.AddIndex(
            model_name='studentgrade',
            index=models.Index(fields=['student', 'assignment_type'], name='academics_s_assignm_idx'),
        ),
        migrations.AddIndex(
            model_name='studentgrade',
            index=models.Index(fields=['student', 'exam_type'], name='academics_s_exam_idx'),
        ),
    ]
