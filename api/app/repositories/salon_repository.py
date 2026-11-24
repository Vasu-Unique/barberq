import uuid
from datetime import datetime, timezone
from typing import List, Optional, Sequence
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.salon import Salon
from app.models.salon_member import SalonMember
from app.models.service import Service
from app.models.operating_hours import OperatingHours
from app.models.user import User


class SalonRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(
        self, salon_id: uuid.UUID, load_details: bool = False
    ) -> Optional[Salon]:
        stmt = select(Salon).where(Salon.id == salon_id)
        if load_details:
            stmt = stmt.options(
                selectinload(Salon.services),
                selectinload(Salon.operating_hours),
            )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_salons(
        self,
        search: Optional[str] = None,
        city: Optional[str] = None,
        is_active: Optional[bool] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> Sequence[Salon]:
        stmt = select(Salon)
        if search:
            stmt = stmt.where(
                (Salon.salon_name.ilike(f"%{search}%"))
                | (Salon.description.ilike(f"%{search}%"))
                | (Salon.address.ilike(f"%{search}%"))
            )
        if city:
            stmt = stmt.where(Salon.city.ilike(f"%{city}%"))
        if is_active is not None:
            stmt = stmt.where(Salon.is_active == is_active)

        stmt = stmt.order_by(Salon.salon_name.asc()).offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count_salons(
        self,
        search: Optional[str] = None,
        city: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> int:
        stmt = select(func.count(Salon.id))
        if search:
            stmt = stmt.where(
                (Salon.salon_name.ilike(f"%{search}%"))
                | (Salon.description.ilike(f"%{search}%"))
                | (Salon.address.ilike(f"%{search}%"))
            )
        if city:
            stmt = stmt.where(Salon.city.ilike(f"%{city}%"))
        if is_active is not None:
            stmt = stmt.where(Salon.is_active == is_active)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def create_salon(self, salon: Salon) -> Salon:
        self.db.add(salon)
        await self.db.flush()
        return salon

    async def update_salon(self, salon: Salon) -> Salon:
        salon.updated_at = datetime.now(timezone.utc)
        self.db.add(salon)
        await self.db.flush()
        return salon

    async def delete_salon(self, salon: Salon) -> None:
        await self.db.delete(salon)
        await self.db.flush()

    # Salon members
    async def get_member(
        self, salon_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[SalonMember]:
        stmt = select(SalonMember).where(
            SalonMember.salon_id == salon_id,
            SalonMember.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_members(self, salon_id: uuid.UUID) -> Sequence[SalonMember]:
        stmt = (
            select(SalonMember)
            .where(SalonMember.salon_id == salon_id)
            .options(selectinload(SalonMember.user))
            .order_by(SalonMember.created_at.asc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def add_member(self, salon_id: uuid.UUID, user_id: uuid.UUID) -> SalonMember:
        member = SalonMember(salon_id=salon_id, user_id=user_id, is_active=True)
        self.db.add(member)
        await self.db.flush()
        return member

    async def remove_member(self, salon_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        stmt = delete(SalonMember).where(
            SalonMember.salon_id == salon_id,
            SalonMember.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        return result.rowcount > 0

    async def is_user_member_or_owner(
        self, salon_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        salon = await self.get_by_id(salon_id)
        if not salon:
            return False
        if salon.owner_id == user_id:
            return True
        member = await self.get_member(salon_id, user_id)
        return member is not None and member.is_active

    # Services
    async def get_service(self, service_id: uuid.UUID) -> Optional[Service]:
        stmt = select(Service).where(Service.id == service_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_services(
        self, salon_id: uuid.UUID, available_only: bool = False
    ) -> Sequence[Service]:
        stmt = select(Service).where(Service.salon_id == salon_id)
        if available_only:
            stmt = stmt.where(Service.is_available == True)
        stmt = stmt.order_by(Service.price.asc())
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create_service(self, service: Service) -> Service:
        self.db.add(service)
        await self.db.flush()
        return service

    async def update_service(self, service: Service) -> Service:
        service.updated_at = datetime.now(timezone.utc)
        self.db.add(service)
        await self.db.flush()
        return service

    async def delete_service(self, service: Service) -> None:
        await self.db.delete(service)
        await self.db.flush()

    # Operating hours
    async def list_operating_hours(
        self, salon_id: uuid.UUID
    ) -> Sequence[OperatingHours]:
        stmt = select(OperatingHours).where(OperatingHours.salon_id == salon_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def save_operating_hours(
        self, salon_id: uuid.UUID, hours_list: List[OperatingHours]
    ) -> None:
        # Remove existing and insert new
        stmt = delete(OperatingHours).where(OperatingHours.salon_id == salon_id)
        await self.db.execute(stmt)
        for h in hours_list:
            h.salon_id = salon_id
            self.db.add(h)
        await self.db.flush()
