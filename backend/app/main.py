from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import setup_logging, get_logger
from app.models.lead import init_db
from app.services.extraction_service import ExtractionService
from app.services.vlm_service import VLMService

setup_logging()
logger = get_logger(__name__)

app_state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    logger.info("Starting %s (env=%s)", settings.APP_NAME, settings.APP_ENV)

    try:
        init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.critical("Database initialization failed: %s", str(e))
        raise

    try:
        vlm_service = VLMService()
        app_state["vlm_service"] = vlm_service
        extraction_service = ExtractionService(vlm_service)
        app_state["extraction_service"] = extraction_service
    except Exception as e:
        logger.warning("VLM service initialization failed (non-fatal): %s", str(e))

    yield

    logger.info("Shutting down %s", settings.APP_NAME)
    if _engine := app_state.get("_engine"):
        _engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        description="O-HIVE VLM Business Card Lead Extraction API",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_origin_regex=r".*",
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    @app.middleware("http")
    async def add_cors_headers(request: Request, call_next):
        if request.method == "OPTIONS":
            from fastapi.responses import Response
            response = Response(status_code=200)
        else:
            response = await call_next(request)

        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Expose-Headers"] = "*"
        return response

    app.include_router(api_router)

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        logger.error("AppError: code=%s message=%s", exc.code, exc.message)
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                },
            },
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An internal server error occurred.",
                },
            },
        )

    return app


app = create_app()
