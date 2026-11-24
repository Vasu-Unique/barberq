import math
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.permissions import verify_salon_staff_access
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse
from app.schemas.queue import QueueStateOut, QueueTokenOut, WalkInRequest
from app.services.queue_service import QueueService

router = APIRouter(prefix="/admin/queues/{salon_id}", tags=["Staff Queue Actions"])


@router.get("/", response_model=ApiResponse[QueueStateOut])
async def get_staff_queue_dashboard(
    salon_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = QueueService(db)
    state = await service.get_queue_state(salon_id)
    return ApiResponse(data=state)


@router.get("/entries", response_model=ApiResponse[PaginatedResponse[QueueTokenOut]])
async def list_queue_entries(
    salon_id: uuid.UUID,
    status: Optional[str] = Query(None, description="Filter by status (waiting, serving, completed, cancelled, skipped, active, all)"),
    search: Optional[str] = Query(None, description="Search by customer name, phone, or token number"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = QueueService(db)
    items, total = await service.list_salon_entries_paginated(
        salon_id=salon_id,
        status=status,
        search=search,
        page=page,
        limit=limit,
    )
    return ApiResponse(
        data=PaginatedResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=math.ceil(total / limit) if limit else 1,
        )
    )


@router.post("/call-next", response_model=ApiResponse[QueueTokenOut])
async def call_next_customer(
    salon_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = QueueService(db)
    token = await service.call_next(salon_id, current_user)
    return ApiResponse(
        message=f"Called token #{token.token_number} ({token.customer_name})",
        data=token,
    )


@router.patch("/{entry_id}/start", response_model=ApiResponse[QueueTokenOut])
async def start_service(
    salon_id: uuid.UUID,
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = QueueService(db)
    token = await service.start_service(salon_id, entry_id, current_user)
    return ApiResponse(
        message=f"Service started for token #{token.token_number}",
        data=token,
    )


@router.patch("/{entry_id}/complete", response_model=ApiResponse[QueueTokenOut])
async def complete_service(
    salon_id: uuid.UUID,
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = QueueService(db)
    token = await service.complete_service(salon_id, entry_id, current_user)
    return ApiResponse(
        message=f"Service completed for token #{token.token_number}",
        data=token,
    )


@router.patch("/{entry_id}/skip", response_model=ApiResponse[QueueTokenOut])
async def skip_customer(
    salon_id: uuid.UUID,
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = QueueService(db)
    token = await service.skip_token(salon_id, entry_id, current_user)
    return ApiResponse(
        message=f"Token #{token.token_number} skipped",
        data=token,
    )


@router.post(
    "/walk-in",
    response_model=ApiResponse[QueueTokenOut],
    status_code=status.HTTP_201_CREATED,
)
async def add_walk_in(
    salon_id: uuid.UUID,
    body: WalkInRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = QueueService(db)
    token = await service.add_walk_in(salon_id, current_user, body)
    return ApiResponse(
        message=f"Walk-in customer added with token #{token.token_number}",
        data=token,
    )
