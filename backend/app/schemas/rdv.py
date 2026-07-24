from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RdvCreate(BaseModel):
    duration_minutes: Literal[15, 30] = 30
    motif: str | None = None
    day: date
    slot: str = Field(pattern=r"^\d{2}:\d{2}$")
    name: str = Field(min_length=1, max_length=255)
    company: str = Field(min_length=1, max_length=255)
    email: EmailStr
    timezone: str = "Europe/Paris"
    language: Literal["fr", "en"] = "fr"


class RdvOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: str
    email: str
    duration_minutes: int
    motif: str | None
    day: date
    slot: str
    timezone: str
    status: str
    created_at: datetime


class SlotsOut(BaseModel):
    day: date
    slots: list[str]


class RdvStatusUpdate(BaseModel):
    status: Literal["confirmé", "annulé"]
