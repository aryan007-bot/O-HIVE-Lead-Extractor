from __future__ import annotations

import asyncio
import time
from typing import List

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException

from app.core.config import get_settings
from app.core.exceptions import (
    AppError,
    InvalidImageError,
    TooManyFilesError,
)
from app.core.logging import get_logger, log_duration
from app.models.lead import get_db
from app.repositories.lead_repository import LeadRepository
from app.schemas.processing import BulkProcessingResponse, ProcessingResult
from app.services.extraction_service import ExtractionService
from app.services.image_service import ImageService

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1", tags=["upload"])

_semaphore = None


def _get_semaphore() -> asyncio.Semaphore:
    global _semaphore
    if _semaphore is None:
        settings = get_settings()
        _semaphore = asyncio.Semaphore(settings.VLM_MAX_CONCURRENCY)
    return _semaphore


def _get_extraction_service() -> ExtractionService:
    from app.main import app_state
    return app_state["extraction_service"]


def _get_image_service() -> ImageService:
    return ImageService()


def _calculate_quality(lead_data: dict) -> str:
    has_name = bool(lead_data.get("first_name") or lead_data.get("last_name"))
    has_company = bool(lead_data.get("company"))
    has_contact = bool(lead_data.get("email") or lead_data.get("phone"))
    has_position = bool(lead_data.get("position"))
    has_location = bool(lead_data.get("location"))

    if not (has_name or has_company or has_contact or has_position or has_location):
        return "failed"

    required_fields = ["first_name", "last_name", "position", "company", "location", "phone", "email"]
    filled = sum(1 for f in required_fields if lead_data.get(f) and str(lead_data.get(f)).strip())
    if filled >= 4:
        return "complete"
    return "partial"


def _process_single_file_sync(
    file_content: bytes,
    filename: str,
    content_type: str,
    extraction_service: ExtractionService,
    image_service: ImageService,
) -> ProcessingResult:
    try:
        image_service.validate(file_content, filename, content_type)

        with log_duration(logger, f"Processing {filename}", filename=filename):
            lead = extraction_service.extract_lead(file_content, filename)

        quality = _calculate_quality(lead.model_dump())
        if quality == "failed":
            return ProcessingResult(
                filename=filename,
                status="failed",
                error="Could not extract contact information from business card.",
                extraction_quality="failed",
            )

        logger.info("Success processing %s (quality=%s)", filename, quality)
        return ProcessingResult(
            filename=filename,
            status="success",
            lead=lead,
            extraction_quality=quality,
        )

    except AppError as e:
        logger.warning("Failed processing %s: %s", filename, e.message)
        return ProcessingResult(
            filename=filename,
            status="failed",
            error=e.message,
        )
    except Exception as e:
        logger.error("Unexpected error processing %s: %s", filename, e)
        return ProcessingResult(
            filename=filename,
            status="failed",
            error="An unexpected error occurred during processing.",
        )


async def _process_single_file(
    file: UploadFile,
    extraction_service: ExtractionService,
    image_service: ImageService,
) -> ProcessingResult:
    content = await file.read()
    filename = file.filename or "unknown"
    content_type = file.content_type or "application/octet-stream"

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        _process_single_file_sync,
        content,
        filename,
        content_type,
        extraction_service,
        image_service,
    )


@router.post("/upload", response_model=BulkProcessingResponse)
async def upload_business_cards(
    files: List[UploadFile] = File(..., description="Business card images"),
):
    settings = get_settings()

    if len(files) > settings.MAX_BULK_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. Maximum is {settings.MAX_BULK_FILES}.",
        )

    extraction_service = _get_extraction_service()
    image_service = _get_image_service()
    semaphore = _get_semaphore()

    async def _bounded_process(f: UploadFile) -> ProcessingResult:
        async with semaphore:
            return await _process_single_file(f, extraction_service, image_service)

    results = await asyncio.gather(*[_bounded_process(f) for f in files])

    successful = sum(1 for r in results if r.status == "success")
    failed = len(results) - successful

    db = next(get_db())
    try:
        repo = LeadRepository(db)
        for result in results:
            if result.status == "success" and result.lead:
                lead_data = result.lead.model_dump()
                quality = _calculate_quality(lead_data)
                orm = repo.create_lead(
                    lead_data={
                        "first_name": lead_data.get("first_name"),
                        "last_name": lead_data.get("last_name"),
                        "position": lead_data.get("position"),
                        "company": lead_data.get("company"),
                        "location": lead_data.get("location"),
                        "phone": lead_data.get("phone"),
                        "email": lead_data.get("email"),
                        "status": "extracted",
                        "extraction_quality": quality,
                    },
                    source_filename=result.filename,
                )
                result.lead_id = orm.id
                logger.info("Persisted lead id=%d from %s", orm.id, result.filename)
            elif result.status == "failed":
                logger.info("Skipping database persistence for failed extraction %s", result.filename)
    finally:
        db.close()

    return BulkProcessingResponse(
        total=len(results),
        successful=successful,
        failed=failed,
        results=list(results),
    )
