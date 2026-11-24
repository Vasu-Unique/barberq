import pytest
from httpx import AsyncClient


@pytest.fixture
async def setup_salon_and_service(client: AsyncClient, staff_auth: dict):
    # Create salon
    salon_res = await client.post(
        "/api/v1/salons/",
        headers=staff_auth["headers"],
        json={
            "salon_name": "Sharp Cutters",
            "address": "456 Oak Avenue",
            "city": "Toronto",
            "phone": "+14165550200",
            "opening_time": "08:00:00",
            "closing_time": "20:00:00",
            "max_queue_capacity": 50,
            "is_active": True,
        },
    )
    salon_id = salon_res.json()["data"]["id"]

    # Add service
    svc_res = await client.post(
        f"/api/v1/salons/{salon_id}/services/",
        headers=staff_auth["headers"],
        json={
            "service_name": "Fade & Style",
            "duration_minutes": 30,
            "price": 40.0,
            "is_available": True,
        },
    )
    service_id = svc_res.json()["data"]["id"]
    return salon_id, service_id


@pytest.mark.asyncio
async def test_queue_workflow(
    client: AsyncClient,
    staff_auth: dict,
    customer_auth: dict,
    setup_salon_and_service: tuple,
):
    salon_id, service_id = setup_salon_and_service

    # 1. Customer joins queue
    join_res = await client.post(
        f"/api/v1/queues/join/{salon_id}",
        headers=customer_auth["headers"],
        json={"service_id": service_id},
    )
    assert join_res.status_code == 201
    token1 = join_res.json()["data"]
    assert token1["token_number"] == 1
    assert token1["status"] == "WAITING"
    assert token1["people_ahead"] == 0

    token1_id = token1["id"]

    # 2. Duplicate join is prevented
    dup_res = await client.post(
        f"/api/v1/queues/join/{salon_id}",
        headers=customer_auth["headers"],
        json={"service_id": service_id},
    )
    assert dup_res.status_code == 409

    # 3. View my queue
    my_q_res = await client.get("/api/v1/queues/my-queue", headers=customer_auth["headers"])
    assert my_q_res.status_code == 200
    assert len(my_q_res.json()["data"]) == 1

    # 4. Staff adds walk-in customer
    walk_res = await client.post(
        f"/api/v1/admin/queues/{salon_id}/walk-in",
        headers=staff_auth["headers"],
        json={"service_id": service_id, "customer_name": "Walk-in John"},
    )
    assert walk_res.status_code == 201
    token2 = walk_res.json()["data"]
    assert token2["token_number"] == 2
    assert token2["people_ahead"] == 1

    # 5. Staff calls next customer
    call_res = await client.post(
        f"/api/v1/admin/queues/{salon_id}/call-next",
        headers=staff_auth["headers"],
    )
    assert call_res.status_code == 200
    called_token = call_res.json()["data"]
    assert called_token["id"] == token1_id
    assert called_token["status"] == "CALLED"

    # 6. Staff starts service
    start_res = await client.patch(
        f"/api/v1/admin/queues/{salon_id}/{token1_id}/start",
        headers=staff_auth["headers"],
    )
    assert start_res.status_code == 200
    assert start_res.json()["data"]["status"] == "SERVING"

    # 7. Staff completes service
    comp_res = await client.patch(
        f"/api/v1/admin/queues/{salon_id}/{token1_id}/complete",
        headers=staff_auth["headers"],
    )
    assert comp_res.status_code == 200
    assert comp_res.json()["data"]["status"] == "COMPLETED"

    # 8. Customer received notifications
    notif_res = await client.get(
        "/api/v1/notifications/", headers=customer_auth["headers"]
    )
    assert notif_res.status_code == 200
    notifs = notif_res.json()["data"]
    assert len(notifs) >= 1
