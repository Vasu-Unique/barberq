import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected(client: AsyncClient):
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_customer_cannot_access_roles(client: AsyncClient, customer_auth: dict):
    res = await client.get("/api/v1/roles/", headers=customer_auth["headers"])
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_customer_cannot_call_next(client: AsyncClient, customer_auth: dict):
    fake_id = "00000000-0000-0000-0000-000000000000"
    res = await client.post(
        f"/api/v1/admin/queues/{fake_id}/call-next",
        headers=customer_auth["headers"],
    )
    assert res.status_code == 403
