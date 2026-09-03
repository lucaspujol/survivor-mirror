from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.config import COOKIE_NAME, get_settings
from app.deps import CurrentUser, DbSession
from app.models import Employer, JobSeeker, User
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


def _to_user_out(user: User) -> UserOut:
    if user.job_seeker is not None:
        display_name = f"{user.job_seeker.first_name} {user.job_seeker.last_name}"
    elif user.employer is not None:
        display_name = user.employer.company_name
    else:
        # Admins are created straight in the database, with no profile row.
        display_name = user.email
    return UserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        display_name=display_name,
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
    return _to_user_out(user)


@router.post("/login", response_model=UserOut)
def login(payload: LoginIn, response: Response, db: DbSession) -> UserOut:
    user = db.scalar(select(User).where(User.email == payload.email))
    # Same message either way: do not leak which emails exist.
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    _set_auth_cookie(response, user.id)
    return _to_user_out(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> UserOut:
    return _to_user_out(user)
