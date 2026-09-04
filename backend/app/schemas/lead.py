from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.lead import LeadQueue, LeadStatus

Language = Literal["fr", "en"]


class _AntiSpam(BaseModel):
    """Honeypot invisible (CDC FOR-04) : le champ `website` doit rester vide."""

    website: str = ""


class CatalogueLeadCreate(_AntiSpam):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    company: str = Field(min_length=1, max_length=255)
    email: EmailStr
    country: str = Field(min_length=1, max_length=100)
    role: str | None = None
    phone: str | None = None
    rgpd_consent: bool
    language: Language = "fr"


class DevisLeadCreate(_AntiSpam):
    company: str = Field(min_length=1, max_length=255)
    contact: str = Field(min_length=1, max_length=255)
    email: EmailStr
    country: str = Field(min_length=1, max_length=100)
    sector: str | None = None
    products: list[str] = Field(min_length=1)
    volume: str | None = None
    packaging: str | None = None
    incoterm: str | None = None
    forecast: str | None = None
    certifications: list[str] = []
    transport_needed: bool = False
    delivery_delay: str | None = None
    delivery_continent: str | None = None
    delivery_place: str | None = None
    delivery_contact: str | None = None
    language: Language = "fr"


class SourcingLeadCreate(_AntiSpam):
    company: str = Field(min_length=1, max_length=255)
    contact: str = Field(min_length=1, max_length=255)
    email: EmailStr
    country: str = Field(min_length=1, max_length=100)
    sector: str | None = None
    product: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    origin: str | None = None
    volume: str | None = None
    budget: str | None = None
    quality_level: str | None = None
    forecast: str | None = None
    incoterm: str | None = None
    other_need: str | None = None
    certifications: list[str] = []
    transport_needed: bool = False
    delivery_delay: str | None = None
    delivery_continent: str | None = None
    delivery_place: str | None = None
    delivery_contact: str | None = None
    language: Language = "fr"


class CandidatureCreate(_AntiSpam):
    company: str = Field(min_length=1, max_length=255)
    contact_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone: str | None = None
    country: str = Field(min_length=1, max_length=100)
    city: str | None = None
    product_types: list[str] = []
    volumes: str | None = None
    certifications: list[str] = []
    rgpd_consent: bool
    language: Language = "fr"


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    queue: LeadQueue
    status: LeadStatus
    language: str
    company: str
    contact_name: str
    email: str
    phone: str | None
    country: str
    payload: dict
    catalogue_downloaded_at: datetime | None = None
    catalogue_download_count: int = 0
    created_at: datetime
    updated_at: datetime


class LeadStatusUpdate(BaseModel):
    status: LeadStatus


class CatalogueLeadResponse(BaseModel):
    id: int
    download_url: str
