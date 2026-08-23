import re
from typing import Dict, Any, Optional, Tuple, List

# ICAO 9303 7-3-1 weight sequence
WEIGHTS = [7, 3, 1]

def char_to_value(char: str) -> int:
    char = char.upper()
    if '0' <= char <= '9':
        return int(char)
    elif 'A' <= char <= 'Z':
        return ord(char) - ord('A') + 10
    elif char == '<':
        return 0
    return 0

def calculate_check_digit(data_str: str) -> int:
    total = 0
    for i, char in enumerate(data_str):
        weight = WEIGHTS[i % 3]
        total += char_to_value(char) * weight
    return total % 10

def verify_check_digit(data_str: str, expected_digit: str) -> bool:
    try:
        if not expected_digit or expected_digit == '<':
            expected_val = 0
        else:
            expected_val = int(expected_digit)
        calculated = calculate_check_digit(data_str)
        return calculated == expected_val
    except Exception:
        return False

def clean_mrz_line(line: str) -> str:
    cleaned = re.sub(r'[^A-Z0-9<]', '', line.upper().replace(' ', ''))
    return cleaned

class MRZService:
    @staticmethod
    def parse_mrz(lines: List[str]) -> Dict[str, Any]:
        """
        Parses MRZ lines (TD1, TD2, TD3) and verifies all check digits.
        """
        cleaned_lines = [clean_mrz_line(line) for line in lines if clean_mrz_line(line)]
        
        # Filter out lines that are too short to be MRZ
        mrz_candidates = [l for l in cleaned_lines if len(l) >= 28]
        
        if not mrz_candidates:
            return {
                "mrz_detected": False,
                "mrz_type": None,
                "all_checksums_valid": False,
                "error": "No valid MRZ lines detected"
            }
        
        # Detect Type
        # TD3: 2 lines of 44 chars
        if len(mrz_candidates) >= 2 and all(len(l) >= 42 for l in mrz_candidates[:2]):
            return MRZService._parse_td3(mrz_candidates[0][:44].ljust(44, '<'), mrz_candidates[1][:44].ljust(44, '<'))
        
        # TD2: 2 lines of 36 chars
        elif len(mrz_candidates) >= 2 and all(len(l) >= 34 for l in mrz_candidates[:2]):
            return MRZService._parse_td2(mrz_candidates[0][:36].ljust(36, '<'), mrz_candidates[1][:36].ljust(36, '<'))
        
        # TD1: 3 lines of 30 chars
        elif len(mrz_candidates) >= 3 and all(len(l) >= 28 for l in mrz_candidates[:3]):
            return MRZService._parse_td1(
                mrz_candidates[0][:30].ljust(30, '<'),
                mrz_candidates[1][:30].ljust(30, '<'),
                mrz_candidates[2][:30].ljust(30, '<')
            )
        
        # Fallback partial parsing
        return MRZService._parse_fallback(mrz_candidates)

    @staticmethod
    def _parse_td3(l1: str, l2: str) -> Dict[str, Any]:
        """
        Parse ICAO 9303 TD3 (Passports: 2 x 44 chars).
        L1: P<ISSUER<SURNAME<<GIVEN_NAMES<<<<<<<<<<<<<<<<<<<<<<
        L2: DOC_NO(9)+CD(1) + NAT(3) + DOB(6)+CD(1) + SEX(1) + EXPIRY(6)+CD(1) + OPTIONAL(14)+CD(1) + COMPOSITE_CD(1)
        """
        doc_type = l1[0:2].replace('<', '')
        issuing_country = l1[2:5].replace('<', '')
        name_section = l1[5:44]
        
        if '<<' in name_section:
            parts = name_section.split('<<')
            surname = parts[0].replace('<', ' ').strip()
            given_names = parts[1].replace('<', ' ').strip() if len(parts) > 1 else ""
        else:
            surname = name_section.replace('<', ' ').strip()
            given_names = ""
        full_name = f"{given_names} {surname}".strip() if given_names else surname
        
        doc_number_raw = l2[0:9]
        doc_number = doc_number_raw.replace('<', '')
        doc_num_cd = l2[9:10]
        valid_doc_num = verify_check_digit(doc_number_raw, doc_num_cd)
        
        nationality = l2[10:13].replace('<', '')
        dob_raw = l2[13:19]
        dob_cd = l2[19:20]
        valid_dob = verify_check_digit(dob_raw, dob_cd)
        
        gender = l2[20:21].replace('<', '')
        expiry_raw = l2[21:27]
        expiry_cd = l2[27:28]
        valid_expiry = verify_check_digit(expiry_raw, expiry_cd)
        
        optional_data = l2[28:42]
        optional_cd = l2[42:43]
        valid_optional = verify_check_digit(optional_data, optional_cd) if optional_cd != '<' else True
        
        composite_cd = l2[43:44]
        # Composite checksum string in TD3: L2[0:10] + L2[13:20] + L2[21:43]
        composite_str = l2[0:10] + l2[13:20] + l2[21:43]
        valid_composite = verify_check_digit(composite_str, composite_cd)
        
        all_valid = valid_doc_num and valid_dob and valid_expiry and valid_composite
        
        return {
            "mrz_detected": True,
            "mrz_type": "TD3",
            "line1": l1,
            "line2": l2,
            "line3": None,
            "document_type": doc_type,
            "issuing_country": issuing_country,
            "surname": surname,
            "given_names": given_names,
            "full_name": full_name,
            "document_number": doc_number,
            "nationality": nationality,
            "date_of_birth": dob_raw,
            "gender": gender,
            "expiry_date": expiry_raw,
            "optional_data": optional_data.replace('<', ''),
            "valid_doc_number_checksum": valid_doc_num,
            "valid_dob_checksum": valid_dob,
            "valid_expiry_checksum": valid_expiry,
            "valid_composite_checksum": valid_composite,
            "all_checksums_valid": all_valid,
            "matches_viz_fields": True,
            "checksum_details_json": {
                "doc_number": {"value": doc_number, "raw": doc_number_raw, "check_digit": doc_num_cd, "calculated": calculate_check_digit(doc_number_raw), "valid": valid_doc_num},
                "date_of_birth": {"value": dob_raw, "check_digit": dob_cd, "calculated": calculate_check_digit(dob_raw), "valid": valid_dob},
                "expiry_date": {"value": expiry_raw, "check_digit": expiry_cd, "calculated": calculate_check_digit(expiry_raw), "valid": valid_expiry},
                "composite": {"check_digit": composite_cd, "calculated": calculate_check_digit(composite_str), "valid": valid_composite}
            }
        }

    @staticmethod
    def _parse_td2(l1: str, l2: str) -> Dict[str, Any]:
        """
        Parse ICAO 9303 TD2 (Visas/Cards: 2 x 36 chars).
        L1: DOC_TYPE(2) + ISSUER(3) + SURNAME<<GIVEN_NAMES<<<<<<<<<<<<<<<<<<
        L2: DOC_NO(9)+CD(1) + NAT(3) + DOB(6)+CD(1) + SEX(1) + EXPIRY(6)+CD(1) + OPT(7)+COMP_CD(1)
        """
        doc_type = l1[0:2].replace('<', '')
        issuing_country = l1[2:5].replace('<', '')
        name_section = l1[5:36]
        
        if '<<' in name_section:
            parts = name_section.split('<<')
            surname = parts[0].replace('<', ' ').strip()
            given_names = parts[1].replace('<', ' ').strip() if len(parts) > 1 else ""
        else:
            surname = name_section.replace('<', ' ').strip()
            given_names = ""
        full_name = f"{given_names} {surname}".strip() if given_names else surname
        
        doc_number_raw = l2[0:9]
        doc_number = doc_number_raw.replace('<', '')
        doc_num_cd = l2[9:10]
        valid_doc_num = verify_check_digit(doc_number_raw, doc_num_cd)
        
        nationality = l2[10:13].replace('<', '')
        dob_raw = l2[13:19]
        dob_cd = l2[19:20]
        valid_dob = verify_check_digit(dob_raw, dob_cd)
        
        gender = l2[20:21].replace('<', '')
        expiry_raw = l2[21:27]
        expiry_cd = l2[27:28]
        valid_expiry = verify_check_digit(expiry_raw, expiry_cd)
        
        composite_cd = l2[35:36]
        composite_str = l2[0:10] + l2[13:20] + l2[21:35]
        valid_composite = verify_check_digit(composite_str, composite_cd)
        
        all_valid = valid_doc_num and valid_dob and valid_expiry and valid_composite
        
        return {
            "mrz_detected": True,
            "mrz_type": "TD2",
            "line1": l1,
            "line2": l2,
            "line3": None,
            "document_type": doc_type,
            "issuing_country": issuing_country,
            "surname": surname,
            "given_names": given_names,
            "full_name": full_name,
            "document_number": doc_number,
            "nationality": nationality,
            "date_of_birth": dob_raw,
            "gender": gender,
            "expiry_date": expiry_raw,
            "valid_doc_number_checksum": valid_doc_num,
            "valid_dob_checksum": valid_dob,
            "valid_expiry_checksum": valid_expiry,
            "valid_composite_checksum": valid_composite,
            "all_checksums_valid": all_valid,
            "matches_viz_fields": True,
            "checksum_details_json": {
                "doc_number": {"value": doc_number, "check_digit": doc_num_cd, "calculated": calculate_check_digit(doc_number_raw), "valid": valid_doc_num},
                "date_of_birth": {"value": dob_raw, "check_digit": dob_cd, "calculated": calculate_check_digit(dob_raw), "valid": valid_dob},
                "expiry_date": {"value": expiry_raw, "check_digit": expiry_cd, "calculated": calculate_check_digit(expiry_raw), "valid": valid_expiry},
                "composite": {"check_digit": composite_cd, "calculated": calculate_check_digit(composite_str), "valid": valid_composite}
            }
        }

    @staticmethod
    def _parse_td1(l1: str, l2: str, l3: str) -> Dict[str, Any]:
        """
        Parse ICAO 9303 TD1 (National IDs: 3 x 30 chars).
        L1: DOC_TYPE(2) + ISSUER(3) + DOC_NO(9)+CD(1) + OPT1(15)
        L2: DOB(6)+CD(1) + SEX(1) + EXPIRY(6)+CD(1) + NAT(3) + OPT2(11) + COMP_CD(1)
        L3: SURNAME<<GIVEN_NAMES<<<<<<<<<<<<<<<<<<<<<<<<<<
        """
        doc_type = l1[0:2].replace('<', '')
        issuing_country = l1[2:5].replace('<', '')
        doc_number_raw = l1[5:14]
        doc_number = doc_number_raw.replace('<', '')
        doc_num_cd = l1[14:15]
        valid_doc_num = verify_check_digit(doc_number_raw, doc_num_cd)
        
        dob_raw = l2[0:6]
        dob_cd = l2[6:7]
        valid_dob = verify_check_digit(dob_raw, dob_cd)
        
        gender = l2[7:8].replace('<', '')
        expiry_raw = l2[8:14]
        expiry_cd = l2[14:15]
        valid_expiry = verify_check_digit(expiry_raw, expiry_cd)
        nationality = l2[15:18].replace('<', '')
        
        composite_cd = l2[29:30]
        composite_str = l1[5:30] + l2[0:7] + l2[8:15] + l2[18:29]
        valid_composite = verify_check_digit(composite_str, composite_cd)
        
        name_section = l3[0:30]
        if '<<' in name_section:
            parts = name_section.split('<<')
            surname = parts[0].replace('<', ' ').strip()
            given_names = parts[1].replace('<', ' ').strip() if len(parts) > 1 else ""
        else:
            surname = name_section.replace('<', ' ').strip()
            given_names = ""
        full_name = f"{given_names} {surname}".strip() if given_names else surname
        
        all_valid = valid_doc_num and valid_dob and valid_expiry and valid_composite
        
        return {
            "mrz_detected": True,
            "mrz_type": "TD1",
            "line1": l1,
            "line2": l2,
            "line3": l3,
            "document_type": doc_type,
            "issuing_country": issuing_country,
            "surname": surname,
            "given_names": given_names,
            "full_name": full_name,
            "document_number": doc_number,
            "nationality": nationality,
            "date_of_birth": dob_raw,
            "gender": gender,
            "expiry_date": expiry_raw,
            "valid_doc_number_checksum": valid_doc_num,
            "valid_dob_checksum": valid_dob,
            "valid_expiry_checksum": valid_expiry,
            "valid_composite_checksum": valid_composite,
            "all_checksums_valid": all_valid,
            "matches_viz_fields": True,
            "checksum_details_json": {
                "doc_number": {"value": doc_number, "check_digit": doc_num_cd, "calculated": calculate_check_digit(doc_number_raw), "valid": valid_doc_num},
                "date_of_birth": {"value": dob_raw, "check_digit": dob_cd, "calculated": calculate_check_digit(dob_raw), "valid": valid_dob},
                "expiry_date": {"value": expiry_raw, "check_digit": expiry_cd, "calculated": calculate_check_digit(expiry_raw), "valid": valid_expiry},
                "composite": {"check_digit": composite_cd, "calculated": calculate_check_digit(composite_str), "valid": valid_composite}
            }
        }

    @staticmethod
    def _parse_fallback(lines: List[str]) -> Dict[str, Any]:
        return {
            "mrz_detected": True,
            "mrz_type": "UNKNOWN",
            "line1": lines[0] if len(lines) > 0 else None,
            "line2": lines[1] if len(lines) > 1 else None,
            "line3": lines[2] if len(lines) > 2 else None,
            "valid_doc_number_checksum": False,
            "valid_dob_checksum": False,
            "valid_expiry_checksum": False,
            "valid_composite_checksum": False,
            "all_checksums_valid": False,
            "matches_viz_fields": False,
            "checksum_details_json": {"error": "Irregular line format"}
        }

    @staticmethod
    def check_viz_mrz_consistency(viz_fields: Dict[str, Any], mrz_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        discrepancies = []
        if not mrz_data.get("mrz_detected"):
            return True, []
        
        mrz_doc_no = (mrz_data.get("document_number") or "").upper().replace(" ", "").replace("<", "")
        viz_doc_no = (viz_fields.get("document_number") or "").upper().replace(" ", "")
        if mrz_doc_no and viz_doc_no and mrz_doc_no != viz_doc_no:
            discrepancies.append(f"Document Number Mismatch: VIZ '{viz_doc_no}' vs MRZ '{mrz_doc_no}'")
        
        mrz_nat = (mrz_data.get("nationality") or "").upper()
        viz_nat = (viz_fields.get("nationality") or "").upper()
        if mrz_nat and viz_nat and len(viz_nat) == 3 and mrz_nat != viz_nat:
            discrepancies.append(f"Nationality Mismatch: VIZ '{viz_nat}' vs MRZ '{mrz_nat}'")
            
        mrz_name = (mrz_data.get("surname") or "").upper().replace("<", "")
        viz_name = (viz_fields.get("surname") or viz_fields.get("full_name") or "").upper()
        if mrz_name and viz_name and mrz_name not in viz_name and viz_name not in mrz_name:
            discrepancies.append(f"Holder Name Discrepancy: VIZ '{viz_name}' vs MRZ '{mrz_name}'")
            
        is_consistent = len(discrepancies) == 0
        return is_consistent, discrepancies
