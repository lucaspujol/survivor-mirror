"""ChômageGo data model.

Minimisation principles applied here:
- no personal data beyond what a job search requires (no date of birth, no home
  address, no national ID number, and so on);
- a visitor's GPS position is never persisted: geolocation stays a query
  parameter, and a manually entered municipality is enough;
- Lambert-93 coordinates (EPSG:2154) are not stored, they are computed on
  demand from WGS84 (see `to_lambert93` in main.py, or `ST_Transform(location,
  2154)` in SQL).
"""

from datetime import date, datetime

from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

# Controlled values. `native_enum=False` produces a VARCHAR column: a new value
# is added by a plain migration, with no ALTER TYPE. The database-side check is
# an explicitly named CHECK constraint (see __table_args__).
ROLES = ("seeker", "employer", "admin")
# Lifecycle of an application, on both the job seeker and employer sides.
APPLICATION_STATUSES = ("sent", "under_review", "accepted", "rejected")
# `to_verify` = location needs checking (doubtful or failed geocoding).
LOCATION_STATUSES = ("pending", "geocoded", "to_verify")

role_enum = Enum(*ROLES, name="user_role", native_enum=False, create_constraint=False)
application_status_enum = Enum(
    *APPLICATION_STATUSES,
    name="application_status",
    native_enum=False,
    create_constraint=False,
)
location_status_enum = Enum(
    *LOCATION_STATUSES,
    name="location_status",
    native_enum=False,
    create_constraint=False,
)

def _in_check(column: str, values: tuple[str, ...]) -> str:
    return f"{column} IN ({', '.join(repr(value) for value in values)})"

class User(Base):
    """Authentication account, shared by job seekers and employers."""

    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(_in_check("role", ROLES), name="ck_users_role"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(role_enum, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    job_seeker: Mapped["JobSeeker | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    employer: Mapped["Employer | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )

class JobSeeker(Base):
    """Professional profile of a job seeker."""

    __tablename__ = "job_seekers"

    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    first_name: Mapped[str] = mapped_column(Text, nullable=False)
    last_name: Mapped[str] = mapped_column(Text, nullable=False)
    # Declared skills, one entry per skill.
    skills: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default=text("'{}'::text[]")
    )
    # Work experience, entered as free text by the job seeker.
    experience: Mapped[str | None] = mapped_column(Text)
    # Date the job seeker becomes available.
    availability: Mapped[date | None] = mapped_column(Date)

    user: Mapped[User] = relationship(back_populates="job_seeker")
    applications: Mapped[list["Application"]] = relationship(
        back_populates="job_seeker", cascade="all, delete-orphan"
    )

class Employer(Base):
    """Employer account publishing job offers."""

    __tablename__ = "employers"

    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    company_name: Mapped[str] = mapped_column(Text, nullable=False)
    activity_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    user: Mapped[User] = relationship(back_populates="employer")
    jobs: Mapped[list["Job"]] = relationship(
        back_populates="employer", cascade="all, delete-orphan"
    )

class Job(Base):
    """Job offer published by an employer and placed on the map.

    `location` holds the WGS84 point (EPSG:4326): latitude and longitude are
    derived from it (`ST_Y` / `ST_X`), so they are not stored twice.
    """

    __tablename__ = "jobs"
    __table_args__ = (
        CheckConstraint(
            "geocoding_score IS NULL OR (geocoding_score >= 0 AND geocoding_score <= 1)",
            name="ck_jobs_geocoding_score_range",
        ),
        # An offer marked as located must carry a point and its provenance.
        CheckConstraint(
            "location_status <> 'geocoded' OR ("
            "location IS NOT NULL AND geocoding_source IS NOT NULL "
            "AND geocoding_score IS NOT NULL AND geocoded_at IS NOT NULL)",
            name="ck_jobs_geocoded_requires_location",
        ),
        CheckConstraint(
            _in_check("location_status", LOCATION_STATUSES),
            name="ck_jobs_location_status",
        ),
        Index("ix_jobs_employer_id", "employer_id"),
        # Map search: visible bounds first, then distance.
        Index("ix_jobs_location", "location", postgresql_using="gist"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    employer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("employers.user_id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    # Address as entered by the employer, sent to the Adresse API.
    location_address: Mapped[str | None] = mapped_column(Text)
    location_city: Mapped[str] = mapped_column(Text, nullable=False)
    # WGS84 point; NULL until the offer has been geocoded.
    location: Mapped[WKBElement | None] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=False)
    )
    geocoding_source: Mapped[str | None] = mapped_column(Text)
    geocoding_score: Mapped[float | None] = mapped_column(Float)
    geocoded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    location_status: Mapped[str] = mapped_column(
        location_status_enum, nullable=False, server_default=text("'pending'")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    employer: Mapped[Employer] = relationship(back_populates="jobs")
    applications: Mapped[list["Application"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )

class Application(Base):
    """A job seeker's application to an offer."""

    __tablename__ = "applications"
    __table_args__ = (
        # One application per job seeker and offer; the unique index also
        # serves lookups by job_id (employer side).
        UniqueConstraint("job_id", "job_seeker_id", name="uq_applications_job_seeker"),
        CheckConstraint(
            _in_check("status", APPLICATION_STATUSES), name="ck_applications_status"
        ),
        Index("ix_applications_job_seeker_id", "job_seeker_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    job_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False
    )
    job_seeker_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("job_seekers.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        application_status_enum, nullable=False, server_default=text("'sent'")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    job: Mapped[Job] = relationship(back_populates="applications")
    job_seeker: Mapped[JobSeeker] = relationship(back_populates="applications")
