from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.lead import Lead


class ProcessingResult(BaseModel):
    """Result of processing a single business card image."""

    filename: str
    status: str = Field(description="'success' or 'failed'")
    lead: Optional[Lead] = None
    lead_id: Optional[int] = None
    extraction_quality: Optional[str] = None
    error: Optional[str] = None


class BulkProcessingResponse(BaseModel):
    """Response for bulk image processing."""

    total: int
    successful: int
    failed: int
    results: List[ProcessingResult]


class ProcessingStatus(BaseModel):
    """Current processing status."""

    is_processing: bool = False
    total_queued: int = 0
    total_processed: int = 0
