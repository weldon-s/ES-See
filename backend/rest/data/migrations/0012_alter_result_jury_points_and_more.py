# Generated by Django 4.2.2 on 2023-07-06 04:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0011_alter_show_show_type_result'),
    ]

    operations = [
        migrations.AlterField(
            model_name='result',
            name='jury_points',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='result',
            name='televote_points',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='result',
            name='total_points',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]