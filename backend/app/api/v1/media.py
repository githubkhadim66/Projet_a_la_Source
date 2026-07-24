"""Service des images stockées en local (repli quand S3 n'est pas configuré)."""

from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.core.config import settings

router = APIRouter()


@router.get("/media/{file_path:path}")
def serve_media(file_path: str):
    base = Path(settings.UPLOAD_DIR).resolve()
    target = (base / file_path).resolve()
    # Empêche toute remontée hors du dossier de dépôt
    if not target.is_relative_to(base) or not target.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image introuvable")
    return FileResponse(target, headers={"Cache-Control": "public, max-age=31536000, immutable"})
