import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ServiceBase(BaseModel):
    service_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    duration_minutes: int = Field(..., ge=1, le=480)
    price: Decimal = Field(..., ge=0)
    is_available: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    service_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=1, le=480)
    price: Optional[Decimal] = Field(None, ge=0)
    is_available: Optional[bool] = None


class ServiceOut(ServiceBase):
    id: uuid.UUID
    salon_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
