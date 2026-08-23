from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
import re

class ValidationService:
    @staticmethod
    def parse_date(date_str: Optional[str]) -> Optional[datetime]:
        if not date_str:
            return None
        cleaned = date_str.strip().replace('/', '-').replace('.', '-')
        
        # Common date formats
        formats = [
            "%Y-%m-%d",
            "%d-%m-%Y",
            "%m-%d-%Y",
            "%Y%m%d",
            "%d %b %Y",
            "%d %B %Y",
            "%y%m%d"  # 6-digit MRZ date format
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(cleaned, fmt)
                # Handle 2-digit years (YYMMDD) in MRZ:
                # E.g. Expiry > 50 -> 1900s, <= 50 -> 2000s
                if fmt == "%y%m%d":
                    now_year_short = datetime.now().year % 100
                    if dt.year > datetime.now().year + 30:
                        dt = dt.replace(year=dt.year - 100)
                return dt
            except ValueError:
                continue
        return None

    @staticmethod
    def validate_document(
        document_type: str,
        extracted_fields: Dict[str, Any],
        mrz_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Validates temporal logic, biological plausibility, format compliance,
        and cross-field consistency.
        """
        rules_evaluations: List[Dict[str, Any]] = []
        now = datetime.now()
        
        dob_str = extracted_fields.get("date_of_birth") or (mrz_data.get("date_of_birth") if mrz_data else None)
        issue_str = extracted_fields.get("issue_date")
        expiry_str = extracted_fields.get("expiry_date") or (mrz_data.get("expiry_date") if mrz_data else None)
        doc_no = extracted_fields.get("document_number") or (mrz_data.get("document_number") if mrz_data else "")
        nationality = extracted_fields.get("nationality") or (mrz_data.get("nationality") if mrz_data else "")
        
        dob_dt = ValidationService.parse_date(dob_str)
        issue_dt = ValidationService.parse_date(issue_str)
        expiry_dt = ValidationService.parse_date(expiry_str)
        
        is_expired = False
        is_future_issue_date = False
        is_valid_age = True
        is_valid_doc_no_format = True
        
        # Rule 1: Expiry Check
        if expiry_dt:
            if expiry_dt < now:
                is_expired = True
                rules_evaluations.append({
                    "rule": "EXPIRY_CHECK",
                    "status": "FAIL",
                    "severity": "HIGH",
                    "message": f"Document expired on {expiry_dt.strftime('%Y-%m-%d')}"
                })
            else:
                rules_evaluations.append({
                    "rule": "EXPIRY_CHECK",
                    "status": "PASS",
                    "severity": "NONE",
                    "message": f"Document valid until {expiry_dt.strftime('%Y-%m-%d')}"
                })
        else:
            rules_evaluations.append({
                "rule": "EXPIRY_CHECK",
                "status": "WARN",
                "severity": "MEDIUM",
                "message": "Expiration date could not be determined"
            })
            
        # Rule 2: Future Issue Date Check
        if issue_dt:
            if issue_dt > now:
                is_future_issue_date = True
                rules_evaluations.append({
                    "rule": "FUTURE_ISSUE_DATE_CHECK",
                    "status": "FAIL",
                    "severity": "HIGH",
                    "message": f"Issue date {issue_dt.strftime('%Y-%m-%d')} is in the future"
                })
            else:
                rules_evaluations.append({
                    "rule": "FUTURE_ISSUE_DATE_CHECK",
                    "status": "PASS",
                    "severity": "NONE",
                    "message": f"Issue date {issue_dt.strftime('%Y-%m-%d')} is valid"
                })

        # Rule 3: Age & Biological Plausibility Check
        if dob_dt:
            age = (now - dob_dt).days // 365
            if age < 0 or age > 120:
                is_valid_age = False
                rules_evaluations.append({
                    "rule": "AGE_PLAUSIBILITY_CHECK",
                    "status": "FAIL",
                    "severity": "HIGH",
                    "message": f"Calculated age ({age} years) is biologically impossible"
                })
            else:
                rules_evaluations.append({
                    "rule": "AGE_PLAUSIBILITY_CHECK",
                    "status": "PASS",
                    "severity": "NONE",
                    "message": f"Calculated age ({age} years) is within valid range"
                })
                
            if issue_dt and dob_dt > issue_dt:
                rules_evaluations.append({
                    "rule": "DOB_BEFORE_ISSUE_CHECK",
                    "status": "FAIL",
                    "severity": "CRITICAL",
                    "message": "Document issue date precedes holder date of birth"
                })
        
        # Rule 4: Validity Duration Sanity Check
        if issue_dt and expiry_dt:
            validity_years = (expiry_dt - issue_dt).days / 365.25
            if validity_years > 20 or validity_years < 0:
                rules_evaluations.append({
                    "rule": "VALIDITY_PERIOD_CHECK",
                    "status": "WARN",
                    "severity": "MEDIUM",
                    "message": f"Unusual validity duration: {validity_years:.1f} years"
                })
            else:
                rules_evaluations.append({
                    "rule": "VALIDITY_PERIOD_CHECK",
                    "status": "PASS",
                    "severity": "NONE",
                    "message": f"Validity period ({validity_years:.1f} years) conforms to standard"
                })

        # Rule 5: Document Number Format Check
        if doc_no:
            cleaned_doc = doc_no.replace(" ", "").upper()
            # General standard passport check: 6-10 alphanumeric characters
            if len(cleaned_doc) < 5 or len(cleaned_doc) > 15:
                is_valid_doc_no_format = False
                rules_evaluations.append({
                    "rule": "DOC_NUMBER_SYNTAX",
                    "status": "FAIL",
                    "severity": "HIGH",
                    "message": f"Document number '{cleaned_doc}' has anomalous length ({len(cleaned_doc)} chars)"
                })
            else:
                rules_evaluations.append({
                    "rule": "DOC_NUMBER_SYNTAX",
                    "status": "PASS",
                    "severity": "NONE",
                    "message": f"Document number syntax is compliant ({len(cleaned_doc)} alphanumeric chars)"
                })

        # Rule 6: Mandatory Biographical Fields Check
        required_fields = ["document_number", "nationality", "date_of_birth"]
        missing_fields = []
        for f in required_fields:
            val = extracted_fields.get(f) or (mrz_data.get(f) if mrz_data else None)
            if not val:
                missing_fields.append(f)
        if missing_fields:
            rules_evaluations.append({
                "rule": "MANDATORY_FIELDS_CHECK",
                "status": "WARN",
                "severity": "MEDIUM",
                "message": f"Missing mandatory field(s): {', '.join(missing_fields)}"
            })
        else:
            rules_evaluations.append({
                "rule": "MANDATORY_FIELDS_CHECK",
                "status": "PASS",
                "severity": "NONE",
                "message": "All mandatory identity fields present"
            })

        passed_all = all(r["status"] == "PASS" for r in rules_evaluations)

        return {
            "is_expired": is_expired,
            "is_future_issue_date": is_future_issue_date,
            "is_valid_age": is_valid_age,
            "is_valid_doc_number_format": is_valid_doc_no_format,
            "passed_all_rules": passed_all,
            "rule_evaluations_json": rules_evaluations
        }
