from __future__ import annotations

from pathlib import Path
from typing import Optional

from app.core.logging import get_logger, log_duration
from app.schemas.lead import Lead
from app.services.normalization_service import NormalizationService
from app.services.vlm_service import VLMService
from app.utils.file_utils import create_temp_path, cleanup_file

from app.services.image_service import ImageService

logger = get_logger(__name__)


class ExtractionService:
    """Orchestrates the full extraction pipeline: image -> VLM -> parse -> normalize -> Lead."""

    def __init__(self, vlm_service: VLMService) -> None:
        self._vlm = vlm_service
        self._normalizer = NormalizationService()
        self._image_service = ImageService()

    @property
    def vlm_ready(self) -> bool:
        return self._vlm.is_initialized

    def extract_lead(self, image_content: bytes, filename: str) -> Lead:
        temp_path: Optional[Path] = None
        try:
            temp_path = self._image_service.optimize_and_save_temp(image_content, filename)

            with log_duration(logger, f"VLM extraction for {filename}", filename=filename):
                raw_data = self._vlm.extract_from_image(str(temp_path))

            normalized = self._normalizer.normalize_lead(raw_data)
            
            safe_lead_fields = {
                "first_name": str(normalized.get("first_name")) if normalized.get("first_name") is not None else None,
                "last_name": str(normalized.get("last_name")) if normalized.get("last_name") is not None else None,
                "position": str(normalized.get("position")) if normalized.get("position") is not None else None,
                "company": str(normalized.get("company")) if normalized.get("company") is not None else None,
                "location": str(normalized.get("location")) if normalized.get("location") is not None else None,
                "phone": str(normalized.get("phone")) if normalized.get("phone") is not None else None,
                "email": str(normalized.get("email")) if normalized.get("email") is not None else None,
            }
            lead = Lead(**safe_lead_fields)

            logger.info("Successfully extracted lead from %s", filename)
            return lead

        except Exception as e:
            logger.error("Extraction failed for %s: %s", filename, e)
            raise

        finally:
            if temp_path:
                cleanup_file(temp_path)

