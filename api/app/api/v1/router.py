from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin_queues,
    audit_logs,
    auth,
    notifications,
    queues,
    roles,
    salon_members,
    salons,
    services,
    users,
)
from app.websocket import endpoints as ws_endpoints

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
api_router.include_router(salons.router)
api_router.include_router(salon_members.router)
api_router.include_router(services.router)
api_router.include_router(queues.router)
api_router.include_router(admin_queues.router)
api_router.include_router(notifications.router)
api_router.include_router(audit_logs.router)
api_router.include_router(ws_endpoints.router)
