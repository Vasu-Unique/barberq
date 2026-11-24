import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_list_users(client: AsyncClient, admin_auth: dict):
    res = await client.get("/api/v1/users/", headers=admin_auth["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "items" in data["data"]
    assert len(data["data"]["items"]) >= 1


@pytest.mark.asyncio
async def test_customer_cannot_list_users(client: AsyncClient, customer_auth: dict):
    res = await client.get("/api/v1/users/", headers=customer_auth["headers"])
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_get_and_update_own_user(client: AsyncClient, customer_auth: dict):
    user_id = str(customer_auth["user"].id)
    res = await client.get(f"/api/v1/users/{user_id}", headers=customer_auth["headers"])
    assert res.status_code == 200
    assert res.json()["data"]["id"] == user_id

    # Update own name
    update_res = await client.patch(
        f"/api/v1/users/{user_id}",
        headers=customer_auth["headers"],
        json={"full_name": "James Updated"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["full_name"] == "James Updated"


@pytest.mark.asyncio
async def test_admin_change_user_status(
    client: AsyncClient, admin_auth: dict, customer_auth: dict
):
    cust_id = str(customer_auth["user"].id)
    res = await client.patch(
        f"/api/v1/users/{cust_id}/status",
        headers=admin_auth["headers"],
        json={"is_active": False},
    )
    assert res.status_code == 200
    assert res.json()["data"]["is_active"] is False

    # Inactive user cannot access /me
    me_res = await client.get("/api/v1/auth/me", headers=customer_auth["headers"])
    assert me_res.status_code == 401
