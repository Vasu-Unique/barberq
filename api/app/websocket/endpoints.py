import json
import logging
import uuid
from typing import Optional
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.salon_repository import SalonRepository
from app.repositories.user_repository import UserRepository
from app.websocket.manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws/queues/{salon_id}")
async def websocket_queue_endpoint(
    websocket: WebSocket,
    salon_id: uuid.UUID,
    token: Optional[str] = Query(None),
):
    user_id: Optional[str] = None

    # Authenticate token if provided
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]

    # Verify salon existence
    async with async_session_maker() as db:
        salon_repo = SalonRepository(db)
        salon = await salon_repo.get_by_id(salon_id)
        if not salon:
            await websocket.close(code=4004, reason="Salon not found")
            return

    await ws_manager.connect(websocket, salon_id=str(salon_id), user_id=user_id)

    try:
        # Send initial confirmation message
        await websocket.send_text(
            json.dumps(
                {
                    "event": "CONNECTED",
                    "data": {
                        "salon_id": str(salon_id),
                        "authenticated": bool(user_id),
                        "user_id": user_id,
                    },
                }
            )
        )
        while True:
            # Keep connection alive & handle incoming pings or client messages
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)
