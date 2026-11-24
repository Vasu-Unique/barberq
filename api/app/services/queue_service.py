import math
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.models.queue_entry import QueueEntry
from app.models.queue_session import QueueSession
from app.models.salon import Salon
from app.models.user import User
from app.repositories.queue_repository import QueueRepository
from app.repositories.salon_repository import SalonRepository
from app.schemas.queue import (
    EstimatedWaitOut,
    QueueJoinRequest,
    QueueStateOut,
    QueueTokenOut,
    WalkInRequest,
)
from app.services.notification_service import NotificationService
from app.websocket.events import QueueEvents
from app.websocket.manager import ws_manager


class QueueService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.queue_repo = QueueRepository(db)
        self.salon_repo = SalonRepository(db)
        self.notif_service = NotificationService(db)

    async def get_or_create_daily_session(
        self, salon_id: uuid.UUID
    ) -> QueueSession:
        return await self.queue_repo.get_or_create_session(salon_id)

    def _calculate_estimated_wait(
        self,
        target_entry: QueueEntry,
        serving_entry: Optional[QueueEntry],
        waiting_entries: List[QueueEntry],
    ) -> Tuple[int, int]:
        """Returns (people_ahead, estimated_wait_minutes)."""
        now = datetime.now(timezone.utc)
        serving_remaining = 0

        if serving_entry and serving_entry.status == "SERVING" and serving_entry.started_at:
            started = serving_entry.started_at
            if started.tzinfo is None:
                started = started.replace(tzinfo=timezone.utc)
            elapsed = (now - started).total_seconds() / 60.0
            serving_remaining = max(0, int(math.ceil(serving_entry.estimated_duration - elapsed)))

        # Find position among waiting entries
        people_ahead = 0
        sum_ahead_duration = 0

        for entry in waiting_entries:
            if entry.id == target_entry.id:
                break
            people_ahead += 1
            sum_ahead_duration += entry.estimated_duration

        total_wait = (serving_remaining if serving_entry else 0) + sum_ahead_duration
        return people_ahead, total_wait

    def _format_token_out(
        self,
        entry: QueueEntry,
        people_ahead: Optional[int] = None,
        estimated_wait: Optional[int] = None,
    ) -> QueueTokenOut:
        return QueueTokenOut(
            id=entry.id,
            session_id=entry.session_id,
            salon_id=entry.session.salon_id if entry.session else None,
            customer_id=entry.customer_id,
            service_id=entry.service_id,
            service_name=entry.service.service_name if entry.service else None,
            token_number=entry.token_number,
            customer_name=entry.customer_name,
            customer_phone=entry.customer_phone,
            status=entry.status,
            estimated_duration=entry.estimated_duration,
            service_price=entry.service_price,
            joined_at=entry.joined_at,
            called_at=entry.called_at,
            started_at=entry.started_at,
            completed_at=entry.completed_at,
            cancelled_at=entry.cancelled_at,
            people_ahead=people_ahead,
            estimated_wait_minutes=estimated_wait,
        )

    async def get_queue_state(self, salon_id: uuid.UUID) -> QueueStateOut:
        session = await self.queue_repo.get_or_create_session(salon_id)
        entries = await self.queue_repo.list_session_entries(
            session.id, statuses=["SERVING", "CALLED", "WAITING"]
        )

        serving_entry = next((e for e in entries if e.status == "SERVING"), None)
        called_entry = next((e for e in entries if e.status == "CALLED"), None)
        active_entry = serving_entry or called_entry
        waiting_entries = [e for e in entries if e.status == "WAITING"]

        formatted_waiting: List[QueueTokenOut] = []
        for e in waiting_entries:
            ahead, wait_mins = self._calculate_estimated_wait(
                e, active_entry, waiting_entries
            )
            formatted_waiting.append(self._format_token_out(e, ahead, wait_mins))

        formatted_serving = (
            self._format_token_out(active_entry, 0, 0) if active_entry else None
        )

        total_wait = sum(e.estimated_wait_minutes or 0 for e in formatted_waiting)
        if formatted_serving and active_entry:
            total_wait += active_entry.estimated_duration

        return QueueStateOut(
            salon_id=salon_id,
            is_open=(session.status == "OPEN"),
            serving_entry=formatted_serving,
            waiting_entries=formatted_waiting,
            total_waiting=len(waiting_entries),
            estimated_total_wait_minutes=total_wait,
        )

    async def join_queue(
        self,
        salon_id: uuid.UUID,
        customer: User,
        data: QueueJoinRequest,
    ) -> QueueTokenOut:
        salon = await self.salon_repo.get_by_id(salon_id)
        if not salon or not salon.is_active:
            raise BadRequestException("Salon is not active or accepting queues")

        # Get service
        service = await self.salon_repo.get_service(data.service_id)
        if not service or service.salon_id != salon_id or not service.is_available:
            raise BadRequestException("Selected service is not available at this salon")

        # Get or create session
        session = await self.queue_repo.get_or_create_session(salon_id)
        if session.status != "OPEN":
            raise BadRequestException(f"Queue session is currently {session.status.lower()}")

        # Check existing active token
        existing_active = await self.queue_repo.get_active_user_entry(
            customer.id, session.id
        )
        if existing_active:
            raise ConflictException(
                f"You already have an active token (#{existing_active.token_number}) in this salon's queue"
            )

        # Lock session row for concurrency-safe token generation
        locked_session = await self.queue_repo.get_session_with_lock(session.id)
        if not locked_session:
            raise NotFoundException("Session not found during lock")

        # Check capacity
        waiting_count = await self.queue_repo.count_waiting_entries(locked_session.id)
        if waiting_count >= salon.max_queue_capacity:
            raise BadRequestException("Queue has reached maximum capacity for today")

        # Generate next token
        locked_session.last_token_number += 1
        new_token_number = locked_session.last_token_number
        await self.queue_repo.update_session(locked_session)

        # Create queue entry with duration and price snapshots
        customer_name = data.customer_name or customer.full_name
        customer_phone = data.customer_phone or customer.phone

        entry = QueueEntry(
            session_id=locked_session.id,
            customer_id=customer.id,
            service_id=service.id,
            token_number=new_token_number,
            customer_name=customer_name,
            customer_phone=customer_phone,
            status="WAITING",
            estimated_duration=service.duration_minutes,
            service_price=service.price,
        )
        created_entry = await self.queue_repo.create_entry(entry)

        # Log event
        await self.queue_repo.create_event(
            queue_entry_id=created_entry.id,
            actor_id=customer.id,
            event_type=QueueEvents.QUEUE_JOINED,
            description=f"Joined queue with token #{new_token_number}",
        )

        # Calculate position & wait
        serving = await self.queue_repo.get_currently_serving_entry(locked_session.id)
        waitings = list(
            await self.queue_repo.list_session_entries(
                locked_session.id, statuses=["WAITING"]
            )
        )
        ahead, wait_mins = self._calculate_estimated_wait(
            created_entry, serving, waitings
        )

        # Broadcast WebSocket event to salon
        await ws_manager.broadcast_to_salon(
            str(salon_id),
            {
                "event": QueueEvents.QUEUE_UPDATED,
                "data": {"salon_id": str(salon_id), "action": "customer_joined"},
            },
        )

        # Send notification to customer
        await self.notif_service.notify_user(
            user_id=customer.id,
            title="Token Booked",
            message=f"You joined the queue at {salon.salon_name}. Your token is #{new_token_number}.",
            notification_type=QueueEvents.QUEUE_JOINED,
            queue_entry_id=created_entry.id,
        )

        return self._format_token_out(created_entry, ahead, wait_mins)

    async def add_walk_in(
        self,
        salon_id: uuid.UUID,
        staff_user: User,
        data: WalkInRequest,
    ) -> QueueTokenOut:
        salon = await self.salon_repo.get_by_id(salon_id)
        if not salon or not salon.is_active:
            raise BadRequestException("Salon is not active")

        service = await self.salon_repo.get_service(data.service_id)
        if not service or service.salon_id != salon_id or not service.is_available:
            raise BadRequestException("Selected service is not available")

        session = await self.queue_repo.get_or_create_session(salon_id)
        locked_session = await self.queue_repo.get_session_with_lock(session.id)
        if not locked_session:
            raise NotFoundException("Session not found")

        locked_session.last_token_number += 1
        new_token_number = locked_session.last_token_number
        await self.queue_repo.update_session(locked_session)

        entry = QueueEntry(
            session_id=locked_session.id,
            customer_id=None,
            service_id=service.id,
            token_number=new_token_number,
            customer_name=data.customer_name,
            customer_phone=data.customer_phone,
            status="WAITING",
            estimated_duration=service.duration_minutes,
            service_price=service.price,
        )
        created_entry = await self.queue_repo.create_entry(entry)

        await self.queue_repo.create_event(
            queue_entry_id=created_entry.id,
            actor_id=staff_user.id,
            event_type=QueueEvents.QUEUE_JOINED,
            description=f"Walk-in customer added with token #{new_token_number}",
        )

        # Broadcast update
        await ws_manager.broadcast_to_salon(
            str(salon_id),
            {
                "event": QueueEvents.QUEUE_UPDATED,
                "data": {"salon_id": str(salon_id), "action": "walk_in_added"},
            },
        )

        serving = await self.queue_repo.get_currently_serving_entry(locked_session.id)
        waitings = list(
            await self.queue_repo.list_session_entries(
                locked_session.id, statuses=["WAITING"]
            )
        )
        ahead, wait_mins = self._calculate_estimated_wait(
            created_entry, serving, waitings
        )

        return self._format_token_out(created_entry, ahead, wait_mins)

    async def call_next(
        self, salon_id: uuid.UUID, staff_user: User
    ) -> QueueTokenOut:
        session = await self.queue_repo.get_or_create_session(salon_id)
        locked_session = await self.queue_repo.get_session_with_lock(session.id)
        if not locked_session:
            raise NotFoundException("Session not found")

        # Select earliest WAITING customer
        next_entry = await self.queue_repo.get_next_waiting_entry(locked_session.id)
        if not next_entry:
            raise NotFoundException("No customers currently waiting in the queue")

        # Lock entry
        entry = await self.queue_repo.get_entry_with_lock(next_entry.id)
        if not entry or entry.status != "WAITING":
            raise ConflictException("Token state has changed, please try again")

        now = datetime.now(timezone.utc)
        entry.status = "CALLED"
        entry.called_at = now
        await self.queue_repo.update_entry(entry)

        # Record event
        await self.queue_repo.create_event(
            queue_entry_id=entry.id,
            actor_id=staff_user.id,
            event_type=QueueEvents.TOKEN_CALLED,
            description=f"Called token #{entry.token_number}",
        )

        # Notify called customer
        if entry.customer_id:
            await self.notif_service.notify_user(
                user_id=entry.customer_id,
                title="Your Turn!",
                message=f"Token #{entry.token_number} is being called! Please proceed to the service chair.",
                notification_type=QueueEvents.TOKEN_CALLED,
                queue_entry_id=entry.id,
            )

        # Check remaining waiting entries and alert position 1 & 2
        waitings = list(
            await self.queue_repo.list_session_entries(
                locked_session.id, statuses=["WAITING"]
            )
        )
        if len(waitings) >= 1 and waitings[0].customer_id:
            await self.notif_service.notify_user(
                user_id=waitings[0].customer_id,
                title="You're Next in Line!",
                message=f"Token #{waitings[0].token_number}, you are next up! Please stay nearby.",
                notification_type=QueueEvents.YOU_ARE_NEXT,
                queue_entry_id=waitings[0].id,
            )
        if len(waitings) >= 2 and waitings[1].customer_id:
            await self.notif_service.notify_user(
                user_id=waitings[1].customer_id,
                title="Your Turn is Approaching",
                message=f"Token #{waitings[1].token_number}, there is only 1 person ahead of you.",
                notification_type=QueueEvents.YOUR_TURN_APPROACHING,
                queue_entry_id=waitings[1].id,
            )

        # Broadcast WebSocket event
        await ws_manager.broadcast_to_salon(
            str(salon_id),
            {
                "event": QueueEvents.TOKEN_CALLED,
                "data": {
                    "token_id": str(entry.id),
                    "token_number": entry.token_number,
                    "customer_name": entry.customer_name,
                },
            },
        )
        await ws_manager.broadcast_to_salon(
            str(salon_id),
            {"event": QueueEvents.QUEUE_UPDATED, "data": {"salon_id": str(salon_id)}},
        )

        return self._format_token_out(entry, 0, 0)

    async def start_service(
        self, salon_id: uuid.UUID, entry_id: uuid.UUID, staff_user: User
    ) -> QueueTokenOut:
        entry = await self.queue_repo.get_entry_with_lock(entry_id)
        if not entry:
            raise NotFoundException("Queue token not found")

        if entry.status not in ["CALLED", "WAITING"]:
            raise BadRequestException(
                f"Cannot start service for token in status '{entry.status}'"
            )

        now = datetime.now(timezone.utc)
        entry.status = "SERVING"
        entry.started_at = now
        await self.queue_repo.update_entry(entry)

        await self.queue_repo.create_event(
            queue_entry_id=entry.id,
            actor_id=staff_user.id,
            event_type=QueueEvents.SERVICE_STARTED,
            description=f"Service started for token #{entry.token_number}",
        )

        if entry.customer_id:
            await self.notif_service.notify_user(
                user_id=entry.customer_id,
                title="Service Started",
                message=f"Service started for your token #{entry.token_number}.",
                notification_type=QueueEvents.SERVICE_STARTED,
                queue_entry_id=entry.id,
            )

        await ws_manager.broadcast_to_salon(
            str(salon_id),
            {
                "event": QueueEvents.SERVICE_STARTED,
                "data": {"token_id": str(entry.id), "token_number": entry.token_number},
            },
        )
        await ws_manager.broadcast_to_salon(
            str(salon_id),
            {"event": QueueEvents.QUEUE_UPDATED, "data": {"salon_id": str(salon_id)}},
        )

        return self._format_token_out(entry, 0, 0)

    async def complete_service(
        self, salon_id: uuid.UUID, entry_id: uuid.UUID, staff_user: User
    ) -> QueueTokenOut:
        entry = await self.queue_repo.get_entry_with_lock(entry_id)
        if not entry:
            raise NotFoundException("Queue token not found")

        if entry.status != "SERVING":
            raise BadRequestException(
                f"Cannot complete service for token in status '{entry.status}'. Must be 'SERVING'."
            )

        now = datetime.now(timezone.utc)
        entry.status = "COMPLETED"
        entry.completed_at = now
        await self.queue_repo.update_entry(entry)

        await self.queue_repo.create_event(
            queue_entry_id=entry.id,
            actor_id=staff_user.id,
            event_type=QueueEvents.SERVICE_COMPLETED,
            description=f"Service completed for token #{entry.token_number}",
        )

        if entry.customer_id:
            await self.notif_service.notify_user(
                user_id=entry.customer_id,
                title="Service Completed",
                message=f"Your grooming service (token #{entry.token_number}) is complete! Thank you for visiting.",
                notification_type=QueueEvents.SERVICE_COMPLETED,
                queue_entry_id=entry.id,
            )

        await ws_manager.broadcast_to_salon(
            str(salon_id),
            {
                "event": QueueEvents.SERVICE_COMPLETED,
                "data": {"token_id": str(entry.id), "token_number": entry.token_number},
            },
        )
        await ws_manager.broadcast_to_salon(
            str(salon_id),
            {"event": QueueEvents.QUEUE_UPDATED, "data": {"salon_id": str(salon_id)}},
        )

        return self._format_token_out(entry, 0, 0)

    async def cancel_token(
        self, entry_id: uuid.UUID, user: User, is_staff: bool = False
    ) -> QueueTokenOut:
        entry = await self.queue_repo.get_entry_with_lock(entry_id)
        if not entry:
            raise NotFoundException("Queue token not found")

        # Check permissions
        if not is_staff and entry.customer_id != user.id:
            raise ForbiddenException("You cannot cancel another customer's token")

        if entry.status in ["COMPLETED", "CANCELLED"]:
            raise BadRequestException(
                f"Cannot cancel token in status '{entry.status}'"
            )

        now = datetime.now(timezone.utc)
        entry.status = "CANCELLED"
        entry.cancelled_at = now
        await self.queue_repo.update_entry(entry)

        await self.queue_repo.create_event(
            queue_entry_id=entry.id,
            actor_id=user.id,
            event_type=QueueEvents.TOKEN_CANCELLED,
            description=f"Token #{entry.token_number} cancelled",
        )

        session = await self.queue_repo.get_session_by_id(entry.session_id)
        if session:
            await ws_manager.broadcast_to_salon(
                str(session.salon_id),
                {
                    "event": QueueEvents.TOKEN_CANCELLED,
                    "data": {"token_id": str(entry.id), "token_number": entry.token_number},
                },
            )
            await ws_manager.broadcast_to_salon(
                str(session.salon_id),
                {"event": QueueEvents.QUEUE_UPDATED, "data": {"salon_id": str(session.salon_id)}},
            )

        return self._format_token_out(entry, 0, 0)

    async def skip_token(
        self, salon_id: uuid.UUID, entry_id: uuid.UUID, staff_user: User
    ) -> QueueTokenOut:
        entry = await self.queue_repo.get_entry_with_lock(entry_id)
        if not entry:
            raise NotFoundException("Queue token not found")

        if entry.status not in ["CALLED", "WAITING"]:
            raise BadRequestException(f"Cannot skip token in status '{entry.status}'")

        entry.status = "SKIPPED"
        await self.queue_repo.update_entry(entry)

        await self.queue_repo.create_event(
            queue_entry_id=entry.id,
            actor_id=staff_user.id,
            event_type=QueueEvents.TOKEN_SKIPPED,
            description=f"Token #{entry.token_number} skipped by staff",
        )

        await ws_manager.broadcast_to_salon(
            str(salon_id),
            {"event": QueueEvents.QUEUE_UPDATED, "data": {"salon_id": str(salon_id)}},
        )

        return self._format_token_out(entry, 0, 0)

    async def get_token_details(
        self, entry_id: uuid.UUID, user: Optional[User] = None
    ) -> QueueTokenOut:
        entry = await self.queue_repo.get_entry_by_id(entry_id)
        if not entry:
            raise NotFoundException("Queue token not found")

        session = await self.queue_repo.get_session_by_id(entry.session_id)
        serving = (
            await self.queue_repo.get_currently_serving_entry(session.id)
            if session
            else None
        )
        waitings = list(
            await self.queue_repo.list_session_entries(
                entry.session_id, statuses=["WAITING"]
            )
        )
        ahead, wait_mins = self._calculate_estimated_wait(
            entry, serving, waitings
        )

        return self._format_token_out(entry, ahead, wait_mins)

    async def get_my_active_tokens(self, user_id: uuid.UUID) -> List[QueueTokenOut]:
        entries = await self.queue_repo.list_active_user_entries(user_id)
        result: List[QueueTokenOut] = []
        for e in entries:
            serving = await self.queue_repo.get_currently_serving_entry(e.session_id)
            waitings = list(
                await self.queue_repo.list_session_entries(
                    e.session_id, statuses=["WAITING"]
                )
            )
            ahead, wait_mins = self._calculate_estimated_wait(e, serving, waitings)
            result.append(self._format_token_out(e, ahead, wait_mins))
        return result

    async def list_salon_entries_paginated(
        self,
        salon_id: uuid.UUID,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> Tuple[List[QueueTokenOut], int]:
        offset = (page - 1) * limit
        statuses = None
        if status and status.lower() != "all":
            if status.lower() == "active":
                statuses = ["WAITING", "SERVING", "CALLED"]
            else:
                statuses = [status.upper()]

        entries, total = await self.queue_repo.list_paginated_entries(
            salon_id=salon_id,
            statuses=statuses,
            search=search,
            offset=offset,
            limit=limit,
        )

        result: List[QueueTokenOut] = []
        for e in entries:
            serving = await self.queue_repo.get_currently_serving_entry(e.session_id)
            waitings = list(
                await self.queue_repo.list_session_entries(
                    e.session_id, statuses=["WAITING"]
                )
            )
            ahead, wait_mins = self._calculate_estimated_wait(e, serving, waitings)
            result.append(self._format_token_out(e, ahead, wait_mins))
        return result, total
