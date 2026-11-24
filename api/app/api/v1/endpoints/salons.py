import math
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_current_user
from app.core.permissions import require_staff, verify_salon_staff_access
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse
from app.schemas.salon import SalonCreate, SalonDetailOut, SalonOut, SalonUpdate
from app.services.salon_service import SalonService

router = APIRouter(prefix="/salons", tags=["Salons"])


@router.get("/", response_model=ApiResponse[PaginatedResponse[SalonOut]])
async def list_salons(
    search: Optional[str] = Query(None, description="Search by name, address, or description"),
    city: Optional[str] = Query(None, description="Filter by city"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = SalonService(db)
    items, total = await service.list_salons(
        search=search,
        city=city,
        is_active=is_active,
        page=page,
        limit=limit,
    )
    return ApiResponse(
        data=PaginatedResponse(
            items=[SalonOut.model_validate(s) for s in items],
            total=total,
            page=page,
            limit=limit,
            total_pages=math.ceil(total / limit) if limit else 1,
        )
    )


@router.get("/{salon_id}", response_model=ApiResponse[SalonDetailOut])
async def get_salon(
    salon_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = SalonService(db)
    salon = await service.get_salon(salon_id, load_details=True)
    return ApiResponse(data=SalonDetailOut.model_validate(salon))


@router.post(
    "/",
    response_model=ApiResponse[SalonOut],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_staff)],
)
async def create_salon(
    body: SalonCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SalonService(db)
    salon = await service.create_salon(owner_id=current_user.id, data=body)
    return ApiResponse(
        message="Salon created successfully",
        data=SalonOut.model_validate(salon),
    )


@router.patch("/{salon_id}", response_model=ApiResponse[SalonOut])
async def update_salon(
    salon_id: uuid.UUID,
    body: SalonUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = SalonService(db)
    updated = await service.update_salon(salon_id, body)
    return ApiResponse(
        message="Salon updated successfully",
        data=SalonOut.model_validate(updated),
    )


@router.delete("/{salon_id}", response_model=ApiResponse[None])
async def delete_salon(
    salon_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = SalonService(db)
    await service.delete_salon(salon_id)
    return ApiResponse(message="Salon deleted successfully")
