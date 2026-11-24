import uuid
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    UnauthorizedException,
)
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.audit_service import AuditService
from app.services.token_service import TokenService


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_service = TokenService(db)
        self.audit_service = AuditService(db)

    async def register(
        self,
        req: RegisterRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[User, str, str]:
        # Check duplicate email
        existing_email = await self.user_repo.get_by_email(req.email)
        if existing_email:
            raise ConflictException("An account with this email already exists")

        # Check duplicate phone if provided
        if req.phone:
            existing_phone = await self.user_repo.get_by_phone(req.phone)
            if existing_phone:
                raise ConflictException("An account with this phone number already exists")

        # Hash password and create user
        hashed = hash_password(req.password)
        user = await self.user_repo.create_user(
            full_name=req.full_name,
            email=req.email,
            password_hash=hashed,
            phone=req.phone,
        )

        # Default role ID 3: 'users'
        role_users = await self.user_repo.get_role_by_id(3)
        if role_users:
            await self.user_repo.assign_role(user.id, role_users.id)

        # Reload user with relationships
        user_loaded = await self.user_repo.get_by_id(user.id)
        if not user_loaded:
            user_loaded = user

        roles = [ur.role.role_name for ur in user_loaded.user_roles if ur.role] or ["users"]
        access_token, refresh_token = await self.token_service.create_tokens(user_loaded, roles)

        # Audit log for registration / first login
        await self.audit_service.log_action(
            action="LOGIN",
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"type": "registration_login"},
        )

        return user_loaded, access_token, refresh_token

    async def login(
        self,
        req: LoginRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[User, str, str]:
        user = await self.user_repo.get_by_email(req.email)
        if not user:
            # Audit failed login attempt without user_id
            await self.audit_service.log_action(
                action="LOGIN_FAILED",
                user_id=None,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"reason": "user_not_found", "email": req.email},
            )
            raise UnauthorizedException("Invalid email or password")

        if not verify_password(req.password, user.password_hash):
            await self.audit_service.log_action(
                action="LOGIN_FAILED",
                user_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"reason": "invalid_password"},
            )
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated. Please contact support.")

        roles = [ur.role.role_name for ur in user.user_roles if ur.role]
        access_token, refresh_token = await self.token_service.create_tokens(user, roles)

        # Record LOGIN audit log
        await self.audit_service.log_action(
            action="LOGIN",
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return user, access_token, refresh_token

    async def refresh(self, raw_refresh_token: str) -> Tuple[User, str, str]:
        return await self.token_service.rotate_refresh_token(raw_refresh_token)

    async def logout(
        self,
        user_id: uuid.UUID,
        raw_refresh_token: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        if raw_refresh_token:
            await self.token_service.revoke_refresh_token(raw_refresh_token)
        else:
            await self.user_repo.revoke_all_user_tokens(user_id)

        # Record LOGOUT audit log
        await self.audit_service.log_action(
            action="LOGOUT",
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
