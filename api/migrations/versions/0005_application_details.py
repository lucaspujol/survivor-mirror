"""Application form details and attached documents

Revision ID: 0005_application_details
Revises: 0004_add_time_commitment
Create Date: 2026-09-08

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_application_details"
down_revision: str | None = "0004_add_time_commitment"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Existing applications (the seeded ones) predate the form, so the two
    # name columns are added nullable, backfilled from the seeker profile, then
    # made NOT NULL.
    op.add_column("applications", sa.Column("first_name", sa.Text(), nullable=True))
    op.add_column("applications", sa.Column("last_name", sa.Text(), nullable=True))
    op.add_column("applications", sa.Column("phone", sa.Text(), nullable=True))
    op.add_column("applications", sa.Column("message", sa.Text(), nullable=True))

    op.execute(
        "UPDATE applications SET first_name = job_seekers.first_name, "
        "last_name = job_seekers.last_name "
        "FROM job_seekers WHERE job_seekers.user_id = applications.job_seeker_id"
    )
    op.alter_column("applications", "first_name", nullable=False)
    op.alter_column("applications", "last_name", nullable=False)

    op.create_table(
        "application_documents",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("application_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "kind",
            sa.Enum(
                "cv",
                "cover_letter",
                name="document_kind",
                native_enum=False,
                create_constraint=False,
            ),
            nullable=False,
        ),
        sa.Column("original_name", sa.Text(), nullable=False),
        sa.Column("stored_path", sa.Text(), nullable=False),
        sa.Column("mime_type", sa.Text(), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["applications.id"],
            name="fk_application_documents_application_id",
            ondelete="CASCADE",
        ),
        sa.CheckConstraint(
            "kind IN ('cv', 'cover_letter')", name="ck_application_documents_kind"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_application_documents"),
        sa.UniqueConstraint(
            "application_id", "kind", name="uq_application_documents_application_kind"
        ),
    )


def downgrade() -> None:
    op.drop_table("application_documents")
    op.drop_column("applications", "message")
    op.drop_column("applications", "phone")
    op.drop_column("applications", "last_name")
    op.drop_column("applications", "first_name")
