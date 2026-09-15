from __future__ import annotations

from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.upload import router as upload_router
from app.api.routes.leads import router as leads_router
from app.api.routes.export import router as export_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(upload_router)
api_router.include_router(leads_router)
api_router.include_router(export_router)


