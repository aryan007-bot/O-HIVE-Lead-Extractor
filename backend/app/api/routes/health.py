from __future__ import annotations

from fastapi import APIRouter

from app.schemas.common import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
@router.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", service="ohive-backend")


@router.get("/health/model")
@router.get("/api/v1/health/model")
async def model_health():
    from app.main import app_state
    extraction = app_state.get("extraction_service")
    initialized = extraction.vlm_ready if extraction else False
    return {
        "status": "ok" if initialized else "model_not_loaded",
        "service": "ohive-backend",
        "model_initialized": initialized,
    }

