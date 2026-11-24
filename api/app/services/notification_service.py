import uuid
from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.repositories.queue_repository import QueueRepository
from app.websocket.manager import ws_manager


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.queue_repo = QueueRepository(db)

    async def notify_user(
        self,
        user_id: uuid.UUID,
        title: str,
        message: str,
        notification_type: str,
        queue_entry_id: Optional[uuid.UUID] = None,
    ) -> Notification:
        notif = await self.queue_repo.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            queue_entry_id=queue_entry_id,
        )

        # Broadcast via WebSocket if user is connected
        await ws_manager.send_personal(
            str(user_id),
            {
                "event": notification_type,
                "data": {
                    "id": str(notif.id),
                    "title": notif.title,
                    "message": notif.message,
                    "queue_entry_id": str(queue_entry_id) if queue_entry_id else None,
                    "notification_type": notif.notification_type,
                    "created_at": notif.created_at.isoformat(),
                },
            },
        )
        return notif

    async def list_user_notifications(
        self, user_id: uuid.UUID, unread_only: bool = False
    ) -> Sequence[Notification]:
        return await self.queue_repo.list_notifications(user_id, unread_only=unread_only)

    async def mark_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        notif = await self.queue_repo.get_notification(notification_id)
        if not notif or notif.user_id != user_id:
            return False
        return await self.queue_repo.mark_notification_read(notification_id)

    async def mark_all_read(self, user_id: uuid.UUID) -> int:
        return await self.queue_repo.mark_all_notifications_read(user_id)
