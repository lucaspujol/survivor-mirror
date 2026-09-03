from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import COOKIE_NAME
from app.db import get_session
from app.models import User
from app.security import decode_access_token

TokenCookie = Annotated[str | None, Cookie(alias=COOKIE_NAME)]
DbSession = Annotated[Session, Depends(get_session)]


def get_current_user_optional(db: DbSession, access_token: TokenCookie = None) -> User | None:
    """Resolve the signed-in user, or None. For endpoints that are public but
    behave differently when signed in (the map, offer detail)."""
    if access_token is None:
        return None
    user_id = decode_access_token(access_token)
    if user_id is None:
        return None
    return db.get(User, user_id)


def get_current_user(
    user: Annotated[User | None, Depends(get_current_user_optional)],
) -> User:
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: str):
    """Dependency factory: allow the request only for those roles.

    401 when signed out, 403 when signed in with the wrong role, so the
    frontend can tell "log in" from "not for you".
    """

    def dependency(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "This action is not available for your account",
            )
        return user

    return dependency


CurrentSeeker = Annotated[User, Depends(require_role("seeker"))]
CurrentEmployer = Annotated[User, Depends(require_role("employer"))]
CurrentAdmin = Annotated[User, Depends(require_role("admin"))]
