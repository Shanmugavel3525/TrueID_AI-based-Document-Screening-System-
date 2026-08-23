import pytest
from backend.app.services.validation_service import ValidationService

def test_validation_clean_document():
    fields = {
        "document_number": "P1284920",
        "full_name": "RAJESH SHARMA",
        "nationality": "IND",
        "date_of_birth": "1990-05-12",
        "issue_date": "2020-01-10",
        "expiry_date": "2030-01-09"
    }
    res = ValidationService.validate_document("PASSPORT", fields)
    assert res["is_expired"] is False
    assert res["is_future_issue_date"] is False
    assert res["is_valid_age"] is True
    assert res["is_valid_doc_number_format"] is True

def test_validation_expired_document():
    fields = {
        "document_number": "G9921045",
        "full_name": "JOHN DAVIS",
        "nationality": "GBR",
        "date_of_birth": "1975-11-20",
        "issue_date": "2010-05-13",
        "expiry_date": "2020-05-12"
    }
    res = ValidationService.validate_document("PASSPORT", fields)
    assert res["is_expired"] is True
    assert res["passed_all_rules"] is False

def test_validation_future_issue_date():
    fields = {
        "document_number": "P9999999",
        "full_name": "FUTURE TRAVELER",
        "nationality": "IND",
        "date_of_birth": "2000-01-01",
        "issue_date": "2035-01-01",
        "expiry_date": "2045-01-01"
    }
    res = ValidationService.validate_document("PASSPORT", fields)
    assert res["is_future_issue_date"] is True
    assert res["passed_all_rules"] is False
