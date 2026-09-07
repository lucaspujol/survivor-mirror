"""Offer expiry, offer reports and in-app notifications

Revision ID: 0005_reports_notifications
Revises: 0004_add_time_commitment
Create Date: 2026-09-07

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_reports_notifications"
down_revision: str | None = "0004_add_time_commitment"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

REPORT_REASONS = ("fraud", "misleading", "discrimination", "offensive", "other")
REPORT_STATUSES = ("pending", "reviewed", "dismissed")
NOTIFICATION_TYPES = ("application_received", "application_status", "offer_removed")


def _enum(name: str, values: tuple[str, ...]) -> sa.Enum:
    return sa.Enum(*values, name=name, native_enum=False, create_constraint=False)


def _in_check(column: str, values: tuple[str, ...]) -> str:
    return f"{column} IN ({', '.join(repr(value) for value in values)})"


def upgrade() -> None:
    # Brief: offers are archived 30 days after publication. Existing rows are
    # backdated from their own created_at so the demo data keeps a truthful
    # remaining lifetime instead of all expiring on the same day.
    op.add_column(
        "jobs",
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now() + interval '30 days'"),
            nullable=True,
        ),
    )
    op.execute("UPDATE jobs SET expires_at = created_at + interval '30 days'")
    op.alter_column("jobs", "expires_at", nullable=False)

    op.create_table(
        "reports",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("job_id", sa.BigInteger(), nullable=False),
        sa.Column("reporter_id", sa.BigInteger(), nullable=False),
        sa.Column("reason", _enum("report_reason", REPORT_REASONS), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column(
            "status",
            _enum("report_status", REPORT_STATUSES),
            server_default=sa.text("'pending'"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reporter_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("job_id", "reporter_id", name="uq_reports_job_reporter"),
        sa.CheckConstraint(_in_check("reason", REPORT_REASONS), name="ck_reports_reason"),
        sa.CheckConstraint(_in_check("status", REPORT_STATUSES), name="ck_reports_status"),
    )
    op.create_index("ix_reports_status", "reports", ["status"])

    op.create_table(
        "notifications",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("type", _enum("notification_type", NOTIFICATION_TYPES), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("job_id", sa.BigInteger(), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        # The notification outlives the offer it points at: the link is
        # cleared, the rendered message stays.
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            _in_check("type", NOTIFICATION_TYPES), name="ck_notifications_type"
        ),
    )
    op.create_index(
        "ix_notifications_user_id_created_at", "notifications", ["user_id", "created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_notifications_user_id_created_at", table_name="notifications")
    op.drop_table("notifications")
    op.drop_index("ix_reports_status", table_name="reports")
    op.drop_table("reports")
    op.drop_column("jobs", "expires_at")
