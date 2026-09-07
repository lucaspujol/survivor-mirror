"""In-app notifications.

The brief asks for an in-app notification on each new application and
explicitly not for an email, so a notification is a row the recipient reads
from their own screen. Rows are written by whichever endpoint caused them
(see routers/applications.py).
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, update

from app.deps import CurrentUser, DbSession
from app.models import Notification
from app.schemas import NotificationOut

router = APIRouter(prefix="/api", tags=["notifications"])


def _to_out(notification: Notification) -> NotificationOut:
    return NotificationOut(
        id=notification.id,
        type=notification.type,
        title=notification.title,
        body=notification.body,
        job_id=notification.job_id,
        read_at=notification.read_at,
        created_at=notification.created_at,
    )


@router.get("/notifications", response_model=list[NotificationOut])
def my_notifications(user: CurrentUser, db: DbSession) -> list[NotificationOut]:
    """The signed-in account's notifications, newest first."""
    notifications = db.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
    ).all()
    return [_to_out(notification) for notification in notifications]


@router.post("/notifications/{notification_id}/lu", response_model=NotificationOut)
def mark_read(notification_id: int, user: CurrentUser, db: DbSession) -> NotificationOut:
    notification = db.get(Notification, notification_id)
    if notification is None or notification.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification introuvable.")

    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)
    return _to_out(notification)


@router.post("/notifications/lues", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(user: CurrentUser, db: DbSession) -> None:
    db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.read_at.is_(None))
        .values(read_at=datetime.now(timezone.utc))
    )
    db.commit()
