from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent
from app.models.user import User
from app.schemas.auth import (
    AuthUser,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponseData,
)
from app.schemas.common import ApiResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=ApiResponse[TokenResponseData],
    status_code=status.HTTP_201_CREATED,
)
async def register(
    request: Request,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    ip = get_client_ip(request)
    ua = get_user_agent(request)
    user, access_token, refresh_token = await service.register(
        body, ip_address=ip, user_agent=ua
    )
    roles = [ur.role.role_name for ur in user.user_roles if ur.role]
    return ApiResponse(
        success=True,
        message="Registration successful",
        data=TokenResponseData(
            user=AuthUser(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                phone=user.phone,
                roles=roles,
                is_active=user.is_active,
            ),
            access_token=access_token,
            refresh_token=refresh_token,
        ),
    )


@router.post(
    "/login",
    response_model=ApiResponse[TokenResponseData],
    status_code=status.HTTP_200_OK,
)
async def login(
    request: Request,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    ip = get_client_ip(request)
    ua = get_user_agent(request)
    user, access_token, refresh_token = await service.login(
        body, ip_address=ip, user_agent=ua
    )
    roles = [ur.role.role_name for ur in user.user_roles if ur.role]
    return ApiResponse(
        success=True,
        message="Login successful",
        data=TokenResponseData(
            user=AuthUser(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                phone=user.phone,
                roles=roles,
                is_active=user.is_active,
            ),
            access_token=access_token,
            refresh_token=refresh_token,
        ),
    )


@router.post(
    "/refresh",
    response_model=ApiResponse[TokenResponseData],
    status_code=status.HTTP_200_OK,
)
async def refresh_token(
    body: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    user, access_token, refresh_token = await service.refresh(body.refresh_token)
    roles = [ur.role.role_name for ur in user.user_roles if ur.role]
    return ApiResponse(
        success=True,
        message="Token refreshed successfully",
        data=TokenResponseData(
            user=AuthUser(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                phone=user.phone,
                roles=roles,
                is_active=user.is_active,
            ),
            access_token=access_token,
            refresh_token=refresh_token,
        ),
    )


@router.post(
    "/logout",
    response_model=ApiResponse[None],
    status_code=status.HTTP_200_OK,
)
async def logout(
    request: Request,
    body: LogoutRequest = LogoutRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    ip = get_client_ip(request)
    ua = get_user_agent(request)
    await service.logout(
        user_id=current_user.id,
        raw_refresh_token=body.refresh_token,
        ip_address=ip,
        user_agent=ua,
    )
    return ApiResponse(
        success=True,
        message="Logout successful",
        data=None,
    )


@router.get(
    "/me",
    response_model=ApiResponse[AuthUser],
    status_code=status.HTTP_200_OK,
)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    roles = [ur.role.role_name for ur in current_user.user_roles if ur.role]
    return ApiResponse(
        success=True,
        message="Current user fetched",
        data=AuthUser(
            id=current_user.id,
            full_name=current_user.full_name,
            email=current_user.email,
            phone=current_user.phone,
            roles=roles,
            is_active=current_user.is_active,
        ),
    )
