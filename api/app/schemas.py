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
    # accepted, and EmailStr rejects reserved TLDs (.local, .test) that
    # existing accounts legitimately carry. Validation belongs on input.
    email: str
    role: str
    # Full name of a job seeker, company name of an employer: the profile
    # tables hold the names, the users table only authenticates.
    display_name: str
    created_at: datetime


class ApplicationDocumentOut(BaseModel):
    """A file attached to an application, without its content: the bytes are
    served by the dedicated download endpoint."""

    id: int
    kind: str
    original_name: str
    mime_type: str
    size_bytes: int


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


class SeekerApplicationDetailOut(SeekerApplicationOut):
    """Everything the job seeker sent, replayed on the application's detail
    screen: their contact details, their message and their documents."""

    first_name: str
    last_name: str
    phone: str | None
    message: str | None
    contract_type: str
    work_mode: str
    address: str | None
    job_description: str
    documents: list[ApplicationDocumentOut]


class EmployerApplicantOut(BaseModel):
    """One candidate who applied to one of the employer's offers.

    Carries the contact details the candidate chose to share on the form, plus
    the account email so the employer can always answer.
    """

    id: int
    job_id: int
    job_title: str
    status: str
    first_name: str
    last_name: str
    email: str
    phone: str | None
    message: str | None
    skills: list[str]
    experience: str | None
    availability: date | None
    documents: list[ApplicationDocumentOut]
    created_at: datetime
    updated_at: datetime


class ApplicationStatusIn(BaseModel):
    """Employer's decision on one application."""

    status: Literal["sent", "under_review", "accepted", "rejected"]


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
