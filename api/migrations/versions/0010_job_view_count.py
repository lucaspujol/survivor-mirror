"""Add a view counter to jobs

Revision ID: 0010_job_view_count
Revises: 0009_application_details
Create Date: 2026-09-10

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0010_job_view_count"
down_revision: str | None = "0009_application_details"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column(
            "view_count",
            sa.BigInteger(),
            server_default=sa.text("0"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("jobs", "view_count")
