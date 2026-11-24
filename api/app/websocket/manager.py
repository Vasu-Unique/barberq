import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # salon_id (str) -> list of active WebSocket connections
        self.salon_connections: Dict[str, List[WebSocket]] = {}
        # user_id (str) -> list of WebSocket connections for direct alerts
        self.user_connections: Dict[str, List[WebSocket]] = {}
        # websocket -> metadata {salon_id, user_id}
        self.socket_meta: Dict[WebSocket, Dict[str, Any]] = {}

    async def connect(
        self,
        websocket: WebSocket,
        salon_id: str,
        user_id: Optional[str] = None,
    ) -> None:
        await websocket.accept()
        if salon_id not in self.salon_connections:
            self.salon_connections[salon_id] = []
        self.salon_connections[salon_id].append(websocket)

        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)

        self.socket_meta[websocket] = {
            "salon_id": salon_id,
            "user_id": user_id,
        }
        logger.info(f"WebSocket connected: salon={salon_id}, user={user_id}")

    def disconnect(self, websocket: WebSocket) -> None:
        meta = self.socket_meta.pop(websocket, None)
        if not meta:
            return

        salon_id = meta.get("salon_id")
        user_id = meta.get("user_id")

        if salon_id and salon_id in self.salon_connections:
            if websocket in self.salon_connections[salon_id]:
                self.salon_connections[salon_id].remove(websocket)
            if not self.salon_connections[salon_id]:
                del self.salon_connections[salon_id]

        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        logger.info(f"WebSocket disconnected: salon={salon_id}, user={user_id}")

    async def broadcast_to_salon(self, salon_id: str, message: Dict[str, Any]) -> None:
        if salon_id not in self.salon_connections:
            return
        payload = json.dumps(message)
        dead_connections: List[WebSocket] = []
        for connection in list(self.salon_connections[salon_id]):
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error broadcasting to socket: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

    async def send_personal(self, user_id: str, message: Dict[str, Any]) -> None:
        if user_id not in self.user_connections:
            return
        payload = json.dumps(message)
        dead_connections: List[WebSocket] = []
        for connection in list(self.user_connections[user_id]):
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending personal message: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


# Global singleton manager
ws_manager = ConnectionManager()
