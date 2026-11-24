import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict


class RoleBase(BaseModel):
    role_name: str
    description: Optional[str] = None


class RoleOut(RoleBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class RoleAssignRequest(BaseModel):
    user_id: uuid.UUID
    role_id: int
