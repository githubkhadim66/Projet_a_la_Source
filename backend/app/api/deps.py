import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models import AdminUser, Supplier

bearer_scheme = HTTPBearer(auto_error=False)


def _credentials_error(detail: str = "Authentification requise") -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def get_current_supplier(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Supplier:
    if credentials is None:
        raise _credentials_error()
    try:
        payload = decode_token(credentials.credentials, purpose="supplier-access")
    except jwt.InvalidTokenError as exc:
        raise _credentials_error("Jeton invalide ou expiré") from exc
    supplier = db.get(Supplier, int(payload["sub"]))
    if supplier is None or not supplier.is_active:
        raise _credentials_error("Compte fournisseur inactif")
    return supplier


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    if credentials is None:
        raise _credentials_error()
    try:
        payload = decode_token(credentials.credentials, purpose="admin-access")
    except jwt.InvalidTokenError as exc:
        raise _credentials_error("Jeton invalide ou expiré") from exc
    admin = db.get(AdminUser, int(payload["sub"]))
    if admin is None or not admin.is_active:
        raise _credentials_error("Compte administrateur inactif")
    return admin
