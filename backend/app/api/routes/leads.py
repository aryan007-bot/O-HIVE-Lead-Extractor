from __future__ import annotations

import math
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.lead import get_db
from app.repositories.lead_repository import LeadRepository
from app.schemas.common import PaginatedResponse
from app.schemas.lead import LeadResponse, LeadUpdate, LeadStats

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1", tags=["leads"])


def _get_repo(db: Session = Depends(get_db)) -> LeadRepository:
    return LeadRepository(db)


@router.get("/leads/stats", response_model=LeadStats)
async def get_lead_stats(
    repo: LeadRepository = Depends(_get_repo),
):
    stats = repo.get_stats()
    return LeadStats(**stats)


@router.get("/leads/filters")
async def get_lead_filters(
    repo: LeadRepository = Depends(_get_repo),
):
    return {
        "positions": repo.get_distinct_values("position"),
        "locations": repo.get_distinct_values("location"),
        "companies": repo.get_distinct_values("company"),
    }


@router.get("/leads", response_model=PaginatedResponse)
async def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    quality: Optional[str] = Query(None),
    position: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    repo: LeadRepository = Depends(_get_repo),
):
    leads, total = repo.get_leads(
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        quality=quality,
        position=position,
        location=location,
        company=company,
    )
    pages = math.ceil(total / page_size) if page_size > 0 else 0

    items = [
        LeadResponse.model_validate(lead) for lead in leads
    ]

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: int,
    repo: LeadRepository = Depends(_get_repo),
):
    lead = repo.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return LeadResponse.model_validate(lead)


@router.patch("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    payload: LeadUpdate,
    repo: LeadRepository = Depends(_get_repo),
):
    existing = repo.get_lead(lead_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    updated = repo.update_lead(lead_id, update_data)
    return LeadResponse.model_validate(updated)


@router.delete("/leads/{lead_id}")
async def delete_lead(
    lead_id: int,
    repo: LeadRepository = Depends(_get_repo),
):
    deleted = repo.delete_lead(lead_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"success": True, "deleted": lead_id}


@router.delete("/leads")
async def delete_all_leads(
    repo: LeadRepository = Depends(_get_repo),
):
    count = repo.delete_all()
    return {"deleted": count}
