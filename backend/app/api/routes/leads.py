from __future__ import annotations

import math
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.lead import get_db
from app.repositories.lead_repository import LeadRepository
from app.schemas.common import PaginatedResponse
from app.schemas.lead import LeadResponse, LeadUpdate, LeadStats

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["leads"])


def _get_repo(db: Session = Depends(get_db)) -> LeadRepository:
    return LeadRepository(db)


@router.get("/leads/stats", response_model=LeadStats)
async def get_lead_stats(
    repo: LeadRepository = Depends(_get_repo),
):
    try:
        stats = repo.get_stats()
        return LeadStats(**stats)
    except SQLAlchemyError as e:
        logger.error("Database error in get_lead_stats: %s", str(e))
        raise HTTPException(
            status_code=503,
            detail="Database temporarily unavailable. Please try again."
        )


@router.get("/leads/filters")
async def get_lead_filters(
    repo: LeadRepository = Depends(_get_repo),
):
    try:
        return {
            "positions": repo.get_distinct_values("position"),
            "locations": repo.get_distinct_values("location"),
            "companies": repo.get_distinct_values("company"),
        }
    except SQLAlchemyError as e:
        logger.error("Database error in get_lead_filters: %s", str(e))
        raise HTTPException(
            status_code=503,
            detail="Database temporarily unavailable. Please try again."
        )


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
    try:
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
    except SQLAlchemyError as e:
        logger.error("Database error in list_leads: %s", str(e))
        raise HTTPException(
            status_code=503,
            detail="Database temporarily unavailable. Please try again."
        )


@router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: int,
    repo: LeadRepository = Depends(_get_repo),
):
    try:
        lead = repo.get_lead(lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        return LeadResponse.model_validate(lead)
    except SQLAlchemyError as e:
        logger.error("Database error in get_lead: %s", str(e))
        raise HTTPException(
            status_code=503,
            detail="Database temporarily unavailable. Please try again."
        )


@router.patch("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    payload: LeadUpdate,
    repo: LeadRepository = Depends(_get_repo),
):
    try:
        existing = repo.get_lead(lead_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Lead not found")

        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        updated = repo.update_lead(lead_id, update_data)
        return LeadResponse.model_validate(updated)
    except SQLAlchemyError as e:
        logger.error("Database error in update_lead: %s", str(e))
        raise HTTPException(
            status_code=503,
            detail="Database temporarily unavailable. Please try again."
        )


@router.delete("/leads/{lead_id}")
async def delete_lead(
    lead_id: int,
    repo: LeadRepository = Depends(_get_repo),
):
    try:
        deleted = repo.delete_lead(lead_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Lead not found")
        return {"success": True, "deleted": lead_id}
    except SQLAlchemyError as e:
        logger.error("Database error in delete_lead: %s", str(e))
        raise HTTPException(
            status_code=503,
            detail="Database temporarily unavailable. Please try again."
        )


@router.delete("/leads")
async def delete_all_leads(
    repo: LeadRepository = Depends(_get_repo),
):
    try:
        count = repo.delete_all()
        return {"deleted": count}
    except SQLAlchemyError as e:
        logger.error("Database error in delete_all_leads: %s", str(e))
        raise HTTPException(
            status_code=503,
            detail="Database temporarily unavailable. Please try again."
        )
