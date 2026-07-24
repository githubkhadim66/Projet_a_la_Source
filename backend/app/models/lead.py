import enum
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class LeadQueue(str, enum.Enum):
    """Les 4 files du référentiel (CDC FOR-06)."""

    CATALOGUE = "catalogue"
    DEVIS = "devis"
    SOURCING = "sourcing"
    CANDIDATURE = "candidature"


class LeadStatus(str, enum.Enum):
    NOUVEAU = "Nouveau"
    EN_COURS = "En cours"
    TRAITE = "Traité"
    CLOS = "Clos"
    # Statut automatique de la file catalogue : le prospect a récupéré le PDF
    TELECHARGE = "Téléchargé"
    # Statut automatique de la file candidature : un compte fournisseur a été créé
    REFERENCE = "Référencé"
    # Statuts spécifiques à la file devis
    DEVIS_ENVOYE = "Devis envoyé"
    GAGNE = "Gagné"
    PERDU = "Perdu"


class Lead(Base):
    """Lead horodaté — une ligne par soumission de formulaire (CDC : zéro lead perdu)."""

    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    queue: Mapped[LeadQueue] = mapped_column(Enum(LeadQueue), index=True)
    status: Mapped[LeadStatus] = mapped_column(Enum(LeadStatus), default=LeadStatus.NOUVEAU, index=True)
    language: Mapped[str] = mapped_column(String(5), default="fr")

    company: Mapped[str] = mapped_column(String(255))
    contact_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    country: Mapped[str] = mapped_column(String(100))

    # Champs propres à chaque formulaire (matières, incoterm, certifications, etc.)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)

    # File catalogue : horodatage et nombre de récupérations du PDF par le prospect
    catalogue_downloaded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    catalogue_download_count: Mapped[int] = mapped_column(default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC), index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )
