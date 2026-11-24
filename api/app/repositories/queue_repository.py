import uuid
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional, Sequence, Tuple
from sqlalchemy import desc, func, select, and_, or_, cast, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.queue_session import QueueSession
from app.models.queue_entry import QueueEntry
from app.models.queue_event import QueueEvent
from app.models.notification import Notification
from app.models.audit_log import AuditLog


class QueueRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Queue Session
    async def get_or_create_session(
        self, salon_id: uuid.UUID, session_date: Optional[date] = None
    ) -> QueueSession:
        if not session_date:
            session_date = datetime.now(timezone.utc).date()

        stmt = select(QueueSession).where(
            QueueSession.salon_id == salon_id,
            QueueSession.session_date == session_date,
        )
        result = await self.db.execute(stmt)
        session = result.scalar_one_or_none()

        if not session:
            session = QueueSession(
                salon_id=salon_id,
                session_date=session_date,
                last_token_number=0,
                status="OPEN",
            )
            self.db.add(session)
            await self.db.flush()

        return session

    async def get_session_by_id(
        self, session_id: uuid.UUID
    ) -> Optional[QueueSession]:
        stmt = select(QueueSession).where(QueueSession.id == session_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_session_with_lock(
        self, session_id: uuid.UUID
    ) -> Optional[QueueSession]:
        stmt = (
            select(QueueSession)
            .where(QueueSession.id == session_id)
            .with_for_update()
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_session(self, session: QueueSession) -> QueueSession:
        self.db.add(session)
        await self.db.flush()
        return session

    # Queue Entries
    async def get_entry_by_id(
        self, entry_id: uuid.UUID
    ) -> Optional[QueueEntry]:
        stmt = (
            select(QueueEntry)
            .where(QueueEntry.id == entry_id)
            .options(
                selectinload(QueueEntry.session),
                selectinload(QueueEntry.service),
                selectinload(QueueEntry.customer),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_entry_with_lock(
        self, entry_id: uuid.UUID
    ) -> Optional[QueueEntry]:
        stmt = (
            select(QueueEntry)
            .where(QueueEntry.id == entry_id)
            .with_for_update()
            .options(
                selectinload(QueueEntry.session),
                selectinload(QueueEntry.service),
                selectinload(QueueEntry.customer),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_entry(self, entry: QueueEntry) -> QueueEntry:
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def update_entry(self, entry: QueueEntry) -> QueueEntry:
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def get_active_user_entry(
        self, user_id: uuid.UUID, session_id: uuid.UUID
    ) -> Optional[QueueEntry]:
        stmt = select(QueueEntry).where(
            QueueEntry.customer_id == user_id,
            QueueEntry.session_id == session_id,
            QueueEntry.status.in_(["WAITING", "CALLED", "SERVING"]),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_active_user_entries(
        self, user_id: uuid.UUID
    ) -> Sequence[QueueEntry]:
        stmt = (
            select(QueueEntry)
            .where(
                QueueEntry.customer_id == user_id,
                QueueEntry.status.in_(["WAITING", "CALLED", "SERVING"]),
            )
            .options(
                selectinload(QueueEntry.session),
                selectinload(QueueEntry.service),
            )
            .order_by(QueueEntry.joined_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_session_entries(
        self,
        session_id: uuid.UUID,
        statuses: Optional[List[str]] = None,
    ) -> Sequence[QueueEntry]:
        stmt = (
            select(QueueEntry)
            .where(QueueEntry.session_id == session_id)
            .options(
                selectinload(QueueEntry.service),
                selectinload(QueueEntry.customer),
            )
        )
        if statuses:
            stmt = stmt.where(QueueEntry.status.in_(statuses))
        stmt = stmt.order_by(QueueEntry.token_number.asc())
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_paginated_entries(
        self,
        salon_id: uuid.UUID,
        session_id: Optional[uuid.UUID] = None,
        statuses: Optional[List[str]] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 10,
    ) -> Tuple[Sequence[QueueEntry], int]:
        stmt = (
            select(QueueEntry)
            .join(QueueSession, QueueEntry.session_id == QueueSession.id)
            .where(QueueSession.salon_id == salon_id)
            .options(
                selectinload(QueueEntry.service),
                selectinload(QueueEntry.customer),
                selectinload(QueueEntry.session),
            )
        )
        count_stmt = (
            select(func.count(QueueEntry.id))
            .join(QueueSession, QueueEntry.session_id == QueueSession.id)
            .where(QueueSession.salon_id == salon_id)
        )

        if session_id:
            stmt = stmt.where(QueueEntry.session_id == session_id)
            count_stmt = count_stmt.where(QueueEntry.session_id == session_id)

        if statuses:
            upper_statuses = [s.upper() for s in statuses]
            stmt = stmt.where(QueueEntry.status.in_(upper_statuses))
            count_stmt = count_stmt.where(QueueEntry.status.in_(upper_statuses))

        if search:
            pattern = f"%{search}%"
            search_cond = or_(
                QueueEntry.customer_name.ilike(pattern),
                QueueEntry.customer_phone.ilike(pattern),
                cast(QueueEntry.token_number, String).ilike(pattern),
            )
            stmt = stmt.where(search_cond)
            count_stmt = count_stmt.where(search_cond)

        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar_one()

        stmt = stmt.order_by(QueueEntry.joined_at.desc()).offset(offset).limit(limit)
        items_res = await self.db.execute(stmt)
        items = items_res.scalars().all()
        return items, total

    async def get_currently_serving_entry(
        self, session_id: uuid.UUID
    ) -> Optional[QueueEntry]:
        stmt = (
            select(QueueEntry)
            .where(
                QueueEntry.session_id == session_id,
                QueueEntry.status == "SERVING",
            )
            .options(
                selectinload(QueueEntry.service),
                selectinload(QueueEntry.customer),
            )
            .order_by(QueueEntry.started_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_next_waiting_entry(
        self, session_id: uuid.UUID
    ) -> Optional[QueueEntry]:
        stmt = (
            select(QueueEntry)
            .where(
                QueueEntry.session_id == session_id,
                QueueEntry.status == "WAITING",
            )
            .options(
                selectinload(QueueEntry.service),
                selectinload(QueueEntry.customer),
            )
            .order_by(QueueEntry.token_number.asc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def count_waiting_entries(self, session_id: uuid.UUID) -> int:
        stmt = select(func.count(QueueEntry.id)).where(
            QueueEntry.session_id == session_id,
            QueueEntry.status == "WAITING",
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    # Queue Events
    async def create_event(
        self,
        queue_entry_id: uuid.UUID,
        event_type: str,
        actor_id: Optional[uuid.UUID] = None,
        description: Optional[str] = None,
    ) -> QueueEvent:
        event = QueueEvent(
            queue_entry_id=queue_entry_id,
            actor_id=actor_id,
            event_type=event_type,
            description=description,
        )
        self.db.add(event)
        await self.db.flush()
        return event

    async def list_events_for_entry(
        self, queue_entry_id: uuid.UUID
    ) -> Sequence[QueueEvent]:
        stmt = (
            select(QueueEvent)
            .where(QueueEvent.queue_entry_id == queue_entry_id)
            .order_by(QueueEvent.created_at.asc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    # Notifications
    async def create_notification(
        self,
        user_id: uuid.UUID,
        title: str,
        message: str,
        notification_type: str,
        queue_entry_id: Optional[uuid.UUID] = None,
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            queue_entry_id=queue_entry_id,
            title=title,
            message=message,
            notification_type=notification_type,
        )
        self.db.add(notif)
        await self.db.flush()
        return notif

    async def list_notifications(
        self, user_id: uuid.UUID, unread_only: bool = False
    ) -> Sequence[Notification]:
        stmt = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.is_read == False)
        stmt = stmt.order_by(Notification.created_at.desc())
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_notification(
        self, notification_id: uuid.UUID
    ) -> Optional[Notification]:
        stmt = select(Notification).where(Notification.id == notification_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def mark_notification_read(self, notification_id: uuid.UUID) -> bool:
        stmt = select(Notification).where(Notification.id == notification_id)
        result = await self.db.execute(stmt)
        notif = result.scalar_one_or_none()
        if notif:
            notif.is_read = True
            self.db.add(notif)
            await self.db.flush()
            return True
        return False

    async def mark_all_notifications_read(self, user_id: uuid.UUID) -> int:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
        )
        result = await self.db.execute(stmt)
        items = result.scalars().all()
        for item in items:
            item.is_read = True
            self.db.add(item)
        await self.db.flush()
        return len(items)

    # Audit Logs
    async def create_audit_log(
        self,
        action: str,
        user_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        log = AuditLog(
            action=action,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_=metadata,
        )
        self.db.add(log)
        await self.db.flush()
        return log

    async def list_audit_logs(
        self,
        user_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        offset: int = 0,
        limit: int = 50,
    ) -> Sequence[AuditLog]:
        stmt = select(AuditLog)
        if user_id:
            stmt = stmt.where(AuditLog.user_id == user_id)
        if action:
            stmt = stmt.where(AuditLog.action == action)
        if start_date:
            stmt = stmt.where(AuditLog.event_time >= start_date)
        if end_date:
            stmt = stmt.where(AuditLog.event_time <= end_date)
        stmt = stmt.order_by(AuditLog.event_time.desc()).offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_audit_log(self, log_id: uuid.UUID) -> Optional[AuditLog]:
        stmt = select(AuditLog).where(AuditLog.id == log_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
