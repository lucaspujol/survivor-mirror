"""Add employer phone and description

Revision ID: 0008_employer_contact_info
Revises: 0007_report_in_progress_status
Create Date: 2026-09-09

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008_employer_contact_info"
down_revision: str | None = "0007_report_in_progress_status"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("employers", sa.Column("phone", sa.Text(), nullable=True))
    op.add_column("employers", sa.Column("description", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("employers", "description")
    op.drop_column("employers", "phone")
