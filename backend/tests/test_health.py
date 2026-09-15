from __future__ import annotations

from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    with patch("app.main.init_db"), \
         patch("app.main.VLMService") as MockVLM, \
         patch("app.main.ExtractionService"):
        mock_vlm = MagicMock()
        mock_vlm.is_initialized = False
        MockVLM.return_value = mock_vlm

        from app.main import create_app
        app = create_app()
        with TestClient(app) as c:
            yield c


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "ohive-backend"

    v1_resp = client.get("/api/v1/health")
    assert v1_resp.status_code == 200
    v1_data = v1_resp.json()
    assert v1_data["status"] == "ok"
    assert v1_data["service"] == "ohive-backend"



def test_model_health_endpoint(client):
    response = client.get("/api/v1/health/model")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "model_initialized" in data
