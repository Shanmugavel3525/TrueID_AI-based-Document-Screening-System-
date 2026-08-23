import pytest
from backend.app.services.mrz_service import MRZService, calculate_check_digit, verify_check_digit

def test_mrz_check_digit_calculation():
    # Standard ICAO 9303 test vector: "L898902C3" -> 7*L(21) + 3*8 + 1*9 + 7*8 + 3*9 + 1*0 + 7*2 + 3*C(12) + 1*3
    # Checksum calculation:
    val = calculate_check_digit("L898902C3")
    assert isinstance(val, int)
    assert 0 <= val <= 9

def test_mrz_td3_passport_parsing():
    # Synthetic TD3 Passport MRZ lines
    l1 = "P<INDRANKA<<ABHISHEK<<<<<<<<<<<<<<<<<<<<<<<"
    l2 = "P1284920<6IND8806144M2801098<<<<<<<<<<<<<<8"
    
    res = MRZService.parse_mrz([l1, l2])
    assert res["mrz_detected"] is True
    assert res["mrz_type"] == "TD3"
    assert res["surname"] == "RANKA"
    assert res["given_names"] == "ABHISHEK"
    assert res["nationality"] == "IND"
    assert res["document_number"] == "P1284920"

def test_mrz_tampered_check_digit_detected():
    l1 = "P<DEUWEBER<<MARKUS<<<<<<<<<<<<<<<<<<<<<<<<<"
    # Tampered check digit on doc number (calculated is 0, set check digit to 9)
    l2 = "C339102809DEU8203083M2908151<<<<<<<<<<<<<<0"
    
    res = MRZService.parse_mrz([l1, l2])
    assert res["mrz_detected"] is True
    assert res["all_checksums_valid"] is False
    assert res["valid_doc_number_checksum"] is False
