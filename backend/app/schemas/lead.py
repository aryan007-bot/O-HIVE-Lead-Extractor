from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LeadStatus(str, Enum):
    processing = "processing"
    extracted = "extracted"
    reviewed = "reviewed"
    edited = "edited"
    failed = "failed"


class ExtractionQuality(str, Enum):
    complete = "complete"
    partial = "partial"
    failed = "failed"


class Lead(BaseModel):
    """Extracted business card lead data."""

    first_name: Optional[str] = Field(default=None, description="First name from the business card")
    last_name: Optional[str] = Field(default=None, description="Last name from the business card")
    position: Optional[str] = Field(default=None, description="Position / Job Title")
    company: Optional[str] = Field(default=None, description="Company name")
    location: Optional[str] = Field(default=None, description="Location / Address")
    phone: Optional[str] = Field(default=None, description="Phone number")
    email: Optional[str] = Field(default=None, description="Email address")

    model_config = ConfigDict(str_strip_whitespace=True)


class LeadUpdate(BaseModel):
    """Fields that can be updated on a lead."""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class LeadResponse(BaseModel):
    """Lead with metadata for API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: str = "extracted"
    extraction_quality: str = "partial"
    source_filename: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LeadStats(BaseModel):
    """Aggregate statistics for leads."""

    total: int
    complete: int
    partial: int
    failed: int
