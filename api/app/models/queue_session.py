import uuid
from datetime import date, datetime, timezone
from typing import List
from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class QueueSession(Base):
    __tablename__ = "queue_sessions"
    __table_args__ = (
        UniqueConstraint("salon_id", "session_date", name="uq_salon_session_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    salon_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("salons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_date: Mapped[date] = mapped_column(
        Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False
    )
    last_token_number: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="OPEN", nullable=False
    )  # OPEN, PAUSED, CLOSED
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    salon: Mapped["Salon"] = relationship("Salon", back_populates="queue_sessions")
    entries: Mapped[List["QueueEntry"]] = relationship(
        "QueueEntry", back_populates="session", cascade="all, delete-orphan"
    )
