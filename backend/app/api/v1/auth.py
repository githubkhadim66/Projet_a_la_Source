"""Connexion unifiée : un seul formulaire, le rôle (admin ou fournisseur) est détecté ici."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_token, verify_password
from app.db.session import get_db
from app.models import AdminUser, Supplier
from app.schemas.auth import UnifiedLogin, UnifiedTokenResponse

router = APIRouter()


@router.post("/login", response_model=UnifiedTokenResponse)
def unified_login(data: UnifiedLogin, db: Session = Depends(get_db)):
    # 1. Compte administrateur ?
    admin = db.scalar(select(AdminUser).where(AdminUser.email == data.email, AdminUser.is_active))
    if admin and verify_password(data.password, admin.hashed_password):
        token = create_token(str(admin.id), "admin-access", settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return UnifiedTokenResponse(access_token=token, role="admin")

    # 2. Compte fournisseur ?
    supplier = db.scalar(select(Supplier).where(Supplier.email == data.email, Supplier.is_active))
    if supplier and supplier.hashed_password and verify_password(data.password, supplier.hashed_password):
        supplier.last_login_at = datetime.now(UTC)
        db.commit()
        token = create_token(str(supplier.id), "supplier-access", settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return UnifiedTokenResponse(
            access_token=token, role="supplier", must_change_password=supplier.must_change_password
        )

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants invalides")
