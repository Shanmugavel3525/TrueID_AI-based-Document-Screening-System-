import pytest
from backend.app.services.risk_engine import RiskEngine

def test_risk_engine_clean_case():
    mrz = {"mrz_detected": True, "all_checksums_valid": True, "matches_viz_fields": True}
    val = {"is_expired": False, "is_future_issue_date": False, "is_valid_age": True, "is_valid_doc_number_format": True}
    tamper = {"ela_anomaly_score": 0.05, "photo_splicing_score": 0.08, "metadata_manipulation_flag": False}
    face = {"match_status": "MATCH", "similarity_score": 88.0}
    reg = {"check_status": "CLEAR"}
    
    res = RiskEngine.calculate_risk(mrz, val, tamper, face, reg)
    assert res["risk_score"] < 25.0
    assert res["risk_level"] == "LOW"
    assert res["requires_manual_review"] is False

def test_risk_engine_critical_watchlist_hit():
    mrz = {"mrz_detected": True, "all_checksums_valid": True, "matches_viz_fields": True}
    val = {"is_expired": False, "is_future_issue_date": False, "is_valid_age": True, "is_valid_doc_number_format": True}
    tamper = {"ela_anomaly_score": 0.05, "photo_splicing_score": 0.08, "metadata_manipulation_flag": False}
    face = {"match_status": "MATCH", "similarity_score": 85.0}
    reg = {"check_status": "HIT_WANTED"}
    
    res = RiskEngine.calculate_risk(mrz, val, tamper, face, reg)
    assert res["risk_score"] >= 80.0
    assert res["risk_level"] == "HIGH"
    assert res["requires_manual_review"] is True
    assert any(f["code"] == "REG_WANTED_HIT" for f in res["contributing_factors_json"])
