from __future__ import annotations

from pathlib import Path
from typing import Optional

from app.core.logging import get_logger, log_duration
from app.schemas.lead import Lead
from app.services.normalization_service import NormalizationService
from app.services.vlm_service import VLMService
from app.utils.file_utils import create_temp_path, cleanup_file

logger = get_logger(__name__)


class ExtractionService:
    """Orchestrates the full extraction pipeline: image -> VLM -> parse -> normalize -> Lead."""

    def __init__(self, vlm_service: VLMService) -> None:
        self._vlm = vlm_service
        self._normalizer = NormalizationService()

    @property
    def vlm_ready(self) -> bool:
        return self._vlm.is_initialized

    def extract_lead(self, image_content: bytes, filename: str) -> Lead:
        temp_path: Optional[Path] = None
        try:
            temp_path = create_temp_path(filename, subdir="vlm")
            temp_path.write_bytes(image_content)

            with log_duration(logger, f"VLM extraction for {filename}", filename=filename):
                raw_data = self._vlm.extract_from_image(str(temp_path))

            normalized = self._normalizer.normalize_lead(raw_data)
            lead = Lead(**normalized)

            logger.info("Successfully extracted lead from %s", filename)
            return lead

        except Exception as e:
            logger.error("Extraction failed for %s: %s", filename, e)
            raise

        finally:
            if temp_path:
                cleanup_file(temp_path)
