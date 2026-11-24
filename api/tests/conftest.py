import asyncio
import uuid
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.services.token_service import TokenService

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        # Seed default roles
        r1 = Role(id=1, role_name="admin", description="Platform administrator")
        r2 = Role(id=2, role_name="staff", description="Salon staff")
        r3 = Role(id=3, role_name="users", description="Customers")
        session.add_all([r1, r2, r3])
        await session.commit()

        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_auth(db_session: AsyncSession) -> dict:
    pwd = hash_password("AdminPass123!")
    user = User(
        full_name="Admin Boss",
        email="admin@barberq.com",
        password_hash=pwd,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    ur = UserRole(user_id=user.id, role_id=1)
    db_session.add(ur)
    await db_session.commit()

    token_service = TokenService(db_session)
    access_token, refresh_token = await token_service.create_tokens(user, ["admin"])
    await db_session.commit()

    return {
        "user": user,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "headers": {"Authorization": f"Bearer {access_token}"},
    }


@pytest_asyncio.fixture
async def staff_auth(db_session: AsyncSession) -> dict:
    pwd = hash_password("StaffPass123!")
    user = User(
        full_name="Tony Barber",
        email="tony@barberq.com",
        password_hash=pwd,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    ur = UserRole(user_id=user.id, role_id=2)
    db_session.add(ur)
    await db_session.commit()

    token_service = TokenService(db_session)
    access_token, refresh_token = await token_service.create_tokens(user, ["staff"])
    await db_session.commit()

    return {
        "user": user,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "headers": {"Authorization": f"Bearer {access_token}"},
    }


@pytest_asyncio.fixture
async def customer_auth(db_session: AsyncSession) -> dict:
    pwd = hash_password("CustomerPass123!")
    user = User(
        full_name="James Customer",
        email="james@barberq.com",
        password_hash=pwd,
        phone="+1234567890",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    ur = UserRole(user_id=user.id, role_id=3)
    db_session.add(ur)
    await db_session.commit()

    token_service = TokenService(db_session)
    access_token, refresh_token = await token_service.create_tokens(user, ["users"])
    await db_session.commit()

    return {
        "user": user,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "headers": {"Authorization": f"Bearer {access_token}"},
    }

