from __future__ import annotations

from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool
    from app.models.lead import Base, get_db

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    with patch("app.main.VLMService") as MockVLM, \
         patch("app.main.ExtractionService"):
        mock_vlm = MagicMock()
        mock_vlm.is_initialized = False
        MockVLM.return_value = mock_vlm

        from app.main import create_app
        app = create_app()
        app.dependency_overrides[get_db] = override_get_db
        with TestClient(app) as c:
            yield c
        app.dependency_overrides.clear()


def test_export_no_leads(client):
    response = client.get("/api/v1/export/excel")
    assert response.status_code == 404


def test_export_with_leads(client):
    from app.schemas.lead import LeadResponse
    from datetime import datetime, timezone

    mock_lead = LeadResponse(
        id=1,
        first_name="John",
        last_name="Doe",
        position="CEO",
        company="Acme",
        location="NYC",
        phone="+1-555-0100",
        email="john@acme.com",
        status="extracted",
        extraction_quality="complete",
        source_filename="card.jpg",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    with patch("app.api.routes.export.LeadRepository") as MockRepo:
        mock_instance = MagicMock()
        mock_instance.get_all_leads.return_value = [MagicMock()]
        MockRepo.return_value = mock_instance

        with patch("app.api.routes.export.LeadResponse.model_validate", return_value=mock_lead):
            response = client.get("/api/v1/export/excel")
            assert response.status_code == 200
            assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            assert len(response.content) > 0
