from __future__ import annotations

import math
import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import func, or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.lead import LeadORM

logger = logging.getLogger(__name__)


class LeadRepository:
    """Repository for lead CRUD operations."""

    def __init__(self, db: Session) -> None:
        self._db = db

    def create_lead(self, lead_data: dict, source_filename: Optional[str] = None) -> LeadORM:
        orm = LeadORM(**lead_data, source_filename=source_filename)
        self._db.add(orm)
        self._db.commit()
        self._db.refresh(orm)
        return orm

    def create_many(self, leads: List[dict], source_filename: Optional[str] = None) -> List[LeadORM]:
        orms = []
        for data in leads:
            orm = LeadORM(**data, source_filename=source_filename)
            self._db.add(orm)
            orms.append(orm)
        self._db.commit()
        for orm in orms:
            self._db.refresh(orm)
        return orms

    def get_lead(self, lead_id: int) -> Optional[LeadORM]:
        try:
            return self._db.query(LeadORM).filter(LeadORM.id == lead_id).first()
        except SQLAlchemyError as e:
            logger.error("Database error in get_lead: %s", str(e))
            self._db.rollback()
            raise

    def get_leads(
        self,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        status: Optional[str] = None,
        quality: Optional[str] = None,
        position: Optional[str] = None,
        location: Optional[str] = None,
        company: Optional[str] = None,
    ) -> Tuple[List[LeadORM], int]:
        try:
            query = self._db.query(LeadORM)

            if search:
                like_pattern = f"%{search}%"
                query = query.filter(
                    or_(
                        LeadORM.first_name.ilike(like_pattern),
                        LeadORM.last_name.ilike(like_pattern),
                        LeadORM.position.ilike(like_pattern),
                        LeadORM.company.ilike(like_pattern),
                        LeadORM.location.ilike(like_pattern),
                        LeadORM.phone.ilike(like_pattern),
                        LeadORM.email.ilike(like_pattern),
                    )
                )

            if status and status != "all":
                query = query.filter(LeadORM.status == status)

            if quality and quality != "all":
                query = query.filter(LeadORM.extraction_quality == quality)

            if position:
                query = query.filter(LeadORM.position.ilike(f"%{position}%"))

            if location:
                query = query.filter(LeadORM.location.ilike(f"%{location}%"))

            if company:
                query = query.filter(LeadORM.company.ilike(f"%{company}%"))

            total = query.count()
            offset = (page - 1) * page_size
            leads = query.order_by(LeadORM.created_at.desc()).offset(offset).limit(page_size).all()
            return leads, total
        except SQLAlchemyError as e:
            logger.error("Database error in get_leads: %s", str(e))
            self._db.rollback()
            raise

    def get_all_leads(self) -> List[LeadORM]:
        try:
            return self._db.query(LeadORM).order_by(LeadORM.created_at.desc()).all()
        except SQLAlchemyError as e:
            logger.error("Database error in get_all_leads: %s", str(e))
            self._db.rollback()
            raise

    def update_lead(self, lead_id: int, update_data: dict) -> Optional[LeadORM]:
        try:
            orm = self._db.query(LeadORM).filter(LeadORM.id == lead_id).first()
            if not orm:
                return None

            for key, value in update_data.items():
                if hasattr(orm, key) and value is not None:
                    setattr(orm, key, value)

            orm.status = "edited"
            orm.updated_at = datetime.now(timezone.utc)
            self._db.commit()
            self._db.refresh(orm)
            return orm
        except SQLAlchemyError as e:
            logger.error("Database error in update_lead: %s", str(e))
            self._db.rollback()
            raise

    def delete_lead(self, lead_id: int) -> bool:
        try:
            orm = self._db.query(LeadORM).filter(LeadORM.id == lead_id).first()
            if not orm:
                return False
            self._db.delete(orm)
            self._db.commit()
            return True
        except SQLAlchemyError as e:
            logger.error("Database error in delete_lead: %s", str(e))
            self._db.rollback()
            raise

    def delete_many(self, lead_ids: List[int]) -> int:
        try:
            count = self._db.query(LeadORM).filter(LeadORM.id.in_(lead_ids)).delete(synchronize_session=False)
            self._db.commit()
            return count
        except SQLAlchemyError as e:
            logger.error("Database error in delete_many: %s", str(e))
            self._db.rollback()
            raise

    def delete_all(self) -> int:
        try:
            count = self._db.query(LeadORM).delete()
            self._db.commit()
            return count
        except SQLAlchemyError as e:
            logger.error("Database error in delete_all: %s", str(e))
            self._db.rollback()
            raise

    def get_stats(self) -> dict:
        try:
            total = self._db.query(LeadORM).count()
            complete = self._db.query(LeadORM).filter(LeadORM.extraction_quality == "complete").count()
            partial = self._db.query(LeadORM).filter(LeadORM.extraction_quality == "partial").count()
            failed = self._db.query(LeadORM).filter(LeadORM.extraction_quality == "failed").count()
            return {"total": total, "complete": complete, "partial": partial, "failed": failed}
        except SQLAlchemyError as e:
            logger.error("Database error in get_stats: %s", str(e))
            self._db.rollback()
            raise

    def get_distinct_values(self, field_name: str) -> List[str]:
        try:
            column = getattr(LeadORM, field_name, None)
            if column is None:
                return []
            values = (
                self._db.query(column)
                .filter(column.isnot(None))
                .distinct()
                .order_by(column)
                .all()
            )
            return [v[0] for v in values if v[0]]
        except SQLAlchemyError as e:
            logger.error("Database error in get_distinct_values: %s", str(e))
            self._db.rollback()
            raise
