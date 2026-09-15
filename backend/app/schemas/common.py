from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Standard error response body."""

    success: bool = False
    error: ErrorDetail


class SuccessResponse(BaseModel):
    """Standard success response wrapper."""

    success: bool = True
    data: Any = None


class PaginatedResponse(BaseModel):
    """Paginated list response."""

    items: List[Any]
    total: int
    page: int
    page_size: int
    pages: int


class HealthResponse(BaseModel):
    status: str
    service: str
