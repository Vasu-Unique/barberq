import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.core.permissions import require_admin
from app.schemas.audit_log import AuditLogOut
from app.schemas.common import ApiResponse
from app.services.audit_service import AuditService

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
    dependencies=[Depends(require_admin)],
)


@router.get("/", response_model=ApiResponse[List[AuditLogOut]])
async def list_audit_logs(
    user_id: Optional[uuid.UUID] = Query(None),
    action: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    service = AuditService(db)
    logs = await service.list_logs(
        user_id=user_id,
        action=action,
        offset=offset,
        limit=limit,
    )
    items = [
        AuditLogOut(
            id=log.id,
            user_id=log.user_id,
            action=log.action,
            event_time=log.event_time,
            ip_address=str(log.ip_address) if log.ip_address else None,
            user_agent=log.user_agent,
            metadata=log.metadata_,
        )
        for log in logs
    ]
    return ApiResponse(data=items)


@router.get("/{log_id}", response_model=ApiResponse[AuditLogOut])
async def get_audit_log(
    log_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = AuditService(db)
    log = await service.get_log(log_id)
    if not log:
        raise NotFoundException("Audit log entry not found")

    return ApiResponse(
        data=AuditLogOut(
            id=log.id,
            user_id=log.user_id,
            action=log.action,
            event_time=log.event_time,
            ip_address=str(log.ip_address) if log.ip_address else None,
            user_agent=log.user_agent,
            metadata=log.metadata_,
        )
    )
