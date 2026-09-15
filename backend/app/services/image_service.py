from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Optional

from PIL import Image

from app.core.config import get_settings
from app.core.exceptions import InvalidImageError
from app.core.logging import get_logger
from app.utils.validation import load_and_preprocess_image, validate_image_file

logger = get_logger(__name__)


class ImageService:
    """Handles image validation, loading, and preprocessing."""

    def validate(self, content: bytes, filename: str, content_type: Optional[str] = None) -> None:
        validate_image_file(content, filename, content_type)
        logger.debug("Image validated: %s (%d bytes)", filename, len(content))

    def load_image(self, content: bytes) -> Image.Image:
        return load_and_preprocess_image(content)

    def resize_if_needed(self, image: Image.Image, max_dim: int = 1024) -> Image.Image:
        w, h = image.size
        if max(w, h) <= max_dim:
            return image
        ratio = max_dim / max(w, h)
        new_size = (int(w * ratio), int(h * ratio))
        return image.resize(new_size, Image.LANCZOS)

    def save_temp(self, content: bytes, filename: str) -> Path:
        settings = get_settings()
        temp_dir = settings.temp_dir_path / "images"
        temp_dir.mkdir(parents=True, exist_ok=True)

        import uuid
        ext = Path(filename).suffix.lower() or ".bin"
        safe_name = f"{uuid.uuid4().hex[:12]}{ext}"
        path = temp_dir / safe_name
        path.write_bytes(content)
        return path
