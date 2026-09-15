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


@api_router.get("/api/v1/health/model")
async def model_health():
    from app.main import app_state
    vlm = app_state.get("extraction_service")
    initialized = vlm.vlm_ready if vlm else False
    return {
        "status": "healthy" if initialized else "model_not_loaded",
        "model_initialized": initialized,
    }
