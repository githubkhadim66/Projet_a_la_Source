import csv
import io
import json
from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.config import settings
from app.core.security import create_token, generate_temp_password, hash_password, verify_password
from app.db.session import get_db
from app.models import (
    AdminUser,
    Appointment,
    Lead,
    LeadQueue,
    Product,
    ProductProposal,
    ProposalStatus,
    StockStatus,
    Supplier,
)
from app.schemas.auth import AdminLogin, TokenResponse
from app.schemas.lead import LeadOut, LeadStatusUpdate
from app.schemas.rdv import RdvOut, RdvStatusUpdate
from app.schemas.supplier import (
    AdminProductOut,
    CatalogueReorder,
    ProductAdminUpdate,
    ProductCreate,
    ProposalDecision,
    ProposalOut,
    SupplierCreate,
    SupplierOut,
    SupplierUpdate,
    SupplierWithTempPassword,
)
from app.services import emails
from app.services.catalogue_pdf import build_catalogue_pdf
from app.services.storage import StorageError, upload_product_image

router = APIRouter()

QUEUE_ALIASES = {"candidatures": LeadQueue.CANDIDATURE}
STALE_DAYS = 14  # FRS-05 : alerte « stock non actualisé »


def _is_stale(updated_at: datetime) -> bool:
    ref = updated_at if updated_at.tzinfo else updated_at.replace(tzinfo=UTC)
    return ref < datetime.now(UTC) - timedelta(days=STALE_DAYS)


def _admin_product(p: Product) -> AdminProductOut:
    out = AdminProductOut.model_validate(p)
    out.supplier_name = p.supplier.name if p.supplier else ""
    out.stale = _is_stale(p.updated_at)
    return out


# ─── Authentification ────────────────────────────────────────────────────────

