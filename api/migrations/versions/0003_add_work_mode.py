"""Add work mode to jobs

Revision ID: 0003_add_work_mode
Revises: 0002_contract_type
Create Date: 2026-09-03

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_add_work_mode"
down_revision: str | None = "0002_contract_type"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column(
            "work_mode",
            sa.Enum(
                "on_site",
                "hybrid",
                "remote",
                name="work_mode",
                native_enum=False,
                create_constraint=False,
            ),
            server_default=sa.text("'on_site'"),
            nullable=False,
        ),
    )
    op.create_check_constraint(
        "ck_jobs_work_mode",
        "jobs",
        "work_mode IN ('on_site', 'hybrid', 'remote')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_jobs_work_mode", "jobs", type_="check")
    op.drop_column("jobs", "work_mode")
