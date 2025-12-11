from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_first_name_user_last_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='Family',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'families',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='FamilyMembership',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('Student', 'Student'), ('Parent', 'Parent/Guardian'), ('Sibling', 'Sibling')], max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('family', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='members', to='users.family')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='family_memberships', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'family_memberships',
                'ordering': ['-joined_at'],
                'unique_together': {('family', 'user')},
            },
        ),
    ]
