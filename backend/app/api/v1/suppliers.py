from datetime import UTC, datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_supplier
from app.core.config import settings
from app.core.security import create_token, hash_password, verify_password
from app.db.session import get_db
from app.models import Product, ProductProposal, Supplier
from app.schemas.supplier import (
    ProductOut,
    ProductStockUpdate,
    ProposalCreate,
    ProposalOut,
    SupplierLogin,
    SupplierOut,
    SupplierPasswordChange,
    SupplierSelfUpdate,
    TokenResponse,
)
from app.services import emails
from app.services.storage import StorageError, upload_product_image

router = APIRouter()


@router.post("/auth/login", response_model=TokenResponse)
def login(data: SupplierLogin, db: Session = Depends(get_db)):
    """Connexion fournisseur par e-mail + mot de passe (compte créé par l'admin — FRS-01)."""
    supplier = db.scalar(select(Supplier).where(Supplier.email == data.email, Supplier.is_active))
    if supplier is None or not supplier.hashed_password or not verify_password(data.password, supplier.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants invalides")
    supplier.last_login_at = datetime.now(UTC)
    db.commit()
    access = create_token(str(supplier.id), "supplier-access", settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenResponse(access_token=access)


@router.post("/me/password")
def change_password(
    data: SupplierPasswordChange,
    supplier: Supplier = Depends(get_current_supplier),
    db: Session = Depends(get_db),
):
    """Changement de mot de passe par le fournisseur (proposé à la première connexion)."""
    if not supplier.hashed_password or not verify_password(data.current_password, supplier.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Mot de passe actuel incorrect"
        )
    supplier.hashed_password = hash_password(data.new_password)
    supplier.must_change_password = False
    db.commit()
    return {"message": "Mot de passe mis à jour."}


def _profile_out(supplier: Supplier, db: Session) -> SupplierOut:
    out = SupplierOut.model_validate(supplier)
    out.products_count = db.scalar(
        select(func.count()).select_from(Product).where(Product.supplier_id == supplier.id)
    ) or 0
    return out


@router.get("/me", response_model=SupplierOut)
def my_profile(supplier: Supplier = Depends(get_current_supplier), db: Session = Depends(get_db)):
    return _profile_out(supplier, db)


@router.patch("/me", response_model=SupplierOut)
def update_my_profile(
    data: SupplierSelfUpdate,
    supplier: Supplier = Depends(get_current_supplier),
    db: Session = Depends(get_db),
):
    """Mise à jour par le fournisseur de ses propres coordonnées (FRS-02)."""
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
    return _profile_out(supplier, db)


@router.get("/me/products", response_model=list[ProductOut])
def my_products(supplier: Supplier = Depends(get_current_supplier), db: Session = Depends(get_db)):
    """Étanchéité (FRS-04) : uniquement les produits du fournisseur authentifié."""
    return list(db.scalars(select(Product).where(Product.supplier_id == supplier.id)))


@router.patch("/me/products/{product_id}", response_model=ProductOut)
def update_my_product(
    product_id: int,
    data: ProductStockUpdate,
    supplier: Supplier = Depends(get_current_supplier),
    db: Session = Depends(get_db),
):
    product = db.get(Product, product_id)
    # 404 (et non 403) si le produit appartient à un autre fournisseur : aucune fuite d'existence
    if product is None or product.supplier_id != supplier.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produit introuvable")
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.post("/me/uploads/image")
async def upload_proposal_image(
    file: UploadFile = File(...), _: Supplier = Depends(get_current_supplier)
):
    """Téléversement d'une photo par le fournisseur (pour sa proposition de produit)."""
    content = await file.read()
    try:
        url = upload_product_image(content, file.filename or "photo.jpg", file.content_type or "image/jpeg")
    except StorageError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    return {"url": url}


@router.post("/me/proposals", response_model=ProposalOut, status_code=status.HTTP_201_CREATED)
def propose_product(
    data: ProposalCreate,
    supplier: Supplier = Depends(get_current_supplier),
    db: Session = Depends(get_db),
):
    """Proposition en file de validation — aucune publication automatique (FRS-03)."""
    proposal = ProductProposal(
        supplier_id=supplier.id,
        name=data.name,
        description=data.description,
        benefits=data.benefits,
        origin=data.origin,
        category=data.category,
        moq=data.moq,
        image=data.image,
        volumes=data.volumes,
        price_per_kg=data.price_per_kg,
        bulk_price=data.bulk_price,
        harvest_period=data.harvest_period,
        certifications=data.certifications,
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    emails.notify_internal(
        f"Nouvelle proposition produit #{proposal.id}",
        f"{supplier.name} propose : {proposal.name}",
    )
    return proposal
