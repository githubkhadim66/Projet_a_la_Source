import enum
from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class StockStatus(str, enum.Enum):
    EN_STOCK = "En stock"
    SUR_COMMANDE = "Sur commande"
    RUPTURE = "Rupture"


class Product(Base):
    """Produit rattaché à un fournisseur. Le fournisseur ne modifie que stock/dispo/délai (FRS-02)."""

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), index=True)
    ref: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    origin: Mapped[str | None] = mapped_column(String(100), nullable=True)
    moq: Mapped[str] = mapped_column(String(50), default="")
    image: Mapped[str] = mapped_column(String(500), default="")

    # Fiche produit : présentation commerciale et bénéfices nutritionnels
    description: Mapped[str] = mapped_column(Text, default="")
    benefits: Mapped[str] = mapped_column(Text, default="")

    # Vitrine : visible dans le catalogue public / mise en avant sur l'accueil (max 6 côté admin)
    visible: Mapped[bool] = mapped_column(Boolean, default=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)

    # Catalogue PDF : appartenance et ordre d'apparition, indépendants de la vitrine du site
    in_catalogue: Mapped[bool] = mapped_column(Boolean, default=True)
    catalogue_position: Mapped[int] = mapped_column(Integer, default=0)

    stock_kg: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[StockStatus] = mapped_column(Enum(StockStatus), default=StockStatus.EN_STOCK)
    delay: Mapped[str] = mapped_column(String(100), default="")

    # Informations commerciales INTERNES (jamais exposées au public : « Prix sur devis »).
    # Saisies par le fournisseur / l'admin — prix du fournisseur vers À la Source.
    price_per_kg: Mapped[str] = mapped_column(String(50), default="")
    bulk_price: Mapped[str] = mapped_column(String(50), default="")
    harvest_period: Mapped[str] = mapped_column(String(100), default="")

    # Archivage réversible : un produit archivé disparaît du site et du catalogue,
    # mais reste en base (restaurable) — la corbeille ne perd donc jamais un produit.
    archived_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    supplier = relationship("Supplier", back_populates="products")


class ProposalStatus(str, enum.Enum):
    EN_ATTENTE = "En attente"
    APPROUVE = "Approuvé"
    REFUSE = "Refusé"


class ProductProposal(Base):
    """Proposition de produit — rien n'est publié sans validation admin (FRS-03)."""

    __tablename__ = "product_proposals"

    id: Mapped[int] = mapped_column(primary_key=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    # Fiche complète proposée par le fournisseur (mêmes informations qu'un produit)
    benefits: Mapped[str] = mapped_column(Text, default="")
    origin: Mapped[str] = mapped_column(String(100), default="")
    category: Mapped[str] = mapped_column(String(100), default="")
    moq: Mapped[str] = mapped_column(String(50), default="")
    image: Mapped[str] = mapped_column(String(500), default="")
    volumes: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Informations commerciales internes proposées par le fournisseur
    price_per_kg: Mapped[str] = mapped_column(String(50), default="")
    bulk_price: Mapped[str] = mapped_column(String(50), default="")
    harvest_period: Mapped[str] = mapped_column(String(100), default="")
    certifications: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[ProposalStatus] = mapped_column(Enum(ProposalStatus), default=ProposalStatus.EN_ATTENTE)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    supplier = relationship("Supplier", back_populates="proposals")
