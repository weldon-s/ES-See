# Generated by Django 4.2.2 on 2023-07-13 01:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0016_rename_demonym_country_adjective'),
    ]

    operations = [
        migrations.AddField(
            model_name='country',
            name='is_big_five',
            field=models.BooleanField(default=False),
        ),
    ]
