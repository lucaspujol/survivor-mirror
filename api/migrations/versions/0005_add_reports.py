"""Add offer reports

Revision ID: 0005_add_reports
Revises: 0004_add_time_commitment
Create Date: 2026-09-08

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_add_reports"
down_revision: str | None = "0004_add_time_commitment"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "reports",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("job_id", sa.BigInteger(), nullable=False),
        sa.Column("reporter_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "reason",
            sa.Enum(
                "fraudulent",
                "non_compliant",
                "expired",
                "other",
                name="report_reason",
                native_enum=False,
                create_constraint=False,
            ),
            nullable=False,
        ),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "reviewed",
                "dismissed",
                name="report_status",
                native_enum=False,
                create_constraint=False,
            ),
            server_default=sa.text("'pending'"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "reason IN ('fraudulent', 'non_compliant', 'expired', 'other')",
            name="ck_reports_reason",
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'reviewed', 'dismissed')",
            name="ck_reports_status",
        ),
        sa.ForeignKeyConstraint(
            ["job_id"], ["jobs.id"], name="fk_reports_job_id", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["reporter_id"], ["users.id"], name="fk_reports_reporter_id", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_reports"),
        sa.UniqueConstraint("job_id", "reporter_id", name="uq_reports_job_reporter"),
    )
    op.create_index("ix_reports_job_id", "reports", ["job_id"])


def downgrade() -> None:
    op.drop_index("ix_reports_job_id", table_name="reports")
    op.drop_table("reports")
