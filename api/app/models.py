"""GéoEmploi data model.

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
# Contract types. `contract_duration` (free text, e.g. "3 mois") complements
# the fixed-term ones (cdd, stage, alternance, interim); left null for cdi.
CONTRACT_TYPES = ("cdi", "cdd", "stage", "alternance", "interim", "freelance")
# Work mode. Fully remote offers carry no location: geocoding is skipped and
# location stays NULL, which the existing "geocoded requires location" check
# constraint already allows (it only constrains the 'geocoded' status).
WORK_MODES = ("on_site", "hybrid", "remote")
# Independent from WORK_MODES: a job can be full-time remote, part-time
# on-site, etc. — the two dimensions don't overlap.
TIME_COMMITMENTS = ("full_time", "part_time")
# Files a candidate attaches to an application. The CV is required, the cover
# letter optional; one document of each kind per application at most.
DOCUMENT_KINDS = ("cv", "cover_letter")
# A report is tied to one (job, reporter) pair — the unique constraint on the
# table is what actually prevents a second report from the same account, this
# tuple only lists the accepted reasons.
REPORT_REASONS = ("fraudulent", "non_compliant", "expired", "other")
REPORT_STATUSES = ("pending", "reviewed", "dismissed")

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
contract_type_enum = Enum(
    *CONTRACT_TYPES,
    name="contract_type",
    native_enum=False,
    create_constraint=False,
)
work_mode_enum = Enum(
    *WORK_MODES,
    name="work_mode",
    native_enum=False,
    create_constraint=False,
)
time_commitment_enum = Enum(
    *TIME_COMMITMENTS,
    name="time_commitment",
    native_enum=False,
    create_constraint=False,
)
document_kind_enum = Enum(
    *DOCUMENT_KINDS,
    name="document_kind",
    native_enum=False,
    create_constraint=False,
)
report_reason_enum = Enum(
    *REPORT_REASONS,
    name="report_reason",
    native_enum=False,
    create_constraint=False,
)
report_status_enum = Enum(
    *REPORT_STATUSES,
    name="report_status",
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
        CheckConstraint(
            _in_check("contract_type", CONTRACT_TYPES),
            name="ck_jobs_contract_type",
        ),
        CheckConstraint(
            _in_check("work_mode", WORK_MODES),
            name="ck_jobs_work_mode",
        ),
        CheckConstraint(
            _in_check("time_commitment", TIME_COMMITMENTS),
            name="ck_jobs_time_commitment",
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
    # ex: "cdi", "cdd", "stage"... see CONTRACT_TYPES.
    contract_type: Mapped[str] = mapped_column(
        contract_type_enum, nullable=False, server_default=text("'cdi'")
    )
    # Free text, e.g. "3 mois" — relevant for cdd/stage/alternance/interim,
    # left null for cdi/freelance.
    contract_duration: Mapped[str | None] = mapped_column(Text)
    # "on_site" / "hybrid" / "remote". A fully remote offer has no location
    # (location, location_address stay NULL), so it never appears on the map
    # but remains visible in the employer's own offer list.
    work_mode: Mapped[str] = mapped_column(
        work_mode_enum, nullable=False, server_default=text("'on_site'")
    )
    # "full_time" / "part_time" — independent from work_mode: a job can be
    # both full-time and remote, or part-time and on-site.
    time_commitment: Mapped[str] = mapped_column(
        time_commitment_enum, nullable=False, server_default=text("'full_time'")
    )
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
    # Contact details as filled in on the application form. They are copied
    # rather than read from the profile: an application is a snapshot the
    # employer must keep seeing unchanged even if the seeker later edits their
    # account, and a seeker may want to be reached at a different number.
    first_name: Mapped[str] = mapped_column(Text, nullable=False)
    last_name: Mapped[str] = mapped_column(Text, nullable=False)
    # Optional: a job search does not require a phone number, the email of the
    # account is always reachable.
    phone: Mapped[str | None] = mapped_column(Text)
    # Free text the candidate adds to their application.
    message: Mapped[str | None] = mapped_column(Text)
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
    documents: Mapped[list["ApplicationDocument"]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )

class ApplicationDocument(Base):
    """A CV or cover letter attached to an application.

    Only the metadata lives in the database; the file itself is written under
    the uploads directory (see `app.storage`), so a dump of the base stays
    small and a document is served by streaming one file.
    """

    __tablename__ = "application_documents"
    __table_args__ = (
        # At most one CV and one cover letter per application: re-uploading
        # replaces the previous file rather than piling up versions.
        UniqueConstraint(
            "application_id", "kind", name="uq_application_documents_application_kind"
        ),
        CheckConstraint(
            _in_check("kind", DOCUMENT_KINDS), name="ck_application_documents_kind"
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[str] = mapped_column(document_kind_enum, nullable=False)
    # Name the candidate's file had, shown back to both sides and used as the
    # download filename. Never used to build the path on disk.
    original_name: Mapped[str] = mapped_column(Text, nullable=False)
    # Path relative to the uploads root, e.g. "12/cv-a3f9.pdf".
    stored_path: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str] = mapped_column(Text, nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    application: Mapped[Application] = relationship(back_populates="documents")

class Report(Base):
    """A signed-in user's report against an offer (fraudulent, non-compliant...).

    One report per (job, reporter) pair — the unique constraint below is what
    actually prevents a second report from the same account, not client-side
    validation, which could always be bypassed by calling the API directly.
    """

    __tablename__ = "reports"
    __table_args__ = (
        UniqueConstraint("job_id", "reporter_id", name="uq_reports_job_reporter"),
        CheckConstraint(_in_check("reason", REPORT_REASONS), name="ck_reports_reason"),
        CheckConstraint(_in_check("status", REPORT_STATUSES), name="ck_reports_status"),
        Index("ix_reports_job_id", "job_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    job_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False
    )
    # Any signed-in account (seeker or employer) may report — not restricted
    # to a single role, unlike Application/JobSeeker.
    reporter_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    reason: Mapped[str] = mapped_column(report_reason_enum, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        report_status_enum, nullable=False, server_default=text("'pending'")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    job: Mapped[Job] = relationship()
    reporter: Mapped[User] = relationship()

class Warning(Base):
    """A warning an admin issues to a user account, after reviewing a report."""

    __tablename__ = "warnings"
    __table_args__ = (Index("ix_warnings_user_id", "user_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    # Nullable: the issuing admin account may later be removed without losing
    # the warning itself, only the attribution.
    issued_by: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL")
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped[User] = relationship(foreign_keys=[user_id])
