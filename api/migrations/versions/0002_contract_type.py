"""Add contract type and duration to jobs

Revision ID: 0002_contract_type
Revises: 0001_initial_schema
Create Date: 2026-09-03

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_contract_type"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

def upgrade() -> None:
    op.add_column(
        "jobs",
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
            server_default=sa.text("'cdi'"),
            nullable=False,
        ),
    )
    op.add_column("jobs", sa.Column("contract_duration", sa.Text(), nullable=True))
    op.create_check_constraint(
        "ck_jobs_contract_type",
        "jobs",
        "contract_type IN ('cdi', 'cdd', 'stage', 'alternance', 'interim', 'freelance')",
    )

def downgrade() -> None:
    op.drop_constraint("ck_jobs_contract_type", "jobs", type_="check")
    op.drop_column("jobs", "contract_duration")
    op.drop_column("jobs", "contract_type")
