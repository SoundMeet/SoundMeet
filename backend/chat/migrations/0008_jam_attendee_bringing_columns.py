from django.db import migrations


class Migration(migrations.Migration):
    """
    Adds three text-array columns to the auto-generated chat_jam_users_attending
    join table so attendees can record what instruments, roles, and gear they are
    bringing to a jam.

    Uses RunSQL rather than a through-model conversion to avoid disrupting the
    existing ManyToManyField on Jam.users_attending.
    """

    dependencies = [
        ('chat', '0007_merge_20260409_0145'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE chat_jam_users_attending
                    ADD COLUMN IF NOT EXISTS instruments_bringing text[] DEFAULT '{}',
                    ADD COLUMN IF NOT EXISTS roles_bringing       text[] DEFAULT '{}',
                    ADD COLUMN IF NOT EXISTS gear_bringing        text[] DEFAULT '{}';
            """,
            reverse_sql="""
                ALTER TABLE chat_jam_users_attending
                    DROP COLUMN IF EXISTS instruments_bringing,
                    DROP COLUMN IF EXISTS roles_bringing,
                    DROP COLUMN IF EXISTS gear_bringing;
            """,
        ),
    ]
