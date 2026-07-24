from datetime import UTC, datetime

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models import Lead, LeadQueue, LeadStatus, Product
from app.schemas.supplier import PublicProductOut
from app.services.catalogue_pdf import build_catalogue_pdf

router = APIRouter()


@router.get("/produits", response_model=list[PublicProductOut])
def public_products(featured: bool | None = None, db: Session = Depends(get_db)):
    """Vitrine publique : produits visibles uniquement — aucun fournisseur, stock ni prix (LP-05)."""
    query = (
        select(Product)
        .where(Product.visible, Product.archived_at.is_(None))
        .order_by(Product.featured.desc(), Product.ref)
    )
    if featured is not None:
        query = query.where(Product.featured == featured)
    return list(db.scalars(query))


@router.get("/download")
def download_catalogue(token: str, db: Session = Depends(get_db)):
    """Sert le catalogue uniquement via lien signé expirant — pas d'URL publique devinable (CATA-01).

    Le PDF est généré à la demande depuis le référentiel : un lien déjà envoyé
    sert donc toujours la dernière édition composée par l'administrateur (CATA-04).
    """
    try:
        payload = decode_token(token, purpose="catalogue-download")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Lien invalide ou expiré"
        ) from exc

    products = list(db.scalars(
        select(Product).where(Product.in_catalogue, Product.archived_at.is_(None))
        .order_by(Product.catalogue_position, Product.ref)
    ))
    if not products:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catalogue momentanément indisponible",
        )
    pdf = build_catalogue_pdf(products)

    # Le téléchargement réussit : on marque le lead comme « Téléchargé » (CATA : suivi de conversion).
    # Le lien contient l'id du lead ; on n'écrase jamais une progression manuelle de l'admin.
    lead = db.get(Lead, int(payload["sub"])) if str(payload.get("sub", "")).isdigit() else None
    if lead is not None and lead.queue == LeadQueue.CATALOGUE:
        lead.catalogue_downloaded_at = datetime.now(UTC)
        lead.catalogue_download_count += 1
        if lead.status == LeadStatus.NOUVEAU:
            lead.status = LeadStatus.TELECHARGE
        db.commit()
    return StreamingResponse(
        iter([pdf]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="catalogue-a-la-source.pdf"',
            # Un lien déjà envoyé doit toujours servir la dernière édition (CATA-04)
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    )
