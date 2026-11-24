import uuid
from typing import List, Optional, Sequence, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.models.operating_hours import OperatingHours
from app.models.salon import Salon
from app.models.salon_member import SalonMember
from app.models.service import Service
from app.repositories.salon_repository import SalonRepository
from app.repositories.user_repository import UserRepository
from app.schemas.salon import SalonCreate, SalonUpdate
from app.schemas.service import ServiceCreate, ServiceUpdate


class SalonService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.salon_repo = SalonRepository(db)
        self.user_repo = UserRepository(db)

    async def create_salon(self, owner_id: uuid.UUID, data: SalonCreate) -> Salon:
        salon = Salon(
            owner_id=owner_id,
            salon_name=data.salon_name,
            description=data.description,
            address=data.address,
            city=data.city,
            phone=data.phone,
            logo_url=data.logo_url,
            opening_time=data.opening_time,
            closing_time=data.closing_time,
            max_queue_capacity=data.max_queue_capacity,
            is_active=data.is_active,
        )
        created = await self.salon_repo.create_salon(salon)

        # Also add owner as active salon member
        await self.salon_repo.add_member(created.id, owner_id)

        # Save operating hours if provided
        if data.operating_hours:
            hours = [
                OperatingHours(
                    day_of_week=h.day_of_week,
                    opening_time=h.opening_time or data.opening_time,
                    closing_time=h.closing_time or data.closing_time,
                    is_closed=h.is_closed,
                )
                for h in data.operating_hours
            ]
            await self.salon_repo.save_operating_hours(created.id, hours)

        return created

    async def get_salon(
        self, salon_id: uuid.UUID, load_details: bool = True
    ) -> Salon:
        salon = await self.salon_repo.get_by_id(salon_id, load_details=load_details)
        if not salon:
            raise NotFoundException("Salon not found")
        return salon

    async def list_salons(
        self,
        search: Optional[str] = None,
        city: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[Sequence[Salon], int]:
        offset = (page - 1) * limit
        items = await self.salon_repo.list_salons(
            search=search,
            city=city,
            is_active=is_active,
            offset=offset,
            limit=limit,
        )
        total = await self.salon_repo.count_salons(
            search=search,
            city=city,
            is_active=is_active,
        )
        return items, total

    async def update_salon(
        self, salon_id: uuid.UUID, data: SalonUpdate
    ) -> Salon:
        salon = await self.get_salon(salon_id)
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(salon, field, value)
        return await self.salon_repo.update_salon(salon)

    async def delete_salon(self, salon_id: uuid.UUID) -> None:
        salon = await self.get_salon(salon_id)
        await self.salon_repo.delete_salon(salon)

    # Members
    async def add_member(
        self, salon_id: uuid.UUID, user_id: uuid.UUID
    ) -> SalonMember:
        await self.get_salon(salon_id)
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        existing = await self.salon_repo.get_member(salon_id, user_id)
        if existing:
            if not existing.is_active:
                existing.is_active = True
                self.db.add(existing)
                await self.db.flush()
                return existing
            raise ConflictException("User is already a member of this salon")

        # Automatically assign 'staff' role if not already assigned
        user_roles = [ur.role.role_name for ur in user.user_roles if ur.role]
        if "staff" not in user_roles and "admin" not in user_roles:
            role_staff = await self.user_repo.get_role_by_id(2)
            if role_staff:
                await self.user_repo.assign_role(user.id, role_staff.id)

        return await self.salon_repo.add_member(salon_id, user_id)

    async def list_members(self, salon_id: uuid.UUID) -> Sequence[SalonMember]:
        await self.get_salon(salon_id)
        return await self.salon_repo.list_members(salon_id)

    async def remove_member(
        self, salon_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        await self.get_salon(salon_id)
        success = await self.salon_repo.remove_member(salon_id, user_id)
        if not success:
            raise NotFoundException("Member not found in this salon")
        return True

    # Services
    async def create_service(
        self, salon_id: uuid.UUID, data: ServiceCreate
    ) -> Service:
        await self.get_salon(salon_id)
        service = Service(
            salon_id=salon_id,
            service_name=data.service_name,
            description=data.description,
            duration_minutes=data.duration_minutes,
            price=data.price,
            is_available=data.is_available,
        )
        return await self.salon_repo.create_service(service)

    async def list_services(
        self, salon_id: uuid.UUID, available_only: bool = False
    ) -> Sequence[Service]:
        await self.get_salon(salon_id)
        return await self.salon_repo.list_services(salon_id, available_only=available_only)

    async def get_service(
        self, salon_id: uuid.UUID, service_id: uuid.UUID
    ) -> Service:
        service = await self.salon_repo.get_service(service_id)
        if not service or service.salon_id != salon_id:
            raise NotFoundException("Service not found in this salon")
        return service

    async def update_service(
        self, salon_id: uuid.UUID, service_id: uuid.UUID, data: ServiceUpdate
    ) -> Service:
        service = await self.get_service(salon_id, service_id)
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(service, field, value)
        return await self.salon_repo.update_service(service)

    async def delete_service(
        self, salon_id: uuid.UUID, service_id: uuid.UUID
    ) -> None:
        service = await self.get_service(salon_id, service_id)
        await self.salon_repo.delete_service(service)
