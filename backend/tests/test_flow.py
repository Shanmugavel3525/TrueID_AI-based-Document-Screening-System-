import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import settings

client = TestClient(app)

def test_full_platform_lifecycle():
    # 1. Login
    login_res = client.post("/api/auth/login", json={"username": "officer", "password": "officer123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload sample document
    sample_file_path = settings.BASE_DIR / "storage" / "samples" / "sample_case_4.jpg"
    with open(sample_file_path, "rb") as f:
        upload_res = client.post(
            "/api/documents/upload",
            files={"file": ("sample_case_4.jpg", f, "image/jpeg")},
            data={"document_type": "PASSPORT"},
            headers=headers
        )
    assert upload_res.status_code in [200, 201]
    doc_id = upload_res.json()["id"]

    # 3. Trigger Screening
    screen_res = client.post(
        "/api/screenings",
        data={
            "document_id": doc_id,
            "preset_data_json": '{"preset_id": "case_4"}'
        },
        headers=headers
    )
    assert screen_res.status_code in [200, 201]
    screening_data = screen_res.json()
    screening_id = screening_data["id"]
    assert screening_data["risk_assessment"]["risk_score"] > 0
    assert len(screening_data["risk_assessment"]["contributing_factors_json"]) > 0

    # 4. Get Screening Dossier
    detail_res = client.get(f"/api/screenings/{screening_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["extracted_fields"]["full_name"] is not None

    # 5. Submit Official Determination
    decision_res = client.post(
        f"/api/screenings/{screening_id}/decision",
        json={
            "status": "REFER_SECONDARY",
            "officer_notes": "Physical secondary check recommended due to ELA score anomaly."
        },
        headers=headers
    )
    assert decision_res.status_code == 200
    assert decision_res.json()["status"] == "REFER_SECONDARY"

    # 6. Generate & Download PDF Dossier
    pdf_res = client.get(f"/api/screenings/{screening_id}/report", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000

    # 7. Check Dashboard Stats
    stats_res = client.get("/api/screenings/stats/dashboard", headers=headers)
    assert stats_res.status_code == 200
    assert stats_res.json()["total_screenings"] > 0

    # 8. Check Registries
    reg_res = client.get("/api/registries", headers=headers)
    assert reg_res.status_code == 200
    assert len(reg_res.json()) > 0
