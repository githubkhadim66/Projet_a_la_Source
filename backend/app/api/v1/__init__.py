from fastapi import APIRouter

from app.api.v1 import admin, auth, catalogue, health, leads, media, rdv, suppliers

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(media.router, tags=["media"])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
api_router.include_router(catalogue.router, prefix="/catalogue", tags=["catalogue"])
api_router.include_router(rdv.router, prefix="/rdv", tags=["rdv"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
