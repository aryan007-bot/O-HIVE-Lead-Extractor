from __future__ import annotations

import json
import re
from typing import Any, Dict, Optional

from app.core.exceptions import JSONParsingError
from app.core.logging import get_logger

logger = get_logger(__name__)

CODE_FENCE_PATTERN = re.compile(r"```(?:json)?\s*\n?(.*?)\n?\s*```", re.DOTALL)
JSON_OBJECT_PATTERN = re.compile(r"\{.*\}", re.DOTALL)


def extract_json_from_text(text: str) -> Dict[str, Any]:
    text = text.strip()
    if not text:
        raise JSONParsingError("Empty model output")

    match = CODE_FENCE_PATTERN.search(text)
    if match:
        text = match.group(1).strip()

    match = JSON_OBJECT_PATTERN.search(text)
    if match:
        text = match.group(0)

    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        logger.error("JSON parsing failed: %s", e)
        raise JSONParsingError(f"Invalid JSON: {e}") from e

    if not isinstance(data, dict):
        raise JSONParsingError(f"Expected JSON object, got {type(data).__name__}")

    return data


def safe_json_dumps(data: Any, **kwargs) -> str:
    return json.dumps(data, ensure_ascii=False, **kwargs)
