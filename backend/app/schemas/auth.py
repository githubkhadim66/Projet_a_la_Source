from typing import Literal

from pydantic import BaseModel, EmailStr


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UnifiedLogin(BaseModel):
    email: EmailStr
    password: str


class UnifiedTokenResponse(TokenResponse):
    role: Literal["admin", "supplier"]
    must_change_password: bool = False
