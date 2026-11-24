import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.core.security import (
    create_access_token,
    generate_secure_token,
    hash_token,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.user_repository import UserRepository


class TokenService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def create_tokens(
        self, user: User, roles: List[str]
    ) -> Tuple[str, str]:
        # 1. Access Token
        claims: Dict[str, Any] = {
            "email": user.email,
            "roles": roles,
            "full_name": user.full_name,
        }
        access_token = create_access_token(
            subject=str(user.id),
            claims=claims,
        )

        # 2. Refresh Token
        raw_refresh_token = generate_secure_token(48)
        hashed_refresh = hash_token(raw_refresh_token)
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        await self.user_repo.save_refresh_token(
            user_id=user.id,
            token_hash=hashed_refresh,
            expires_at=expires_at,
        )

        return access_token, raw_refresh_token

    async def rotate_refresh_token(
        self, raw_refresh_token: str
    ) -> Tuple[User, str, str]:
        """Validate refresh token, detect reuse, rotate token, and return new access + refresh token."""
        token_hash = hash_token(raw_refresh_token)
        stored_token: Optional[RefreshToken] = (
            await self.user_repo.get_refresh_token_by_hash(token_hash)
        )

        if not stored_token:
            raise UnauthorizedException("Invalid refresh token")

        # Reuse Detection: If token is already revoked or replaced, revoke whole family
        now = datetime.now(timezone.utc)
        if stored_token.revoked_at is not None or stored_token.replaced_by_token_id is not None:
            # Compromised token reused! Revoke all tokens for this user
            await self.user_repo.revoke_all_user_tokens(stored_token.user_id)
            raise UnauthorizedException(
                "Suspicious token reuse detected. All sessions revoked."
            )

        # Check expiration
        expires_at = stored_token.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            await self.user_repo.revoke_refresh_token(stored_token)
            raise UnauthorizedException("Refresh token has expired")

        # Fetch user
        user = await self.user_repo.get_by_id(stored_token.user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User account is inactive or not found")

        # Issue new token pair
        roles = [ur.role.role_name for ur in user.user_roles if ur.role]
        new_access_token, new_raw_refresh = await self.create_tokens(user, roles)

        # Link old token to new token and revoke old token
        new_hash = hash_token(new_raw_refresh)
        new_stored = await self.user_repo.get_refresh_token_by_hash(new_hash)
        await self.user_repo.revoke_refresh_token(
            stored_token, replaced_by_id=new_stored.id if new_stored else None
        )

        return user, new_access_token, new_raw_refresh

    async def revoke_refresh_token(self, raw_refresh_token: str) -> bool:
        token_hash = hash_token(raw_refresh_token)
        stored_token = await self.user_repo.get_refresh_token_by_hash(token_hash)
        if stored_token and stored_token.revoked_at is None:
            await self.user_repo.revoke_refresh_token(stored_token)
            return True
        return False
