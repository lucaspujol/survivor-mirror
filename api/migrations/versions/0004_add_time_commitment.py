"""Add time commitment to jobs

Revision ID: 0004_add_time_commitment
Revises: 0003_add_work_mode
Create Date: 2026-09-04

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_add_time_commitment"
down_revision: str | None = "0003_add_work_mode"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column(
            "time_commitment",
            sa.Enum(
                "full_time",
                "part_time",
                name="time_commitment",
                native_enum=False,
                create_constraint=False,
            ),
            server_default=sa.text("'full_time'"),
            nullable=False,
        ),
    )
    op.create_check_constraint(
        "ck_jobs_time_commitment",
        "jobs",
        "time_commitment IN ('full_time', 'part_time')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_jobs_time_commitment", "jobs", type_="check")
    op.drop_column("jobs", "time_commitment")
