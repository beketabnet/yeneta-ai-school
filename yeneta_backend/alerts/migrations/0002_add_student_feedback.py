# Generated migration for StudentFeedback model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('alerts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudentFeedback',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message_content', models.TextField()),
                ('category', models.CharField(choices=[('General', 'General'), ('Academic', 'Academic'), ('Technical', 'Technical'), ('Behavioral', 'Behavioral'), ('Other', 'Other')], default='General', max_length=20)),
                ('priority', models.CharField(choices=[('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High'), ('Critical', 'Critical')], default='Medium', max_length=20)),
                ('status', models.CharField(choices=[('New', 'New'), ('In Review', 'In Review'), ('Acknowledged', 'Acknowledged'), ('Resolved', 'Resolved'), ('Dismissed', 'Dismissed')], default='New', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('assigned_to', models.ForeignKey(blank=True, limit_choices_to={'role__in': ['Admin', 'Teacher']}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_feedbacks', to=settings.AUTH_USER_MODEL)),
                ('student', models.ForeignKey(limit_choices_to={'role': 'Student'}, on_delete=django.db.models.deletion.CASCADE, related_name='feedbacks', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'student_feedbacks',
                'ordering': ['-created_at'],
            },
        ),
    ]
