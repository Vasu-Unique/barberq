import uuid
from typing import Callable, List
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import ForbiddenException
from app.models.user import User
from app.repositories.salon_repository import SalonRepository


def require_roles(*allowed_roles: str) -> Callable:
    """Dependency factory that checks if current user has any of the allowed roles."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_roles = [ur.role.role_name for ur in current_user.user_roles if ur.role]
        # Admin can access everything
        if "admin" in user_roles:
            return current_user

        has_role = any(r in user_roles for r in allowed_roles)
        if not has_role:
            raise ForbiddenException(
                f"Access denied. Requires one of roles: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker


# Convenient shorthands
require_admin = require_roles("admin")
require_staff = require_roles("staff", "admin")
require_user = require_roles("users", "staff", "admin")


async def verify_salon_staff_access(
    salon_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> bool:
    """Verify if user is admin, salon owner, or active salon staff member."""
    user_roles = [ur.role.role_name for ur in user.user_roles if ur.role]
    if "admin" in user_roles:
        return True

    salon_repo = SalonRepository(db)
    is_staff = await salon_repo.is_user_member_or_owner(salon_id, user.id)
    if not is_staff:
        raise ForbiddenException("You do not have staff permission for this salon")
    return True
