"""Add user warnings

Revision ID: 0006_add_warnings
Revises: 0005_add_reports
Create Date: 2026-09-08

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006_add_warnings"
down_revision: str | None = "0005_add_reports"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "warnings",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("issued_by", sa.BigInteger(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_warnings_user_id", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["issued_by"], ["users.id"], name="fk_warnings_issued_by", ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_warnings"),
    )
    op.create_index("ix_warnings_user_id", "warnings", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_warnings_user_id", table_name="warnings")
    op.drop_table("warnings")
