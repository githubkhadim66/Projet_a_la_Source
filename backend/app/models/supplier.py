from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Supplier(Base):
    """Fournisseur référencé. Comptes créés uniquement par l'admin (CDC FRS-01)."""

    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    categories: Mapped[list] = mapped_column(JSON, default=list)
    # Mot de passe défini par l'admin (temporaire à la création, réinitialisable)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # True après création/réinitialisation par l'admin : le fournisseur est invité à le changer
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    products = relationship("Product", back_populates="supplier", lazy="selectin")
    proposals = relationship("ProductProposal", back_populates="supplier", lazy="selectin")
