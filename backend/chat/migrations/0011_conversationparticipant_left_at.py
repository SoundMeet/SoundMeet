from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0010_profile_profile_banner'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # SeparateDatabaseAndState lets us update Django's model state
        # without touching the existing DB table, then only add the new column.
        # This preserves all existing chat_conversation_participants rows.
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='ConversationParticipant',
                    fields=[
                        ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('conversation', models.ForeignKey(
                            on_delete=django.db.models.deletion.CASCADE,
                            related_name='conversation_participants',
                            to='chat.conversation',
                        )),
                        ('user', models.ForeignKey(
                            on_delete=django.db.models.deletion.CASCADE,
                            related_name='conversation_memberships',
                            to=settings.AUTH_USER_MODEL,
                        )),
                        ('left_at', models.DateTimeField(blank=True, null=True)),
                    ],
                    options={
                        'db_table': 'chat_conversation_participants',
                        'unique_together': {('conversation', 'user')},
                    },
                ),
                migrations.AlterField(
                    model_name='conversation',
                    name='participants',
                    field=models.ManyToManyField(
                        through='chat.ConversationParticipant',
                        related_name='conversations',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            database_operations=[
                # The table already exists — only add the new column.
                migrations.RunSQL(
                    sql="ALTER TABLE chat_conversation_participants ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ;",
                    reverse_sql="ALTER TABLE chat_conversation_participants DROP COLUMN IF EXISTS left_at;",
                ),
            ],
        ),
    ]
