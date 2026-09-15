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


def test_list_leads_empty(client):
    response = client.get("/api/v1/leads")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


def test_get_lead_not_found(client):
    response = client.get("/api/v1/leads/999")
    assert response.status_code == 404


def test_get_lead_stats(client):
    response = client.get("/api/v1/leads/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "complete" in data
    assert "partial" in data
    assert "failed" in data


def test_get_lead_filters(client):
    response = client.get("/api/v1/leads/filters")
    assert response.status_code == 200
    data = response.json()
    assert "positions" in data
    assert "locations" in data
    assert "companies" in data


def test_update_lead_not_found(client):
    response = client.patch("/api/v1/leads/999", json={"first_name": "Test"})
    assert response.status_code == 404


def test_delete_lead_not_found(client):
    response = client.delete("/api/v1/leads/999")
    assert response.status_code == 404
