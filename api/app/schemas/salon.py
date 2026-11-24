import uuid
from datetime import datetime, time
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.service import ServiceOut


class OperatingHoursBase(BaseModel):
    day_of_week: str
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    is_closed: bool = False


class OperatingHoursCreate(OperatingHoursBase):
    pass


class OperatingHoursOut(OperatingHoursBase):
    id: uuid.UUID
    salon_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class SalonCreate(BaseModel):
    salon_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    address: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=1, max_length=50)
    logo_url: Optional[str] = None
    opening_time: time
    closing_time: time
    max_queue_capacity: int = Field(default=50, ge=1, le=500)
    is_active: bool = True
    operating_hours: Optional[List[OperatingHoursCreate]] = None


class SalonUpdate(BaseModel):
    salon_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    logo_url: Optional[str] = None
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    max_queue_capacity: Optional[int] = Field(None, ge=1, le=500)
    is_active: Optional[bool] = None


class SalonOut(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    salon_name: str
    description: Optional[str] = None
    address: str
    city: str
    phone: str
    logo_url: Optional[str] = None
    opening_time: time
    closing_time: time
    max_queue_capacity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SalonDetailOut(SalonOut):
    services: List[ServiceOut] = []
    operating_hours: List[OperatingHoursOut] = []


class SalonMemberCreate(BaseModel):
    user_id: uuid.UUID


class SalonMemberOut(BaseModel):
    id: uuid.UUID
    salon_id: uuid.UUID
    user_id: uuid.UUID
    is_active: bool
    created_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
