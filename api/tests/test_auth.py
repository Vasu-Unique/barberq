import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    payload = {
        "full_name": "Test Customer",
        "email": "customer@example.com",
        "phone": "+1987654321",
        "password": "Password123!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["user"]["email"] == "customer@example.com"
    assert "users" in data["data"]["user"]["roles"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "full_name": "Test Customer",
        "email": "duplicate@example.com",
        "password": "Password123!",
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    assert res2.json()["success"] is False


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # First register
    payload = {
        "full_name": "Login User",
        "email": "login@example.com",
        "password": "SecretPassword123!",
    }
    await client.post("/api/v1/auth/register", json=payload)

    # Now login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "SecretPassword123!"},
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "wrongpassword"},
    )
    assert res.status_code == 401
    assert res.json()["success"] is False


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient):
    payload = {
        "full_name": "Rotate User",
        "email": "rotate@example.com",
        "password": "Password123!",
    }
    reg_res = await client.post("/api/v1/auth/register", json=payload)
    initial_refresh = reg_res.json()["data"]["refresh_token"]

    # Use refresh token
    ref_res = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": initial_refresh}
    )
    assert ref_res.status_code == 200
    new_data = ref_res.json()["data"]
    assert new_data["refresh_token"] != initial_refresh

    # Reuse old refresh token -> must be rejected (reuse detection)
    reuse_res = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": initial_refresh}
    )
    assert reuse_res.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, customer_auth: dict):
    res = await client.get("/api/v1/auth/me", headers=customer_auth["headers"])
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["email"] == "james@barberq.com"

    assert "users" in data["roles"]


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, customer_auth: dict):
    res = await client.post(
        "/api/v1/auth/logout",
        headers=customer_auth["headers"],
        json={"refresh_token": customer_auth["refresh_token"]},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True
