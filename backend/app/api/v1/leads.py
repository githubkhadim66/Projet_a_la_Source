from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_token
from app.db.session import get_db
from app.models import Lead, LeadQueue
from app.schemas.lead import (
    CandidatureCreate,
    CatalogueLeadCreate,
    CatalogueLeadResponse,
    DevisLeadCreate,
    SourcingLeadCreate,
)
from app.services import emails

router = APIRouter()


def _reject_spam(website: str) -> None:
    """Honeypot : un bot qui remplit le champ caché est rejeté silencieusement (FOR-04)."""
    if website:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requête invalide")


def _require_consent(consent: bool) -> None:
    if not consent:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Le consentement RGPD est requis",
        )


@router.post("/catalogue", response_model=CatalogueLeadResponse, status_code=status.HTTP_201_CREATED)
def create_catalogue_lead(data: CatalogueLeadCreate, db: Session = Depends(get_db)):
    """Téléchargement gated du catalogue : lead horodaté + lien signé expirant (CATA-01/02/03)."""
    _reject_spam(data.website)
    _require_consent(data.rgpd_consent)

    lead = Lead(
        queue=LeadQueue.CATALOGUE,
        language=data.language,
        company=data.company,
        contact_name=f"{data.first_name} {data.last_name}",
        email=data.email,
        phone=data.phone,
        country=data.country,
        payload={"role": data.role},
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    token = create_token(str(lead.id), "catalogue-download", settings.CATALOGUE_LINK_EXPIRE_MINUTES)
    download_url = f"{settings.API_V1_PREFIX}/catalogue/download?token={token}"

    emails.send_template(
        "E1_catalogue", lead.email, lead.language,
        name=lead.contact_name, link=f"{settings.FRONTEND_URL}{download_url}",
    )
    emails.notify_internal(
        f"Nouveau lead catalogue #{lead.id}",
        f"{lead.contact_name} — {lead.company} ({lead.country}) — {lead.email}",
    )
    return CatalogueLeadResponse(id=lead.id, download_url=download_url)


@router.post("/devis", status_code=status.HTTP_201_CREATED)
def create_devis_lead(data: DevisLeadCreate, db: Session = Depends(get_db)):
    _reject_spam(data.website)
    lead = Lead(
        queue=LeadQueue.DEVIS,
        language=data.language,
        company=data.company,
        contact_name=data.contact,
        email=data.email,
        country=data.country,
        payload={
            "sector": data.sector,
            "products": data.products,
            "volume": data.volume,
            "packaging": data.packaging,
            "incoterm": data.incoterm,
            "forecast": data.forecast,
            "certifications": data.certifications,
            "transport_needed": data.transport_needed,
            "delivery_delay": data.delivery_delay,
            "delivery_continent": data.delivery_continent,
            "delivery_place": data.delivery_place,
            "delivery_contact": data.delivery_contact,
        },
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    emails.send_template("E2_devis", lead.email, lead.language, name=lead.contact_name)
    emails.notify_internal(
        f"Nouvelle demande de devis #{lead.id}",
        f"{lead.company} — {', '.join(data.products)} — {lead.email}",
    )
    return {"id": lead.id}


@router.post("/sourcing", status_code=status.HTTP_201_CREATED)
def create_sourcing_lead(data: SourcingLeadCreate, db: Session = Depends(get_db)):
    _reject_spam(data.website)
    lead = Lead(
        queue=LeadQueue.SOURCING,
        language=data.language,
        company=data.company,
        contact_name=data.contact,
        email=data.email,
        country=data.country,
        payload={
            "sector": data.sector,
            "product": data.product,
            "description": data.description,
            "origin": data.origin,
            "volume": data.volume,
            "budget": data.budget,
            "quality_level": data.quality_level,
            "forecast": data.forecast,
            "incoterm": data.incoterm,
            "other_need": data.other_need,
            "certifications": data.certifications,
            "transport_needed": data.transport_needed,
            "delivery_delay": data.delivery_delay,
            "delivery_continent": data.delivery_continent,
            "delivery_place": data.delivery_place,
            "delivery_contact": data.delivery_contact,
        },
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    emails.send_template("E2_devis", lead.email, lead.language, name=lead.contact_name)
    emails.notify_internal(
        f"Nouvelle demande de sourcing #{lead.id}",
        f"{lead.company} — {data.product} — {lead.email}",
    )
    return {"id": lead.id}


@router.post("/candidature", status_code=status.HTTP_201_CREATED)
def create_candidature(data: CandidatureCreate, db: Session = Depends(get_db)):
    _reject_spam(data.website)
    _require_consent(data.rgpd_consent)
    lead = Lead(
        queue=LeadQueue.CANDIDATURE,
        language=data.language,
        company=data.company,
        contact_name=data.contact_name,
        email=data.email,
        phone=data.phone,
        country=data.country,
        payload={
            "city": data.city,
            "product_types": data.product_types,
            "volumes": data.volumes,
            "certifications": data.certifications,
        },
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    emails.send_template("E3_candidature", lead.email, lead.language, name=lead.contact_name)
    emails.notify_internal(
        f"Nouvelle candidature fournisseur #{lead.id}",
        f"{lead.company} ({lead.country}) — {lead.email}",
    )
    return {"id": lead.id}
