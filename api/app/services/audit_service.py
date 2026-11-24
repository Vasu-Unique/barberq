import uuid
from typing import Any, Dict, Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.repositories.queue_repository import QueueRepository


class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.queue_repo = QueueRepository(db)

    async def log_action(
        self,
        action: str,
        user_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        return await self.queue_repo.create_audit_log(
            action=action,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata,
        )

    async def list_logs(
        self,
        user_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        offset: int = 0,
        limit: int = 50,
    ) -> Sequence[AuditLog]:
        return await self.queue_repo.list_audit_logs(
            user_id=user_id,
            action=action,
            offset=offset,
            limit=limit,
        )

    async def get_log(self, log_id: uuid.UUID) -> Optional[AuditLog]:
        return await self.queue_repo.get_audit_log(log_id)
