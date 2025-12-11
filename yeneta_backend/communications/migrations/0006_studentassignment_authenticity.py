from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('communications', '0005_notification'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentassignment',
            name='ai_likelihood',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='studentassignment',
            name='authenticity_score',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
