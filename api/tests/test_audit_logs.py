import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_audit_logs_recorded(
    client: AsyncClient, admin_auth: dict, customer_auth: dict
):
    # Customer logs in
    await client.post(
        "/api/v1/auth/login",
        json={"email": "james@barberq.com", "password": "CustomerPass123!"},
    )


    # Admin checks audit logs
    res = await client.get("/api/v1/audit-logs/?action=LOGIN", headers=admin_auth["headers"])
    assert res.status_code == 200
    logs = res.json()["data"]
    assert len(logs) >= 1
    assert any(log["action"] == "LOGIN" for log in logs)


@pytest.mark.asyncio
async def test_customer_cannot_view_audit_logs(client: AsyncClient, customer_auth: dict):
    res = await client.get("/api/v1/audit-logs/", headers=customer_auth["headers"])
    assert res.status_code == 403
