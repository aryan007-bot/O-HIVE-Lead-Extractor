from __future__ import annotations

from io import BytesIO
from unittest.mock import patch, MagicMock

import pytest
from PIL import Image
from fastapi.testclient import TestClient


def _make_image_bytes(fmt: str = "JPEG", size=(100, 100)) -> bytes:
    img = Image.new("RGB", size, color="white")
    buf = BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def _make_mock_extraction_service():
    from app.schemas.lead import Lead

    mock_extraction = MagicMock()
    mock_extraction.vlm_ready = True
    mock_extraction.extract_lead.return_value = Lead(
        first_name="John",
        last_name="Doe",
        position="CEO",
        company="Acme Corp",
        location="New York",
        phone="+1-555-0100",
        email="john@acme.com",
    )
    return mock_extraction


@pytest.fixture
def client():
    mock_extraction = _make_mock_extraction_service()

    with patch("app.main.init_db"), \
         patch("app.main.VLMService") as MockVLM, \
         patch("app.main.ExtractionService"):
        mock_vlm = MagicMock()
        mock_vlm.is_initialized = False
        MockVLM.return_value = mock_vlm

        from app.main import create_app
        import app.main as main_module
        app = create_app()

        with TestClient(app) as c:
            main_module.app_state["extraction_service"] = mock_extraction
            yield c


def test_upload_valid_jpeg(client):
    img_bytes = _make_image_bytes("JPEG")
    with patch("app.api.routes.upload.get_db") as mock_get_db, \
         patch("app.api.routes.upload.LeadRepository") as MockRepo:
        mock_db = MagicMock()
        mock_get_db.return_value = iter([mock_db])
        mock_instance = MagicMock()
        mock_instance.create_lead.return_value = MagicMock(id=1)
        MockRepo.return_value = mock_instance

        response = client.post(
            "/api/v1/upload",
            files=[("files", ("card.jpg", img_bytes, "image/jpeg"))],
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["successful"] == 1
        assert data["failed"] == 0
        assert data["results"][0]["status"] == "success"
        assert data["results"][0]["lead"]["first_name"] == "John"


def test_upload_valid_png(client):
    img_bytes = _make_image_bytes("PNG")
    with patch("app.api.routes.upload.get_db") as mock_get_db, \
         patch("app.api.routes.upload.LeadRepository") as MockRepo:
        mock_db = MagicMock()
        mock_get_db.return_value = iter([mock_db])
        mock_instance = MagicMock()
        mock_instance.create_lead.return_value = MagicMock(id=2)
        MockRepo.return_value = mock_instance

        response = client.post(
            "/api/v1/upload",
            files=[("files", ("card.png", img_bytes, "image/png"))],
        )
        assert response.status_code == 200
        data = response.json()
        assert data["successful"] == 1


def test_upload_unsupported_file(client):
    response = client.post(
        "/api/v1/upload",
        files=[("files", ("doc.pdf", b"fake pdf content", "application/pdf"))],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["failed"] == 1
    assert data["results"][0]["status"] == "failed"


def test_upload_empty_file(client):
    response = client.post(
        "/api/v1/upload",
        files=[("files", ("empty.jpg", b"", "image/jpeg"))],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["failed"] == 1


def test_upload_multiple_files(client):
    img1 = _make_image_bytes("JPEG")
    img2 = _make_image_bytes("PNG")
    with patch("app.api.routes.upload.get_db") as mock_get_db, \
         patch("app.api.routes.upload.LeadRepository") as MockRepo:
        mock_db = MagicMock()
        mock_get_db.return_value = iter([mock_db])
        mock_instance = MagicMock()
        mock_instance.create_lead.side_effect = [MagicMock(id=1), MagicMock(id=2)]
        MockRepo.return_value = mock_instance

        response = client.post(
            "/api/v1/upload",
            files=[
                ("files", ("card1.jpg", img1, "image/jpeg")),
                ("files", ("card2.png", img2, "image/png")),
            ],
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert data["successful"] == 2
