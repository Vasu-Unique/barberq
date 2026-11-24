import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class QueueJoinRequest(BaseModel):
    service_id: uuid.UUID
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None


class WalkInRequest(BaseModel):
    service_id: uuid.UUID
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=50)


class QueueTokenOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    salon_id: Optional[uuid.UUID] = None
    customer_id: Optional[uuid.UUID] = None
    service_id: uuid.UUID
    service_name: Optional[str] = None
    token_number: int
    customer_name: str
    customer_phone: Optional[str] = None
    status: str
    estimated_duration: int
    service_price: Decimal
    joined_at: datetime
    called_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    position: Optional[int] = None
    people_ahead: Optional[int] = None
    estimated_wait_minutes: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class EstimatedWaitOut(BaseModel):
    token_id: uuid.UUID
    token_number: int
    current_status: str
    people_ahead: int
    estimated_wait_minutes: int
    last_updated: datetime


class QueueSessionOut(BaseModel):
    id: uuid.UUID
    salon_id: uuid.UUID
    session_date: str
    last_token_number: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QueueStateOut(BaseModel):
    session: Optional[QueueSessionOut] = None
    salon_id: uuid.UUID
    is_open: bool
    serving_entry: Optional[QueueTokenOut] = None
    waiting_entries: List[QueueTokenOut] = []
    total_waiting: int = 0
    estimated_total_wait_minutes: int = 0
