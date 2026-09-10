from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import func, select

from app import storage
from app.config import COOKIE_NAME, get_settings
from app.deps import CurrentUser, DbSession
from app.models import Application, Employer, Job, JobSeeker, User, Warning
from app.schemas import EmployerRegisterIn, LoginIn, RegisterIn, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_auth_cookie(response: Response, user_id: int) -> None:
    settings = get_settings()
    response.set_cookie(
        COOKIE_NAME,
        create_access_token(user_id),
        max_age=settings.jwt_expire_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


def _to_user_out(user: User, db: DbSession) -> UserOut:
    if user.job_seeker is not None:
        display_name = f"{user.job_seeker.first_name} {user.job_seeker.last_name}"
    elif user.employer is not None:
        display_name = user.employer.company_name
    else:
        # Admins are created straight in the database, with no profile row.
        display_name = user.email

    warning_count = db.scalar(
        select(func.count(Warning.id)).where(Warning.user_id == user.id)
    ) or 0

    return UserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        display_name=display_name,
        warning_count=warning_count,
        created_at=user.created_at,
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, response: Response, db: DbSession) -> UserOut:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    if isinstance(payload, EmployerRegisterIn):
        user.employer = Employer(company_name=payload.company_name)
    else:
        user.job_seeker = JobSeeker(
            first_name=payload.first_name, last_name=payload.last_name
        )

    db.add(user)
    db.commit()
    db.refresh(user)

    _set_auth_cookie(response, user.id)
    return _to_user_out(user, db)


@router.post("/login", response_model=UserOut)
def login(payload: LoginIn, response: Response, db: DbSession) -> UserOut:
    user = db.scalar(select(User).where(User.email == payload.email))
    # Same message either way: do not leak which emails exist.
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    _set_auth_cookie(response, user.id)
    return _to_user_out(user, db)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser, db: DbSession) -> UserOut:
    return _to_user_out(user, db)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(user: CurrentUser, db: DbSession, response: Response) -> None:
    """Delete the signed-in account and everything attached to it.

    Brief §3.3: personal data must not outlive the active use of the account,
    and deleting it has to be possible. Every foreign key down from `users`
    cascades, so removing the row takes the profile, the offers, the
    applications and the document rows with it - but the database says nothing
    about the disk, so the uploaded files are collected first and removed once
    the delete commits.
    """
    # Applications to collect files for: the ones this seeker sent, plus the
    # ones received by the offers of this employer.
    application_ids = set(
        db.scalars(
            select(Application.id).where(Application.job_seeker_id == user.id)
        ).all()
    )
    application_ids.update(
        db.scalars(
            select(Application.id)
            .join(Job, Job.id == Application.job_id)
            .where(Job.employer_id == user.id)
        ).all()
    )

    db.delete(user)
    db.commit()

    for application_id in application_ids:
        storage.delete_application_files(application_id)

    # The account is gone: the cookie must not survive it.
    response.delete_cookie(COOKIE_NAME, path="/")
