from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration de l'application, surchargée par variables d'environnement / .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Général
    APP_NAME: str = "À la Source API"
    ENVIRONMENT: str = "development"  # development | staging | production
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Base de données (Postgres en staging/prod, SQLite par défaut en dev)
    DATABASE_URL: str = "sqlite:///./alasource.db"

    # Sécurité
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8
    MAGIC_LINK_EXPIRE_MINUTES: int = 30
    CATALOGUE_LINK_EXPIRE_MINUTES: int = 60 * 24

    # CORS (origines du front, séparées par des virgules)
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8080"

    # Catalogue PDF (CATA-04 : fichier remplaçable sans redéploiement)
    CATALOGUE_PDF_PATH: str = "./data/catalogue.pdf"

    # Stockage des images produits — S3 si configuré, disque local sinon
    S3_BUCKET: str = ""
    S3_ENDPOINT_URL: str = ""   # vide pour AWS ; renseigné pour Scaleway, OVH, MinIO…
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_REGION: str = "eu-west-3"
    S3_PUBLIC_URL: str = ""     # base publique (CDN) ; déduite du bucket si vide
    UPLOAD_DIR: str = "./data/uploads"

    # E-mails transactionnels (E1/E2/E3) — backend "console" par défaut
    EMAIL_BACKEND: str = "console"  # console | smtp
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "contact@alasource.example"
    NOTIFY_INTERNAL_EMAIL: str = "equipe@alasource.example"

    # Front (utilisé dans les liens des e-mails)
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def s3_enabled(self) -> bool:
        return bool(self.S3_BUCKET and self.S3_ACCESS_KEY and self.S3_SECRET_KEY)

    @property
    def s3_public_base(self) -> str:
        if self.S3_PUBLIC_URL:
            return self.S3_PUBLIC_URL
        if self.S3_ENDPOINT_URL:
            return f"{self.S3_ENDPOINT_URL.rstrip('/')}/{self.S3_BUCKET}"
        return f"https://{self.S3_BUCKET}.s3.{self.S3_REGION}.amazonaws.com"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
