"""Seed script for BarberQ database with initial roles, admin, staff, salons, and services."""
import asyncio
from datetime import time
from decimal import Decimal
from sqlalchemy import select
from app.core.database import async_session_maker
from app.core.security import hash_password
from app.models.operating_hours import OperatingHours
from app.models.role import Role
from app.models.salon import Salon
from app.models.salon_member import SalonMember
from app.models.service import Service
from app.models.user import User
from app.models.user_role import UserRole


async def seed():
    async with async_session_maker() as db:
        print("Checking roles...")
        roles_data = [
            (1, "admin", "Platform administrator"),
            (2, "staff", "Salon owner, barber, or authorized salon employee"),
            (3, "users", "Customers who book tokens and track queues"),
        ]
        for rid, rname, rdesc in roles_data:
            stmt = select(Role).where(Role.id == rid)
            res = await db.execute(stmt)
            role = res.scalar_one_or_none()
            if not role:
                db.add(Role(id=rid, role_name=rname, description=rdesc))
        await db.commit()

        print("Checking admin and staff users...")
        # 1. Admin user
        admin_email = "admin@barberq.com"
        stmt = select(User).where(User.email == admin_email)
        res = await db.execute(stmt)
        admin_user = res.scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                full_name="Platform Admin",
                email=admin_email,
                password_hash=hash_password("AdminPass123!"),
                phone="+1000000001",
                is_active=True,
            )
            db.add(admin_user)
            await db.flush()
            db.add(UserRole(user_id=admin_user.id, role_id=1))
            await db.commit()
            print("Created default admin user: admin@barberq.com / AdminPass123!")

        # 2. Staff user / Owner
        staff_email = "staff@barberq.com"
        stmt = select(User).where(User.email == staff_email)
        res = await db.execute(stmt)
        staff_user = res.scalar_one_or_none()
        if not staff_user:
            staff_user = User(
                full_name="Tony Barber",
                email=staff_email,
                password_hash=hash_password("StaffPass123!"),
                phone="+1000000002",
                is_active=True,
            )
            db.add(staff_user)
            await db.flush()
            db.add(UserRole(user_id=staff_user.id, role_id=2))
            await db.commit()
            print("Created default staff user: staff@barberq.com / StaffPass123!")

        # 3. Customer user
        cust_email = "customer@barberq.com"
        stmt = select(User).where(User.email == cust_email)
        res = await db.execute(stmt)
        cust_user = res.scalar_one_or_none()
        if not cust_user:
            cust_user = User(
                full_name="James Carter",
                email=cust_email,
                password_hash=hash_password("UserPass123!"),
                phone="+16475550101",
                is_active=True,
            )
            db.add(cust_user)
            await db.flush()
            db.add(UserRole(user_id=cust_user.id, role_id=3))
            await db.commit()
            print("Created default customer user: customer@barberq.com / UserPass123!")

        # 4. Seed Salons matching frontend
        stmt = select(Salon).where(Salon.salon_name == "Sharp & Co. Barbershop")
        res = await db.execute(stmt)
        salon1 = res.scalar_one_or_none()
        if not salon1 and staff_user:
            salon1 = Salon(
                owner_id=staff_user.id,
                salon_name="Sharp & Co. Barbershop",
                description="Modern aesthetic barbershop offering precision fades and hot towel shaves.",
                address="12 King Street West",
                city="Toronto",
                phone="+1 (416) 555-0142",
                logo_url="https://images.pexels.com/photos/1813947/pexels-photo-1813947.jpeg?auto=compress&cs=tinysrgb&w=800",
                opening_time=time(9, 0),
                closing_time=time(19, 0),
                max_queue_capacity=50,
                is_active=True,
            )
            db.add(salon1)
            await db.flush()

            # Member
            db.add(SalonMember(salon_id=salon1.id, user_id=staff_user.id, is_active=True))

            # Services
            services = [
                Service(salon_id=salon1.id, service_name="Haircut", duration_minutes=30, price=Decimal("35.00"), description="Standard cut and finish", is_available=True),
                Service(salon_id=salon1.id, service_name="Beard Trim", duration_minutes=15, price=Decimal("18.00"), description="Shape and line-up", is_available=True),
                Service(salon_id=salon1.id, service_name="Haircut + Beard", duration_minutes=45, price=Decimal("48.00"), description="Full grooming package", is_available=True),
                Service(salon_id=salon1.id, service_name="Hot Towel Shave", duration_minutes=30, price=Decimal("32.00"), description="Traditional straight razor", is_available=True),
                Service(salon_id=salon1.id, service_name="Kid's Cut", duration_minutes=20, price=Decimal("25.00"), description="Under 12 years", is_available=True),
            ]
            db.add_all(services)

            # Operating hours
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
            for d in days:
                db.add(OperatingHours(salon_id=salon1.id, day_of_week=d, opening_time=time(9, 0), closing_time=time(19, 0), is_closed=False))
            db.add(OperatingHours(salon_id=salon1.id, day_of_week="Sunday", is_closed=True))

            await db.commit()
            print("Seeded Sharp & Co. Barbershop with services and hours.")

        print("Database seeding completed.")


if __name__ == "__main__":
    asyncio.run(seed())
