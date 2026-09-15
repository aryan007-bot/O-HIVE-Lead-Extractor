from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
@router.get("/api/v1/health")
async def health_check():
    from app.models.lead import check_db_health
    db_health = check_db_health()
    db_ok = db_health.get("status") == "connected"

    if not db_ok:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "service": "ohive-backend",
                "database": db_health,
            },
        )

    return {
        "status": "ok",
        "service": "ohive-backend",
        "database": db_health,
    }


@router.get("/health/model")
@router.get("/api/v1/health/model")
async def model_health():
    from app.main import app_state
    from app.models.lead import check_db_health

    db_health = check_db_health()
    db_ok = db_health.get("status") == "connected"
    extraction = app_state.get("extraction_service")
    initialized = bool(extraction.vlm_ready) if extraction else False

    overall_status = "ok" if (initialized and db_ok) else "degraded"
    status_code = 200 if overall_status == "ok" else 503

    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=status_code,
        content={
            "status": overall_status,
            "service": "ohive-backend",
            "model_initialized": initialized,
            "database": db_health,
        },
    )

