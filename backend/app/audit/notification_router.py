"""Notification API endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.users.models import User
from app.audit.models import Notification


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_name = current_user.role.name.lower()
    notifs = db.query(Notification).filter(
        or_(
            Notification.user_id == current_user.id,
            Notification.role == role_name
        )
    ).order_by(Notification.created_at.desc()).limit(50).all()

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read == "1",
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in notifs
    ]


@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.is_read = "1"
        db.commit()
    return {"success": True}


@router.get("/unread-count")
async def unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_name = current_user.role.name.lower()
    count = db.query(Notification).filter(
        or_(
            Notification.user_id == current_user.id,
            Notification.role == role_name
        ),
        Notification.is_read == "0"
    ).count()
    return {"count": count}
