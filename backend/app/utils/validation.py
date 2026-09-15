from __future__ import annotations

import mimetypes
from pathlib import Path
from typing import Optional

from PIL import Image

from app.core.config import get_settings
from app.core.exceptions import (
    FileTooLargeError,
    InvalidImageError,
    UnsupportedFileTypeError,
)
from app.core.logging import get_logger

logger = get_logger(__name__)

EXTENSION_MAP = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def validate_image_file(
    content: bytes,
    filename: str,
    content_type: Optional[str] = None,
) -> None:
    settings = get_settings()

    if not content or len(content) == 0:
        raise InvalidImageError("Uploaded file is empty.")

    if len(content) > settings.max_file_size_bytes:
        raise FileTooLargeError(
            f"File size ({len(content) / (1024*1024):.1f}MB) exceeds limit of {settings.MAX_FILE_SIZE_MB}MB."
        )

    ext = Path(filename).suffix.lower()
    detected_mime = mimetypes.guess_type(filename)[0]

    mime = content_type or detected_mime
    if ext in EXTENSION_MAP:
        mime = mime or EXTENSION_MAP[ext]

    if not mime or mime not in settings.allowed_image_types_list:
        raise UnsupportedFileTypeError(
            f"File type '{mime or ext}' is not supported. Allowed: {settings.ALLOWED_IMAGE_TYPES}"
        )

    try:
        from io import BytesIO
        img = Image.open(BytesIO(content))
        img.load()
    except Exception as e:
        raise InvalidImageError(f"File is not a valid image: {e}") from e


def load_and_preprocess_image(content: bytes) -> Image.Image:
    from io import BytesIO

    img = Image.open(BytesIO(content))

    if img.mode != "RGB":
        img = img.convert("RGB")

    return img
