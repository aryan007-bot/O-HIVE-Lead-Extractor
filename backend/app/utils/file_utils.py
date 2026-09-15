from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Optional

from app.core.config import get_settings


def generate_safe_filename(original_name: str, extension: Optional[str] = None) -> str:
    safe_id = uuid.uuid4().hex[:12]
    if extension:
        ext = extension if extension.startswith(".") else f".{extension}"
    else:
        ext = Path(original_name).suffix.lower() or ".bin"
    return f"{safe_id}{ext}"


def create_temp_path(filename: str, subdir: str = "") -> Path:
    settings = get_settings()
    base = settings.temp_dir_path
    if subdir:
        base = base / subdir
        base.mkdir(parents=True, exist_ok=True)
    safe_name = generate_safe_filename(filename)
    return base / safe_name


def cleanup_file(path: Path) -> None:
    try:
        if path.exists():
            path.unlink()
    except OSError:
        pass
