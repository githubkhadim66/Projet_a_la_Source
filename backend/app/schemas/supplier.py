from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.product import ProposalStatus, StockStatus


class SupplierLogin(BaseModel):
    email: EmailStr
    password: str


class SupplierPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class SupplierSelfUpdate(BaseModel):
    """Champs que le fournisseur peut modifier lui-même (ni e-mail de connexion, ni catégories)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    contact_name: str | None = None
    phone: str | None = None
    country: str | None = None
    city: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SupplierOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    contact_name: str | None
    email: str
    phone: str | None
    country: str | None
    city: str | None
    categories: list
    is_active: bool
    last_login_at: datetime | None
    created_at: datetime
    products_count: int = 0


class SupplierWithTempPassword(SupplierOut):
    """Réponse de création / réinitialisation : le mot de passe temporaire n'est montré qu'une fois."""

    temp_password: str = ""


class SupplierCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    contact_name: str | None = None
    email: EmailStr
    phone: str | None = None
    country: str | None = None
    city: str | None = None
    categories: list[str] = []


class SupplierUpdate(BaseModel):
    name: str | None = None
    contact_name: str | None = None
    phone: str | None = None
    country: str | None = None
    city: str | None = None
    categories: list[str] | None = None
    is_active: bool | None = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    supplier_id: int
    ref: str
    name: str
    category: str | None
    origin: str | None
    moq: str
    image: str
    description: str
    benefits: str
    visible: bool
    featured: bool
    in_catalogue: bool
    catalogue_position: int
    stock_kg: int
    status: StockStatus
    delay: str
    price_per_kg: str = ""
    bulk_price: str = ""
    harvest_period: str = ""
    updated_at: datetime


class AdminProductOut(ProductOut):
    """Vue consolidée admin : ajoute le fournisseur et l'alerte fraîcheur (FRS-05/REF-02)."""

    supplier_name: str = ""
    stale: bool = False
    archived_at: datetime | None = None


class PublicProductOut(BaseModel):
    """Vitrine publique — jamais de fournisseur, de stock ni de prix (LP-05)."""

    model_config = ConfigDict(from_attributes=True)

    ref: str
    name: str
    category: str | None
    origin: str | None
    moq: str
    image: str
    description: str
    benefits: str
    featured: bool


class ProductCreate(BaseModel):
    supplier_id: int
    ref: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=255)
    category: str | None = None
    origin: str | None = None
    moq: str = ""
    image: str = ""
    description: str = ""
    benefits: str = ""
    visible: bool = True
    featured: bool = False
    in_catalogue: bool = True
    stock_kg: int = 0
    status: StockStatus = StockStatus.EN_STOCK
    delay: str = ""
    price_per_kg: str = ""
    bulk_price: str = ""
    harvest_period: str = ""


class ProductAdminUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    origin: str | None = None
    moq: str | None = None
    image: str | None = None
    description: str | None = None
    benefits: str | None = None
    visible: bool | None = None
    featured: bool | None = None
    in_catalogue: bool | None = None
    stock_kg: int | None = Field(default=None, ge=0)
    status: StockStatus | None = None
    delay: str | None = None
    price_per_kg: str | None = None
    bulk_price: str | None = None
    harvest_period: str | None = None


class CatalogueReorder(BaseModel):
    """Nouvel ordre du catalogue : la liste complète des identifiants, dans l'ordre voulu."""

    product_ids: list[int]


class ProductStockUpdate(BaseModel):
    """Seuls champs modifiables par le fournisseur (CDC FRS-02)."""

    stock_kg: int | None = Field(default=None, ge=0)
    status: StockStatus | None = None
    delay: str | None = Field(default=None, max_length=100)


class ProposalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    benefits: str = ""
    origin: str = ""
    category: str = ""
    moq: str = ""
    image: str = ""
    volumes: str | None = None
    price_per_kg: str = ""
    bulk_price: str = ""
    harvest_period: str = ""
    certifications: list[str] = []


class ProposalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    supplier_id: int
    name: str
    description: str
    benefits: str
    origin: str
    category: str
    moq: str
    image: str
    volumes: str | None
    price_per_kg: str = ""
    bulk_price: str = ""
    harvest_period: str = ""
    certifications: list
    status: ProposalStatus
    created_at: datetime
    supplier_name: str = ""


class ProposalDecision(BaseModel):
    status: ProposalStatus
