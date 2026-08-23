from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from backend.app.models.models import RegistryRecord

class RegistryService:
    @staticmethod
    def check_document_and_person(
        db: Session,
        document_number: Optional[str],
        full_name: Optional[str],
        nationality: Optional[str] = None,
        date_of_birth: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Cross-references document number and holder identity against simulated security databases.
        """
        cleaned_doc_no = document_number.strip().upper() if document_number else ""
        cleaned_name = full_name.strip().upper() if full_name else ""
        
        # 1. Check Stolen / Lost Travel Document (SLTD) Registry
        if cleaned_doc_no:
            stolen_record = db.query(RegistryRecord).filter(
                RegistryRecord.registry_type == "STOLEN_PASSPORT",
                RegistryRecord.document_number == cleaned_doc_no,
                RegistryRecord.is_active == True
            ).first()
            
            if stolen_record:
                return {
                    "check_status": "HIT_STOLEN",
                    "matched_registry": "INTERPOL_SLTD_SIMULATOR",
                    "matched_record_id": stolen_record.id,
                    "severity": stolen_record.severity or "CRITICAL",
                    "match_details_json": {
                        "registry_name": "Interpol Stolen & Lost Travel Documents (SLTD)",
                        "document_number": stolen_record.document_number,
                        "reason": stolen_record.reason,
                        "reported_date": stolen_record.created_at.strftime("%Y-%m-%d")
                    }
                }

        # 2. Check Wanted Persons / Red Notices Registry
        if cleaned_name:
            # Query all active wanted persons
            wanted_records = db.query(RegistryRecord).filter(
                RegistryRecord.registry_type == "WANTED_PERSON",
                RegistryRecord.is_active == True
            ).all()
            
            for wr in wanted_records:
                record_name = (wr.full_name or "").strip().upper()
                if not record_name:
                    continue
                    
                # Exact or significant substring / token match
                record_tokens = set(record_name.split())
                query_tokens = set(cleaned_name.split())
                
                if record_name in cleaned_name or cleaned_name in record_name or len(record_tokens.intersection(query_tokens)) >= 2:
                    return {
                        "check_status": "HIT_WANTED",
                        "matched_registry": "INTERPOL_RED_NOTICE_SIMULATOR",
                        "matched_record_id": wr.id,
                        "severity": wr.severity or "CRITICAL",
                        "match_details_json": {
                            "registry_name": "Interpol Red Notice & National Watchlist",
                            "subject_name": wr.full_name,
                            "nationality": wr.nationality,
                            "reason": wr.reason,
                            "severity": wr.severity
                        }
                    }

        # 3. Check Revoked / Cancelled Permits
        if cleaned_doc_no:
            revoked_record = db.query(RegistryRecord).filter(
                RegistryRecord.registry_type == "REVOKED_DOCUMENT",
                RegistryRecord.document_number == cleaned_doc_no,
                RegistryRecord.is_active == True
            ).first()
            
            if revoked_record:
                return {
                    "check_status": "HIT_REVOKED",
                    "matched_registry": "REVOKED_DOCUMENTS_REGISTRY",
                    "matched_record_id": revoked_record.id,
                    "severity": revoked_record.severity or "HIGH",
                    "match_details_json": {
                        "registry_name": "National Revoked Document Registry",
                        "document_number": revoked_record.document_number,
                        "reason": revoked_record.reason
                    }
                }

        # No match found -> Clean
        return {
            "check_status": "CLEAR",
            "matched_registry": None,
            "matched_record_id": None,
            "severity": "NONE",
            "match_details_json": {
                "message": "No matches found in SLTD, Wanted Watchlist, or Revocation Databases"
            }
        }
