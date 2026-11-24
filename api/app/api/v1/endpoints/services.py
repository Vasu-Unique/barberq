import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.permissions import verify_salon_staff_access
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.service import ServiceCreate, ServiceOut, ServiceUpdate
from app.services.salon_service import SalonService

router = APIRouter(prefix="/salons/{salon_id}/services", tags=["Services"])


@router.get("/", response_model=ApiResponse[List[ServiceOut]])
async def list_services(
    salon_id: uuid.UUID,
    available_only: Optional[bool] = Query(False),
    db: AsyncSession = Depends(get_db),
):
    service = SalonService(db)
    items = await service.list_services(salon_id, available_only=available_only)
    return ApiResponse(data=[ServiceOut.model_validate(s) for s in items])


@router.post(
    "/",
    response_model=ApiResponse[ServiceOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_service(
    salon_id: uuid.UUID,
    body: ServiceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = SalonService(db)
    created = await service.create_service(salon_id, body)
    return ApiResponse(
        message="Service created successfully",
        data=ServiceOut.model_validate(created),
    )


@router.get("/{service_id}", response_model=ApiResponse[ServiceOut])
async def get_service(
    salon_id: uuid.UUID,
    service_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = SalonService(db)
    item = await service.get_service(salon_id, service_id)
    return ApiResponse(data=ServiceOut.model_validate(item))


@router.patch("/{service_id}", response_model=ApiResponse[ServiceOut])
async def update_service(
    salon_id: uuid.UUID,
    service_id: uuid.UUID,
    body: ServiceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = SalonService(db)
    updated = await service.update_service(salon_id, service_id, body)
    return ApiResponse(
        message="Service updated successfully",
        data=ServiceOut.model_validate(updated),
    )


@router.delete("/{service_id}", response_model=ApiResponse[None])
async def delete_service(
    salon_id: uuid.UUID,
    service_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_salon_staff_access(salon_id, current_user, db)
    service = SalonService(db)
    await service.delete_service(salon_id, service_id)
    return ApiResponse(message="Service deleted successfully")
