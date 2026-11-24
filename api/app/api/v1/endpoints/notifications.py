import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.notification import NotificationOut
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=ApiResponse[List[NotificationOut]])
async def list_notifications(
    unread_only: Optional[bool] = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    items = await service.list_user_notifications(
        current_user.id, unread_only=unread_only
    )
    return ApiResponse(
        data=[NotificationOut.model_validate(n) for n in items]
    )


@router.patch("/{notification_id}/read", response_model=ApiResponse[None])
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    success = await service.mark_read(notification_id, current_user.id)
    return ApiResponse(
        success=success,
        message="Notification marked as read" if success else "Notification not found",
    )


@router.patch("/read-all", response_model=ApiResponse[None])
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    count = await service.mark_all_read(current_user.id)
    return ApiResponse(message=f"Marked {count} notifications as read")
