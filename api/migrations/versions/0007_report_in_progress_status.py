"""Add in_progress report status

Revision ID: 0007_report_in_progress_status
Revises: 0006_add_warnings
Create Date: 2026-09-09

"""
from collections.abc import Sequence

from alembic import op

revision: str = "0007_report_in_progress_status"
down_revision: str | None = "0006_add_warnings"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint("ck_reports_status", "reports", type_="check")
    op.create_check_constraint(
        "ck_reports_status",
        "reports",
        "status IN ('pending', 'in_progress', 'reviewed', 'dismissed')",
    )


def downgrade() -> None:
    # Any row already set to 'in_progress' would violate the narrower
    # constraint below - move it back to 'pending' first.
    op.execute("UPDATE reports SET status = 'pending' WHERE status = 'in_progress'")
    op.drop_constraint("ck_reports_status", "reports", type_="check")
    op.create_check_constraint(
        "ck_reports_status", "reports", "status IN ('pending', 'reviewed', 'dismissed')"
    )
