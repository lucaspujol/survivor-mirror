from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, EmailStr, Field


class _RegisterBase(BaseModel):
    email: EmailStr
    # bcrypt silently ignores anything past 72 bytes, so reject it up front.
    password: str = Field(min_length=8, max_length=72)


class SeekerRegisterIn(_RegisterBase):
    role: Literal["seeker"] = "seeker"
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)


class EmployerRegisterIn(_RegisterBase):
    role: Literal["employer"]
    company_name: str = Field(min_length=1)


# Admin is deliberately not registerable: it is granted in the database.
RegisterIn = Annotated[
    SeekerRegisterIn | EmployerRegisterIn, Field(discriminator="role")
]


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    # Plain str, not EmailStr: this is a read of a value the database already
    # accepted, and EmailStr would reject reserved TLDs (.local, .test) that
    # existing accounts legitimately carry.
    email: str
    role: str
    # Full name of a job seeker, company name of an employer: the profile
    # tables hold the names, the users table only authenticates.
    display_name: str
    created_at: datetime


class SeekerApplicationOut(BaseModel):
    """One row of the job seeker's applications screen."""

    id: int
    job_id: int
    job_title: str
    company: str
    city: str
    status: str
    created_at: datetime
    updated_at: datetime


class EmployerOfferOut(BaseModel):
    """One row of the employer's offers screen."""

    id: int
    title: str
    description: str
    contract_type: str
    contract_duration: str | None
    work_mode: str
    time_commitment: str
    city: str
    address: str | None
    location_status: str
    application_count: int
    created_at: datetime
    expires_at: datetime


class AdminUserOut(BaseModel):
    """One row of the administrator's accounts screen."""

    id: int
    email: str
    role: str
    display_name: str
    # Employers only; None for the other roles.
    activity_verified: bool | None
    offer_count: int
    application_count: int
    created_at: datetime


class ApplicationCreateIn(BaseModel):
    """Applying carries no message: the brief transmits the seeker's profile,
    which the API already holds."""

    job_id: int


class SeekerProfileOut(BaseModel):
    """The profile the brief requires to be transmitted to the employer when
    a seeker applies. Contact details are included because handling the
    application is exactly what the seeker consented to by applying."""

    first_name: str
    last_name: str
    email: str
    skills: list[str]
    experience: str | None
    availability: date | None


class EmployerApplicationOut(BaseModel):
    """One applicant, as the employer sees them on their own offer."""

    id: int
    job_id: int
    job_title: str
    status: str
    created_at: datetime
    updated_at: datetime
    applicant: SeekerProfileOut


class ApplicationStatusIn(BaseModel):
    status: Literal["sent", "under_review", "accepted", "rejected"]


class ReportCreateIn(BaseModel):
    job_id: int
    reason: Literal["fraud", "misleading", "discrimination", "offensive", "other"]
    details: str | None = Field(default=None, max_length=2000)


class ReportOut(BaseModel):
    id: int
    job_id: int
    job_title: str
    company: str
    reason: str
    details: str | None
    status: str
    reporter_email: str
    created_at: datetime


class ReportStatusIn(BaseModel):
    status: Literal["pending", "reviewed", "dismissed"]


class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    body: str
    job_id: int | None
    read_at: datetime | None
    created_at: datetime
