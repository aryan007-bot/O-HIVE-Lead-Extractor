from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.exceptions import ExportError
from app.core.logging import get_logger, log_duration
from app.models.lead import get_db
from app.repositories.lead_repository import LeadRepository
from app.schemas.lead import LeadResponse
from app.services.export_service import ExportService

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1/export", tags=["export"])

_export_service = ExportService()


def _get_repo(db: Session = Depends(get_db)) -> LeadRepository:
    return LeadRepository(db)


@router.get("/excel")
async def export_excel(
    repo: LeadRepository = Depends(_get_repo),
):
    leads_orm = repo.get_all_leads()

    if not leads_orm:
        raise HTTPException(status_code=404, detail="No leads to export")

    leads = [LeadResponse.model_validate(l) for l in leads_orm]

    with log_duration(logger, "Excel export API"):
        content = _export_service.generate_excel(leads)

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="ohive_leads.xlsx"',
        },
    )
