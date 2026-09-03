from datetime import datetime
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
    email: EmailStr
    role: str
    # Full name of a job seeker, company name of an employer: the profile
    # tables hold the names, the users table only authenticates.
    display_name: str
    created_at: datetime
