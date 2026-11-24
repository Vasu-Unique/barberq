import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.queue import (
    QueueJoinRequest,
    QueueStateOut,
    QueueTokenOut,
)
from app.services.queue_service import QueueService

router = APIRouter(prefix="/queues", tags=["Queue Management"])


@router.get("/salon/{salon_id}", response_model=ApiResponse[QueueStateOut])
async def get_salon_queue(
    salon_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = QueueService(db)
    state = await service.get_queue_state(salon_id)
    return ApiResponse(data=state)


@router.post(
    "/join/{salon_id}",
    response_model=ApiResponse[QueueTokenOut],
    status_code=status.HTTP_201_CREATED,
)
async def join_queue(
    salon_id: uuid.UUID,
    body: QueueJoinRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = QueueService(db)
    token = await service.join_queue(salon_id, current_user, body)
    return ApiResponse(
        message=f"Successfully joined queue! Your token number is #{token.token_number}",
        data=token,
    )


@router.get("/my-queue", response_model=ApiResponse[List[QueueTokenOut]])
async def get_my_queue(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = QueueService(db)
    tokens = await service.get_my_active_tokens(current_user.id)
    return ApiResponse(data=tokens)


@router.get("/token/{entry_id}", response_model=ApiResponse[QueueTokenOut])
async def get_token_details(
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = QueueService(db)
    token = await service.get_token_details(entry_id, current_user)
    return ApiResponse(data=token)


@router.patch("/{entry_id}/cancel", response_model=ApiResponse[QueueTokenOut])
async def cancel_token(
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = QueueService(db)
    token = await service.cancel_token(entry_id, current_user, is_staff=False)
    return ApiResponse(message="Token cancelled successfully", data=token)
