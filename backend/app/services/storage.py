"""Stockage des images produits.

En production, les fichiers vont dans un bucket S3 (AWS, Scaleway, OVH, MinIO…).
Si aucun bucket n'est configuré, on retombe sur le disque local afin que le
téléversement fonctionne immédiatement en développement.
"""

import logging
import mimetypes
import uuid
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger("alasource.storage")

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/avif"}
MAX_BYTES = 5 * 1024 * 1024  # 5 Mo


class StorageError(Exception):
    """Erreur fonctionnelle de téléversement (type, taille, indisponibilité)."""


def _extension(filename: str, content_type: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp", ".avif"}:
        return suffix
    return mimetypes.guess_extension(content_type) or ".jpg"


def validate(content: bytes, content_type: str) -> None:
    if content_type not in ALLOWED_TYPES:
        raise StorageError("Format non accepté — utilisez une image JPG, PNG, WebP ou AVIF.")
    if len(content) > MAX_BYTES:
        raise StorageError(f"Image trop lourde ({len(content) // 1024 // 1024} Mo) — 5 Mo maximum.")
    if not content:
        raise StorageError("Fichier vide.")


def upload_product_image(content: bytes, filename: str, content_type: str) -> str:
    """Enregistre l'image et renvoie l'URL publique à stocker sur le produit."""
    validate(content, content_type)
    key = f"produits/{uuid.uuid4().hex}{_extension(filename, content_type)}"

    if settings.s3_enabled:
        import boto3  # importé à la demande : inutile quand le stockage local suffit

        client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL or None,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
        )
        try:
            client.put_object(
                Bucket=settings.S3_BUCKET,
                Key=key,
                Body=content,
                ContentType=content_type,
                CacheControl="public, max-age=31536000, immutable",
            )
        except Exception as exc:
            logger.exception("Téléversement S3 impossible")
            raise StorageError("Le stockage cloud est indisponible — réessayez.") from exc
        return f"{settings.s3_public_base.rstrip('/')}/{key}"

    # Repli : disque local, servi par /api/v1/media
    destination = Path(settings.UPLOAD_DIR) / key
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)
    logger.info("Image enregistrée en local (S3 non configuré) : %s", key)
    return f"{settings.API_V1_PREFIX}/media/{key}"
