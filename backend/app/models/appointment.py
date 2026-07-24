from datetime import UTC, date, datetime

from sqlalchemy import Date, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Appointment(Base):
    """Rendez-vous expert 15/30 min (CDC RDV-01/RDV-02)."""

    __tablename__ = "appointments"
    __table_args__ = (UniqueConstraint("day", "slot", name="uq_appointment_day_slot"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    company: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    motif: Mapped[str | None] = mapped_column(String(255), nullable=True)
    day: Mapped[date] = mapped_column(Date, index=True)
    slot: Mapped[str] = mapped_column(String(5))  # "HH:MM"
    timezone: Mapped[str] = mapped_column(String(50), default="Europe/Paris")
    language: Mapped[str] = mapped_column(String(5), default="fr")
    status: Mapped[str] = mapped_column(String(20), default="confirmé")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
