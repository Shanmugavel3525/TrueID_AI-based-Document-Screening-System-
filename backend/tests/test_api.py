import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["problem_statement"] == "26188"

def test_auth_login_success():
    response = client.post(
        "/api/auth/login",
        json={"username": "officer", "password": "officer123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "officer"
    assert data["user"]["role"] == "OFFICER"

def test_auth_login_invalid_credentials():
    response = client.post(
        "/api/auth/login",
        json={"username": "officer", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_list_screenings_authenticated():
    # Login first
    login_res = client.post(
        "/api/auth/login",
        json={"username": "officer", "password": "officer123"}
    )
    token = login_res.json()["access_token"]
    
    response = client.get(
        "/api/screenings",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_dashboard_stats_endpoint():
    login_res = client.post(
        "/api/auth/login",
        json={"username": "officer", "password": "officer123"}
    )
    token = login_res.json()["access_token"]
    
    response = client.get(
        "/api/screenings/stats/dashboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_screenings" in data
    assert "low_risk_count" in data
    assert "high_risk_count" in data
