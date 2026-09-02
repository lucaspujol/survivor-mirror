"""Initial ChômageGo schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-09-02

"""
from collections.abc import Sequence

import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # The postgis/postgis image also installs the TIGER geocoder (US address
    # data, ~40 tables) and topology, neither of which ChômageGo uses. Keep only
    # `postgis` and restore a standard search_path.
    op.execute("DROP EXTENSION IF EXISTS postgis_tiger_geocoder CASCADE")
    op.execute("DROP EXTENSION IF EXISTS fuzzystrmatch CASCADE")
    op.execute("DROP EXTENSION IF EXISTS postgis_topology CASCADE")
    # DROP EXTENSION leaves the now-empty schemas behind.
    op.execute("DROP SCHEMA IF EXISTS tiger_data CASCADE")
    op.execute("DROP SCHEMA IF EXISTS tiger CASCADE")
    op.execute("DROP SCHEMA IF EXISTS topology CASCADE")
    op.execute(
        "DO $$ BEGIN "
        "EXECUTE format('ALTER DATABASE %I RESET search_path', current_database()); "
        "END $$"
    )

    # Geographic search over offers (map bounds, distance).
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                "seeker",
                "employer",
                "admin",
                name="user_role",
                native_enum=False,
                create_constraint=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "role IN ('seeker', 'employer', 'admin')", name="ck_users_role"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )

    op.create_table(
        "job_seekers",
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("first_name", sa.Text(), nullable=False),
        sa.Column("last_name", sa.Text(), nullable=False),
        sa.Column(
            "skills",
            postgresql.ARRAY(sa.Text()),
            server_default=sa.text("'{}'::text[]"),
            nullable=False,
        ),
        sa.Column("experience", sa.Text(), nullable=True),
        sa.Column("availability", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_job_seekers_user_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("user_id", name="pk_job_seekers"),
    )

    op.create_table(
        "employers",
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("company_name", sa.Text(), nullable=False),
        sa.Column(
            "activity_verified",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_employers_user_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("user_id", name="pk_employers"),
    )

    op.create_table(
        "jobs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("employer_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("location_address", sa.Text(), nullable=True),
        sa.Column("location_city", sa.Text(), nullable=False),
        sa.Column(
            "location",
            geoalchemy2.Geometry(
                geometry_type="POINT", srid=4326, spatial_index=False
            ),
            nullable=True,
        ),
        sa.Column("geocoding_source", sa.Text(), nullable=True),
        sa.Column("geocoding_score", sa.Float(), nullable=True),
        sa.Column("geocoded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "location_status",
            sa.Enum(
                "pending",
                "geocoded",
                "to_verify",
                name="location_status",
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
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "geocoding_score IS NULL OR (geocoding_score >= 0 AND geocoding_score <= 1)",
            name="ck_jobs_geocoding_score_range",
        ),
        sa.CheckConstraint(
            "location_status <> 'geocoded' OR ("
            "location IS NOT NULL AND geocoding_source IS NOT NULL "
            "AND geocoding_score IS NOT NULL AND geocoded_at IS NOT NULL)",
            name="ck_jobs_geocoded_requires_location",
        ),
        sa.CheckConstraint(
            "location_status IN ('pending', 'geocoded', 'to_verify')",
            name="ck_jobs_location_status",
        ),
        sa.ForeignKeyConstraint(
            ["employer_id"],
            ["employers.user_id"],
            name="fk_jobs_employer_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_jobs"),
    )
    op.create_index("ix_jobs_employer_id", "jobs", ["employer_id"])
    op.create_index("ix_jobs_location", "jobs", ["location"], postgresql_using="gist")

    op.create_table(
        "applications",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("job_id", sa.BigInteger(), nullable=False),
        sa.Column("job_seeker_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "sent",
                "under_review",
                "accepted",
                "rejected",
                name="application_status",
                native_enum=False,
                create_constraint=False,
            ),
            server_default=sa.text("'sent'"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["job_id"], ["jobs.id"], name="fk_applications_job_id", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["job_seeker_id"],
            ["job_seekers.user_id"],
            name="fk_applications_job_seeker_id",
            ondelete="CASCADE",
        ),
        sa.CheckConstraint(
            "status IN ('sent', 'under_review', 'accepted', 'rejected')",
            name="ck_applications_status",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_applications"),
        sa.UniqueConstraint("job_id", "job_seeker_id", name="uq_applications_job_seeker"),
    )
    op.create_index("ix_applications_job_seeker_id", "applications", ["job_seeker_id"])


def downgrade() -> None:
    op.drop_index("ix_applications_job_seeker_id", table_name="applications")
    op.drop_table("applications")
    op.drop_index("ix_jobs_location", table_name="jobs")
    op.drop_index("ix_jobs_employer_id", table_name="jobs")
    op.drop_table("jobs")
    op.drop_table("employers")
    op.drop_table("job_seekers")
    op.drop_table("users")
    # The postgis extension is left in place: other schemas may rely on it.
