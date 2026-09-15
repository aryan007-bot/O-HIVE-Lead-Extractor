from __future__ import annotations

from typing import Optional

from app.core.logging import get_logger

logger = get_logger(__name__)


class NormalizationService:
    """Normalizes extracted text fields from VLM output."""

    def normalize_email(self, email: Optional[str]) -> Optional[str]:
        if not email:
            return None
        email = email.strip()
        email = email.strip(".,;:'\"()[]{}!#$%&*+/=?^_`|~")
        email = email.lower()
        if "@" not in email:
            logger.debug("Normalized email has no @, discarding: %s", email)
            return None
        return email

    def normalize_phone(self, phone: Optional[str]) -> Optional[str]:
        if not phone:
            return None
        phone = phone.strip()
        phone = " ".join(phone.split())
        return phone if phone else None

    def normalize_name(self, name: Optional[str]) -> Optional[str]:
        if not name:
            return None
        name = name.strip()
        name = " ".join(name.split())
        return name if name else None

    def normalize_text(self, text: Optional[str]) -> Optional[str]:
        if not text:
            return None
        text = text.strip()
        text = " ".join(text.split())
        return text if text else None

    def normalize_lead(self, data: dict) -> dict:
        return {
            "first_name": self.normalize_name(data.get("first_name")),
            "last_name": self.normalize_name(data.get("last_name")),
            "position": self.normalize_text(data.get("position")),
            "company": self.normalize_text(data.get("company")),
            "location": self.normalize_text(data.get("location")),
            "phone": self.normalize_phone(data.get("phone")),
            "email": self.normalize_email(data.get("email")),
        }
