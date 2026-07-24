from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from app.core.config import settings

ALGORITHM = "HS256"

# Alphabet sans caractères ambigus (0/O, 1/I/l)
_PASSWORD_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def generate_temp_password(length: int = 10) -> str:
    """Mot de passe temporaire lisible, généré pour les comptes fournisseurs."""
    import secrets

    return "".join(secrets.choice(_PASSWORD_ALPHABET) for _ in range(length))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except ValueError:
        return False


def create_token(subject: str, purpose: str, expires_minutes: int, extra: dict[str, Any] | None = None) -> str:
    payload: dict[str, Any] = {
        "sub": subject,
        "purpose": purpose,
        "exp": datetime.now(UTC) + timedelta(minutes=expires_minutes),
        "iat": datetime.now(UTC),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str, purpose: str) -> dict[str, Any]:
    """Décode et vérifie un JWT ; lève jwt.InvalidTokenError si invalide ou mauvais usage."""
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("purpose") != purpose:
        raise jwt.InvalidTokenError("Usage de jeton invalide")
    return payload
