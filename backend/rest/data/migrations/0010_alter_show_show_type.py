# Generated by Django 4.2.2 on 2023-07-05 23:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0009_alter_show_show_type_alter_show_voting_system_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='show',
            name='show_type',
            field=models.IntegerField(choices=[(1, 'Semifinal 1'), (2, 'Semifinal 2'), (3, 'Grand Final')], default=3),
        ),
    ]
