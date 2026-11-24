import math
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import ForbiddenException, NotFoundException
from app.core.permissions import require_admin, require_staff
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.common import ApiResponse, PaginatedResponse
from app.schemas.user import UserOut, UserStatusUpdate, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/",
    response_model=ApiResponse[PaginatedResponse[UserOut]],
    dependencies=[Depends(require_staff)],
)
async def list_users(
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    role: Optional[str] = Query(None, description="Filter by role name"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    offset = (page - 1) * limit
    users = await repo.list_users(offset=offset, limit=limit, search=search, role_name=role)
    total = await repo.count_users(search=search, role_name=role)

    items = [
        UserOut(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            phone=u.phone,
            is_active=u.is_active,
            roles=[ur.role.role_name for ur in u.user_roles if ur.role],
            created_at=u.created_at,
            updated_at=u.updated_at,
        )
        for u in users
    ]
    return ApiResponse(
        data=PaginatedResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=math.ceil(total / limit) if limit else 1,
        )
    )


@router.get("/{user_id}", response_model=ApiResponse[UserOut])
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_roles = [ur.role.role_name for ur in current_user.user_roles if ur.role]
    if current_user.id != user_id and "admin" not in current_roles:
        raise ForbiddenException("You cannot access another user's profile")

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User not found")

    return ApiResponse(
        data=UserOut(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            is_active=user.is_active,
            roles=[ur.role.role_name for ur in user.user_roles if ur.role],
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
    )


@router.patch("/{user_id}", response_model=ApiResponse[UserOut])
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_roles = [ur.role.role_name for ur in current_user.user_roles if ur.role]
    if current_user.id != user_id and "admin" not in current_roles:
        raise ForbiddenException("You cannot edit another user's profile")

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User not found")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.email is not None and "admin" in current_roles:
        user.email = data.email

    updated = await repo.update_user(user)
    return ApiResponse(
        message="User updated successfully",
        data=UserOut(
            id=updated.id,
            full_name=updated.full_name,
            email=updated.email,
            phone=updated.phone,
            is_active=updated.is_active,
            roles=[ur.role.role_name for ur in updated.user_roles if ur.role],
            created_at=updated.created_at,
            updated_at=updated.updated_at,
        ),
    )


@router.patch(
    "/{user_id}/status",
    response_model=ApiResponse[UserOut],
    dependencies=[Depends(require_admin)],
)
async def update_user_status(
    user_id: uuid.UUID,
    data: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User not found")

    user.is_active = data.is_active
    updated = await repo.update_user(user)

    # If deactivating, revoke all refresh tokens
    if not data.is_active:
        await repo.revoke_all_user_tokens(user.id)

    return ApiResponse(
        message=f"User account {'activated' if data.is_active else 'deactivated'} successfully",
        data=UserOut(
            id=updated.id,
            full_name=updated.full_name,
            email=updated.email,
            phone=updated.phone,
            is_active=updated.is_active,
            roles=[ur.role.role_name for ur in updated.user_roles if ur.role],
            created_at=updated.created_at,
            updated_at=updated.updated_at,
        ),
    )