@router.post("/auth/login", response_model=TokenResponse)
def login(data: AdminLogin, db: Session = Depends(get_db)):
    admin = db.scalar(select(AdminUser).where(AdminUser.email == data.email, AdminUser.is_active))
    if admin is None or not verify_password(data.password, admin.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants invalides")
    token = create_token(str(admin.id), "admin-access", settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenResponse(access_token=token)


@router.get("/me")
def me(admin: AdminUser = Depends(get_current_admin)):
    return {"id": admin.id, "email": admin.email, "full_name": admin.full_name}


# ─── Tableau de bord ─────────────────────────────────────────────────────────

@router.get("/dashboard")
def dashboard(_: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    leads_by_queue = dict(db.execute(select(Lead.queue, func.count()).group_by(Lead.queue)).all())
    leads_by_status = dict(db.execute(select(Lead.status, func.count()).group_by(Lead.status)).all())
    products = list(db.scalars(select(Product)))
    return {
        "leads": {q.value: leads_by_queue.get(q, 0) for q in LeadQueue},
        "leads_total": sum(leads_by_queue.values()),
        "leads_new": sum(n for s, n in leads_by_status.items() if s.value == "Nouveau"),
        "leads_in_progress": sum(n for s, n in leads_by_status.items() if s.value == "En cours"),
        "suppliers_total": db.scalar(select(func.count()).select_from(Supplier)) or 0,
        "suppliers_active": db.scalar(select(func.count()).where(Supplier.is_active)) or 0,
        "products_total": len(products),
        "products_visible": sum(1 for p in products if p.visible),
        "products_featured": sum(1 for p in products if p.featured),
        "stock_ruptures": sum(1 for p in products if p.status == StockStatus.RUPTURE),
        "stock_stale": sum(1 for p in products if _is_stale(p.updated_at)),
        "proposals_pending": db.scalar(
            select(func.count()).where(ProductProposal.status == ProposalStatus.EN_ATTENTE)
        ) or 0,
        "appointments_total": db.scalar(select(func.count()).select_from(Appointment)) or 0,
    }


# ─── Leads (4 files, statuts administrables — FOR-06, REF-03) ────────────────

@router.get("/leads", response_model=list[LeadOut])
def list_leads(
    queue: str | None = None,
    lead_status: str | None = None,
    limit: int | None = None,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = select(Lead).order_by(Lead.created_at.desc())
    if queue:
        q = QUEUE_ALIASES.get(queue) or LeadQueue(queue)
        query = query.where(Lead.queue == q)
    if lead_status:
        query = query.where(Lead.status == lead_status)
    if limit:
        query = query.limit(limit)
    return list(db.scalars(query))


@router.patch("/leads/{lead_id}", response_model=LeadOut)
def update_lead_status(
    lead_id: int,
    data: LeadStatusUpdate,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead introuvable")
    lead.status = data.status
    db.commit()
    db.refresh(lead)
    return lead


# ─── Fournisseurs (FRS-01 : création/désactivation par l'admin seul) ─────────

def _supplier_out(s: Supplier) -> SupplierOut:
    out = SupplierOut.model_validate(s)
    out.products_count = len(s.products)
    return out


@router.get("/suppliers", response_model=list[SupplierOut])
def list_suppliers(_: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    return [_supplier_out(s) for s in db.scalars(select(Supplier).order_by(Supplier.name))]


@router.post("/suppliers", response_model=SupplierWithTempPassword, status_code=status.HTTP_201_CREATED)
def create_supplier(
    data: SupplierCreate, _: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)
):
    """Crée le compte avec un mot de passe temporaire, montré une seule fois à l'admin (FRS-01)."""
    if db.scalar(select(Supplier).where(Supplier.email == data.email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail déjà référencé")
    temp_password = generate_temp_password()
    supplier = Supplier(
        **data.model_dump(), hashed_password=hash_password(temp_password), must_change_password=True
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    emails.send_template(
        "supplier_credentials", supplier.email, "fr",
        name=supplier.contact_name or supplier.name, email=supplier.email, password=temp_password,
    )
    out = SupplierWithTempPassword.model_validate(supplier)
    out.temp_password = temp_password
    return out


@router.post("/suppliers/{supplier_id}/reset-password", response_model=SupplierWithTempPassword)
def reset_supplier_password(
    supplier_id: int, _: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)
):
    supplier = db.get(Supplier, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fournisseur introuvable")
    temp_password = generate_temp_password()
    supplier.hashed_password = hash_password(temp_password)
    supplier.must_change_password = True
    db.commit()
    db.refresh(supplier)
    emails.send_template(
        "supplier_credentials", supplier.email, "fr",
        name=supplier.contact_name or supplier.name, email=supplier.email, password=temp_password,
    )
    out = SupplierWithTempPassword.model_validate(supplier)
    out.products_count = len(supplier.products)
    out.temp_password = temp_password
    return out


@router.patch("/suppliers/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    supplier = db.get(Supplier, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fournisseur introuvable")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
    return _supplier_out(supplier)


# ─── Produits : vue consolidée des stocks + vitrine (REF-02) ─────────────────

@router.get("/products", response_model=list[AdminProductOut])
def list_products(
    supplier_id: int | None = None,
    archived: bool = False,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Produits actifs par défaut ; `archived=true` renvoie la corbeille (produits archivés)."""
    query = select(Product).order_by(Product.ref)
    query = query.where(Product.archived_at.is_not(None)) if archived else query.where(Product.archived_at.is_(None))
    if supplier_id:
        query = query.where(Product.supplier_id == supplier_id)
    return [_admin_product(p) for p in db.scalars(query)]


@router.post("/products", response_model=AdminProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate, _: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)
):
    if db.get(Supplier, data.supplier_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fournisseur introuvable")
    if db.scalar(select(Product).where(Product.ref == data.ref)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Référence déjà utilisée")
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return _admin_product(product)


@router.patch("/products/{product_id}", response_model=AdminProductOut)
def update_product(
    product_id: int,
    data: ProductAdminUpdate,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produit introuvable")
    updates = data.model_dump(exclude_unset=True)
    # Vitrine : maximum 6 produits en vedette sur l'accueil
    if updates.get("featured") is True and not product.featured:
        featured_count = db.scalar(select(func.count()).where(Product.featured)) or 0
        if featured_count >= 6:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Maximum 6 produits en vedette"
            )
    for field, value in updates.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return _admin_product(product)


@router.post("/products/{product_id}/archive", response_model=AdminProductOut)
def archive_product(
    product_id: int, _: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)
):
    """Archivage réversible : le produit quitte le site, l'accueil et le catalogue, mais est conservé."""
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produit introuvable")
    product.archived_at = datetime.now(UTC)
    product.featured = False       # libère un slot d'accueil
    product.in_catalogue = False   # sort du catalogue PDF (réintégrable à la restauration)
    db.commit()
    db.refresh(product)
    return _admin_product(product)


@router.post("/products/{product_id}/restore", response_model=AdminProductOut)
def restore_product(
    product_id: int, _: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)
):
    """Restaure un produit archivé : il redevient un produit actif (masqué de la vedette)."""
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produit introuvable")
    product.archived_at = None
    db.commit()
    db.refresh(product)
    return _admin_product(product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int, _: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)
):
    """Suppression définitive — réservée à la corbeille (produit déjà archivé)."""
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produit introuvable")
    if product.archived_at is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Archivez d'abord le produit avant de le supprimer définitivement.",
        )
    db.delete(product)
    db.commit()


# ─── Propositions de produits (FRS-03 : validation admin) ────────────────────

def _proposal_out(p: ProductProposal) -> ProposalOut:
    out = ProposalOut.model_validate(p)
    out.supplier_name = p.supplier.name if p.supplier else ""
    return out


@router.get("/proposals", response_model=list[ProposalOut])
def list_proposals(
    pending_only: bool = False,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = select(ProductProposal).order_by(ProductProposal.created_at.desc())
    if pending_only:
        query = query.where(ProductProposal.status == ProposalStatus.EN_ATTENTE)
    return [_proposal_out(p) for p in db.scalars(query)]


@router.patch("/proposals/{proposal_id}", response_model=ProposalOut)
def decide_proposal(
    proposal_id: int,
    data: ProposalDecision,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    proposal = db.get(ProductProposal, proposal_id)
    if proposal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposition introuvable")
    was_pending = proposal.status == ProposalStatus.EN_ATTENTE
    proposal.status = data.status
    # Validation → création du produit reprenant toute la fiche proposée, masqué par défaut
    # (l'admin peut l'ajuster puis le rendre visible / l'ajouter au catalogue).
    if was_pending and data.status == ProposalStatus.APPROUVE:
        ref = f"ALS-PR-{proposal.id:03d}"
        if not db.scalar(select(Product).where(Product.ref == ref)):
            db.add(Product(
                supplier_id=proposal.supplier_id,
                ref=ref,
                name=proposal.name,
                description=proposal.description,
                benefits=proposal.benefits,
                origin=proposal.origin,
                category=proposal.category or "Épicerie",
                packaging=proposal.packaging,
                moq=proposal.moq or (proposal.volumes or ""),
                image=proposal.image,
                price_per_kg=proposal.price_per_kg,
                bulk_price=proposal.bulk_price,
                harvest_period=proposal.harvest_period,
                visible=False,
                in_catalogue=True,
                status=StockStatus.SUR_COMMANDE,
                delay="À confirmer",
            ))
    db.commit()
    db.refresh(proposal)
    return _proposal_out(proposal)


# ─── Rendez-vous ─────────────────────────────────────────────────────────────

@router.get("/appointments", response_model=list[RdvOut])
def list_appointments(_: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    return list(db.scalars(select(Appointment).order_by(Appointment.day, Appointment.slot)))


@router.patch("/appointments/{appointment_id}", response_model=RdvOut)
def update_appointment(
    appointment_id: int,
    data: RdvStatusUpdate,
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Annuler / reconfirmer un rendez-vous (l'annulation libère le créneau)."""
    appt = db.get(Appointment, appointment_id)
    if appt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous introuvable")
    appt.status = data.status
    db.commit()
    db.refresh(appt)
    return appt


# ─── Suppression d'un lead (RGPD — SEC-03) ───────────────────────────────────

@router.delete("/leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(lead_id: int, _: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead introuvable")
    db.delete(lead)
    db.commit()


# ─── Relance stock fournisseur (FRS-05) ──────────────────────────────────────

@router.post("/suppliers/{supplier_id}/remind-stock")
def remind_supplier_stock(
    supplier_id: int, _: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)
):
    """Envoie au fournisseur la liste de ses références non actualisées depuis > 14 jours."""
    supplier = db.get(Supplier, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fournisseur introuvable")
    stale = [p for p in supplier.products if _is_stale(p.updated_at)]
    if not stale:
        return {"message": "Aucune référence à relancer pour ce fournisseur.", "count": 0}
    listing = "\n".join(f"- {p.name} ({p.ref}) · dernière màj {p.updated_at:%d/%m/%Y}" for p in stale)
    emails.send_template(
        "stock_reminder", supplier.email, "fr",
        name=supplier.contact_name or supplier.name, days=STALE_DAYS, products=listing,
    )
    return {"message": f"Relance envoyée à {supplier.email} ({len(stale)} référence(s)).", "count": len(stale)}


# ─── Téléversement des photos produits ───────────────────────────────────────

@router.post("/uploads/image")
async def upload_image(file: UploadFile = File(...), _: AdminUser = Depends(get_current_admin)):
    """Envoie une photo (S3 si configuré, disque local sinon) et renvoie son URL."""
    content = await file.read()
    try:
        url = upload_product_image(content, file.filename or "photo.jpg", file.content_type or "image/jpeg")
    except StorageError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    return {"url": url}


# ─── Catalogue PDF : composition, aperçu, demandes ───────────────────────────

def _catalogue_products(db: Session) -> list[Product]:
    """Produits retenus pour le PDF, dans l'ordre défini par l'administrateur (hors archivés)."""
    return list(db.scalars(
        select(Product).where(Product.in_catalogue, Product.archived_at.is_(None))
        .order_by(Product.catalogue_position, Product.ref)
    ))


@router.get("/catalogue/products", response_model=list[AdminProductOut])
def catalogue_composition(_: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Tous les produits actifs du référentiel (les archivés en sont exclus)."""
    products = db.scalars(
        select(Product).where(Product.archived_at.is_(None))
        .order_by(Product.catalogue_position, Product.ref)
    )
    return [_admin_product(p) for p in products]


@router.post("/catalogue/reorder", response_model=list[AdminProductOut])
def catalogue_reorder(
    data: CatalogueReorder, _: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)
):
    """Enregistre l'ordre d'apparition des produits dans le catalogue."""
    for position, product_id in enumerate(data.product_ids):
        product = db.get(Product, product_id)
        if product is not None:
            product.catalogue_position = position
    db.commit()
    products = db.scalars(select(Product).order_by(Product.catalogue_position, Product.ref))
    return [_admin_product(p) for p in products]


@router.get("/catalogue/preview")
def catalogue_preview(_: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Génère et renvoie le catalogue PDF tel que le recevront les prospects."""
    products = _catalogue_products(db)
    if not products:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Aucun produit dans le catalogue · ajoutez-en au moins un.",
        )
    pdf = build_catalogue_pdf(products)
    filename = f"catalogue-a-la-source-{date.today():%Y-%m}.pdf"
    return StreamingResponse(
        iter([pdf]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            # Le catalogue est recomposé à chaque appel : jamais de version en cache
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    )


@router.get("/catalogue/requests", response_model=list[LeadOut])
def catalogue_requests(_: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Demandes de catalogue reçues via le formulaire public."""
    return list(db.scalars(
        select(Lead).where(Lead.queue == LeadQueue.CATALOGUE).order_by(Lead.created_at.desc())
    ))


@router.post("/catalogue/requests/{lead_id}/send")
def resend_catalogue(
    lead_id: int, _: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)
):
    """Renvoie au demandeur l'e-mail contenant un lien de téléchargement frais."""
    lead = db.get(Lead, lead_id)
    if lead is None or lead.queue != LeadQueue.CATALOGUE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande introuvable")
    token = create_token(str(lead.id), "catalogue-download", settings.CATALOGUE_LINK_EXPIRE_MINUTES)
    link = f"{settings.FRONTEND_URL}{settings.API_V1_PREFIX}/catalogue/download?token={token}"
    emails.send_template("E1_catalogue", lead.email, lead.language, name=lead.contact_name, link=link)
    return {"message": f"Catalogue renvoyé à {lead.email}."}


# ─── Exports CSV (REF-04 : réversibilité des données) ────────────────────────

def _csv_response(filename: str, header: list[str], rows: list[list]) -> StreamingResponse:
    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=";")
    writer.writerow(header)
    writer.writerows(rows)
    buffer.seek(0)
    return StreamingResponse(
        iter([("﻿" + buffer.getvalue()).encode("utf-8")]),  # BOM pour Excel
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/leads")
def export_leads(_: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    rows = [
        [ld.id, ld.queue.value, ld.status.value, ld.created_at.strftime("%d/%m/%Y %H:%M"),
         ld.company, ld.contact_name, ld.email, ld.phone or "", ld.country, ld.language,
         json.dumps(ld.payload, ensure_ascii=False)]
        for ld in db.scalars(select(Lead).order_by(Lead.created_at.desc()))
    ]
    return _csv_response(
        "leads.csv",
        ["id", "file", "statut", "date", "societe", "contact", "email", "telephone", "pays", "langue", "details"],
        rows,
    )


@router.get("/export/products")
def export_products(_: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    rows = [
        [p.ref, p.name, p.category or "", p.origin or "", p.packaging, p.moq, p.supplier.name if p.supplier else "",
         p.stock_kg, p.status.value, p.delay, "oui" if p.visible else "non",
         "oui" if p.featured else "non", p.updated_at.strftime("%d/%m/%Y")]
        for p in db.scalars(select(Product).order_by(Product.ref))
    ]
    return _csv_response(
        "produits.csv",
        ["reference", "nom", "categorie", "origine", "conditionnement", "moq", "fournisseur", "stock_kg",
         "disponibilite", "delai", "visible", "vedette", "maj"],
        rows,
    )


@router.get("/export/suppliers")
def export_suppliers(_: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    rows = [
        [s.id, s.name, s.contact_name or "", s.email, s.phone or "", s.country or "", s.city or "",
         ", ".join(s.categories), "actif" if s.is_active else "désactivé", len(s.products),
         s.last_login_at.strftime("%d/%m/%Y") if s.last_login_at else "",
         s.created_at.strftime("%d/%m/%Y")]
        for s in db.scalars(select(Supplier).order_by(Supplier.name))
    ]
    return _csv_response(
        "fournisseurs.csv",
        ["id", "societe", "contact", "email", "telephone", "pays", "ville", "categories",
         "statut", "produits", "derniere_connexion", "cree_le"],
        rows,
    )
