import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("contracts", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="contract",
            name="contract_image",
        ),
        migrations.CreateModel(
            name="ContractPhoto",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("file", models.CharField(max_length=512)),
                ("order", models.PositiveSmallIntegerField(default=0)),
                (
                    "contract",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="photos",
                        to="contracts.contract",
                    ),
                ),
            ],
            options={
                "verbose_name": "تصویر قرارداد",
                "verbose_name_plural": "تصاویر قرارداد",
                "ordering": ["order", "created_at"],
            },
        ),
    ]
