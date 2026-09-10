"""Structured work experience for job seekers

Replaces the free-text `job_seekers.experience` column with one row per
position held. Existing text is not discarded: it becomes a first entry the
job seeker can edit or delete.

Revision ID: 0011_seeker_experiences
Revises: 0010_job_view_count
Create Date: 2026-09-10

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0011_seeker_experiences"
down_revision: str | None = "0010_job_view_count"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# The migrated text has no position, company or dates of its own: it is a
# paragraph. These stand in until the job seeker edits the entry.
_MIGRATED_POSITION = "Expérience"
_MIGRATED_COMPANY = "À compléter"


def upgrade() -> None:
    op.create_table(
        "seeker_experiences",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("job_seeker_id", sa.BigInteger(), nullable=False),
        sa.Column("position", sa.Text(), nullable=False),
        sa.Column(
            "contract_type",
            sa.Enum(
                "cdi",
                "cdd",
                "stage",
                "alternance",
                "interim",
                "freelance",
                name="contract_type",
                native_enum=False,
                create_constraint=False,
            ),
            nullable=False,
        ),
        sa.Column("company", sa.Text(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["job_seeker_id"],
            ["job_seekers.user_id"],
            name="fk_seeker_experiences_job_seeker_id",
            ondelete="CASCADE",
        ),
        sa.CheckConstraint(
            "contract_type IN ('cdi', 'cdd', 'stage', 'alternance', 'interim', 'freelance')",
            name="ck_seeker_experiences_contract_type",
        ),
        sa.CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="ck_seeker_experiences_dates_ordered",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_seeker_experiences"),
    )
    op.create_index(
        "ix_seeker_experiences_job_seeker_id", "seeker_experiences", ["job_seeker_id"]
    )

    # Carry the free text over as one entry rather than dropping it. The
    # placeholders are what the seeker edits; the paragraph itself lands in
    # the description, where it still reads correctly.
    op.execute(
        sa.text(
            """
            INSERT INTO seeker_experiences (
                job_seeker_id, position, contract_type, company,
                start_date, end_date, description
            )
            SELECT user_id, :position, 'cdi', :company,
                   CURRENT_DATE, CURRENT_DATE, experience
            FROM job_seekers
            WHERE experience IS NOT NULL AND btrim(experience) <> ''
            """
        ).bindparams(position=_MIGRATED_POSITION, company=_MIGRATED_COMPANY)
    )

    op.drop_column("job_seekers", "experience")


def downgrade() -> None:
    op.add_column("job_seekers", sa.Column("experience", sa.Text(), nullable=True))

    # Fold the entries back into one paragraph, newest first, so downgrading
    # does not silently empty the profiles.
    op.execute(
        """
        UPDATE job_seekers SET experience = folded.text
        FROM (
            SELECT job_seeker_id,
                   string_agg(
                       position || ' - ' || company
                       || COALESCE(E'\\n' || description, ''),
                       E'\\n\\n' ORDER BY start_date DESC
                   ) AS text
            FROM seeker_experiences
            GROUP BY job_seeker_id
        ) AS folded
        WHERE folded.job_seeker_id = job_seekers.user_id
        """
    )

    op.drop_index("ix_seeker_experiences_job_seeker_id", table_name="seeker_experiences")
    op.drop_table("seeker_experiences")
