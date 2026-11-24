import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.permissions import verify_salon_staff_access
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.salon import SalonMemberCreate, SalonMemberOut
from app.services.salon_service import SalonService

router = APIRouter(prefix="/salons/{salon_id}/members", tags=["Salon Members"])


@router.get("/", response_model=ApiResponse[List[SalonMemberOut]])
async def list_members(
    salon_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = SalonService(db)
    members = await service.list_members(salon_id)
    out = [
        SalonMemberOut(
            id=m.id,
            salon_id=m.salon_id,
            user_id=m.user_id,
            is_active=m.is_active,
            created_at=m.created_at,
            user_name=m.user.full_name if m.user else None,
            user_email=m.user.email if m.user else None,
        )
        for m in members
    ]
    return ApiResponse(data=out)


@router.post(
    "/",
    response_model=ApiResponse[SalonMemberOut],
    status_code=status.HTTP_201_CREATED,
)
async def add_member(
    salon_id: uuid.UUID,
    body: SalonMemberCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = SalonService(db)
    member = await service.add_member(salon_id, body.user_id)
    return ApiResponse(
        message="Staff member added successfully",
        data=SalonMemberOut(
            id=member.id,
            salon_id=member.salon_id,
            user_id=member.user_id,
            is_active=member.is_active,
            created_at=member.created_at,
        ),
    )


@router.delete("/{user_id}", response_model=ApiResponse[None])
async def remove_member(
    salon_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = SalonService(db)
    await service.remove_member(salon_id, user_id)
    return ApiResponse(message="Staff member removed successfully")
