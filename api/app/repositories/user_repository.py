import uuid
from datetime import datetime, timezone
from typing import List, Optional, Sequence
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.models.refresh_token import RefreshToken


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = (
            select(User)
            .where(func.lower(User.email) == email.lower())
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> Optional[User]:
        stmt = (
            select(User)
            .where(User.phone == phone)
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_users(
        self,
        offset: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        role_name: Optional[str] = None,
    ) -> Sequence[User]:
        stmt = (
            select(User)
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
            .order_by(User.created_at.desc())
        )
        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    User.full_name.ilike(pattern),
                    User.email.ilike(pattern),
                    User.phone.ilike(pattern),
                )
            )
        if role_name:
            stmt = stmt.join(User.user_roles).join(UserRole.role).where(Role.role_name == role_name)
        stmt = stmt.offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count_users(
        self,
        search: Optional[str] = None,
        role_name: Optional[str] = None,
    ) -> int:
        stmt = select(func.count(User.id.distinct()))
        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    User.full_name.ilike(pattern),
                    User.email.ilike(pattern),
                    User.phone.ilike(pattern),
                )
            )
        if role_name:
            stmt = stmt.join(User.user_roles).join(UserRole.role).where(Role.role_name == role_name)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def create_user(
        self,
        full_name: str,
        email: str,
        password_hash: str,
        phone: Optional[str] = None,
    ) -> User:
        user = User(
            full_name=full_name,
            email=email.lower(),
            phone=phone,
            password_hash=password_hash,
            is_active=True,
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def update_user(self, user: User) -> User:
        user.updated_at = datetime.now(timezone.utc)
        self.db.add(user)
        await self.db.flush()
        return user

    async def get_role_by_id(self, role_id: int) -> Optional[Role]:
        stmt = select(Role).where(Role.id == role_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_role_by_name(self, role_name: str) -> Optional[Role]:
        stmt = select(Role).where(Role.role_name == role_name)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_roles(self) -> Sequence[Role]:
        stmt = select(Role).order_by(Role.id)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def assign_role(self, user_id: uuid.UUID, role_id: int) -> UserRole:
        user_role = UserRole(user_id=user_id, role_id=role_id)
        self.db.add(user_role)
        await self.db.flush()
        return user_role

    async def remove_role(self, user_id: uuid.UUID, role_id: int) -> bool:
        stmt = (
            delete(UserRole)
            .where(UserRole.user_id == user_id, UserRole.role_id == role_id)
        )
        result = await self.db.execute(stmt)
        return result.rowcount > 0

    # Refresh tokens
    async def save_refresh_token(
        self,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshToken:
        token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(token)
        await self.db.flush()
        return token

    async def get_refresh_token_by_hash(
        self, token_hash: str
    ) -> Optional[RefreshToken]:
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_refresh_token(
        self, token: RefreshToken, replaced_by_id: Optional[uuid.UUID] = None
    ) -> None:
        token.revoked_at = datetime.now(timezone.utc)
        if replaced_by_id:
            token.replaced_by_token_id = replaced_by_id
        self.db.add(token)
        await self.db.flush()

    async def revoke_all_user_tokens(self, user_id: uuid.UUID) -> None:
        now = datetime.now(timezone.utc)
        stmt = (
            select(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        )
        result = await self.db.execute(stmt)
        for token in result.scalars().all():
            token.revoked_at = now
            self.db.add(token)
        await self.db.flush()
