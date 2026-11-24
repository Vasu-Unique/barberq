import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_salon_lifecycle(client: AsyncClient, staff_auth: dict):
    # 1. Create salon
    salon_payload = {
        "salon_name": "Royal Fade Barbershop",
        "description": "Premium haircuts & grooming",
        "address": "123 Main Street",
        "city": "Toronto",
        "phone": "+14165550100",
        "opening_time": "09:00:00",
        "closing_time": "19:00:00",
        "max_queue_capacity": 30,
        "is_active": True,
        "operating_hours": [
            {"day_of_week": "Monday", "opening_time": "09:00:00", "closing_time": "19:00:00", "is_closed": False}
        ]
    }
    create_res = await client.post(
        "/api/v1/salons/", headers=staff_auth["headers"], json=salon_payload
    )
    assert create_res.status_code == 201
    salon = create_res.json()["data"]
    salon_id = salon["id"]

    # 2. List salons
    list_res = await client.get("/api/v1/salons/?search=Royal")
    assert list_res.status_code == 200
    assert list_res.json()["data"]["total"] >= 1

    # 3. Add service
    service_payload = {
        "service_name": "Classic Haircut",
        "description": "Scissor and clipper cut",
        "duration_minutes": 30,
        "price": 35.0,
        "is_available": True,
    }
    svc_res = await client.post(
        f"/api/v1/salons/{salon_id}/services/",
        headers=staff_auth["headers"],
        json=service_payload,
    )
    assert svc_res.status_code == 201
    service = svc_res.json()["data"]
    service_id = service["id"]

    # 4. List services
    services_res = await client.get(f"/api/v1/salons/{salon_id}/services/")
    assert services_res.status_code == 200
    assert len(services_res.json()["data"]) == 1

    # 5. Get salon detail
    detail_res = await client.get(f"/api/v1/salons/{salon_id}")
    assert detail_res.status_code == 200
    assert len(detail_res.json()["data"]["services"]) == 1
