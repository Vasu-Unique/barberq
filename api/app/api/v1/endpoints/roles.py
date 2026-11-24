from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.core.permissions import require_admin
from app.repositories.user_repository import UserRepository
from app.schemas.common import ApiResponse
from app.schemas.role import RoleAssignRequest, RoleOut

router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
    dependencies=[Depends(require_admin)],
)


@router.get("/", response_model=ApiResponse[List[RoleOut]])
async def list_roles(db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    roles = await repo.list_roles()
    return ApiResponse(
        data=[RoleOut.model_validate(r) for r in roles]
    )


@router.post("/assign", response_model=ApiResponse[None])
async def assign_role(body: RoleAssignRequest, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    user = await repo.get_by_id(body.user_id)
    if not user:
        raise NotFoundException("User not found")

    role = await repo.get_role_by_id(body.role_id)
    if not role:
        raise NotFoundException("Role not found")

    # Check if already assigned
    existing_role_ids = [ur.role_id for ur in user.user_roles]
    if body.role_id not in existing_role_ids:
        await repo.assign_role(user.id, role.id)

    return ApiResponse(message=f"Role '{role.role_name}' assigned successfully")


@router.delete("/assign", response_model=ApiResponse[None])
async def remove_role(body: RoleAssignRequest, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    success = await repo.remove_role(body.user_id, body.role_id)
    if not success:
        raise NotFoundException("Role assignment not found for this user")

    return ApiResponse(message="Role assignment removed successfully")
