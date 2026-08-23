from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from backend.app.schemas.schemas import RiskFactor, RiskAssessmentSchema, RiskWeightSettings

class RiskEngine:
    @staticmethod
    def calculate_risk(
        mrz_data: Optional[Dict[str, Any]],
        validation_data: Optional[Dict[str, Any]],
        tampering_data: Optional[Dict[str, Any]],
        face_data: Optional[Dict[str, Any]],
        registry_data: Optional[Dict[str, Any]],
        weights: Optional[RiskWeightSettings] = None
    ) -> Dict[str, Any]:
        """
        Evaluates multi-signal risk factors and computes a normalized 0-100 score
        with plain-language explainability for frontline security officers.
        """
        if weights is None:
            weights = RiskWeightSettings()

        factors: List[Dict[str, Any]] = []
        raw_score = 0.0
        requires_manual_review = False

        # 1. Registry Signals (Highest Priority)
        if registry_data:
            check_status = registry_data.get("check_status", "CLEAR")
            if check_status == "HIT_WANTED":
                pts = weights.watchlist_hit_weight
                raw_score += pts
                requires_manual_review = True
                factors.append({
                    "code": "REG_WANTED_HIT",
                    "title": "Wanted Person Watchlist Hit",
                    "description": "Subject matches Interpol Red Notice or National Wanted Watchlist record",
                    "severity": "CRITICAL",
                    "points": pts,
                    "category": "REGISTRY"
                })
            elif check_status == "HIT_STOLEN":
                pts = weights.stolen_doc_weight
                raw_score += pts
                requires_manual_review = True
                factors.append({
                    "code": "REG_STOLEN_DOC",
                    "title": "Lost / Stolen Document Hit",
                    "description": "Document number is registered in Interpol Stolen and Lost Travel Documents (SLTD) database",
                    "severity": "CRITICAL",
                    "points": pts,
                    "category": "REGISTRY"
                })
            elif check_status == "HIT_REVOKED":
                pts = 60.0
                raw_score += pts
                requires_manual_review = True
                factors.append({
                    "code": "REG_REVOKED_DOC",
                    "title": "Revoked / Cancelled Document",
                    "description": "Document has been formally revoked by the issuing authority",
                    "severity": "HIGH",
                    "points": pts,
                    "category": "REGISTRY"
                })

        # 2. MRZ & Checksum Signals
        if mrz_data and mrz_data.get("mrz_detected"):
            if not mrz_data.get("all_checksums_valid"):
                pts = weights.mrz_mismatch_weight
                raw_score += pts
                factors.append({
                    "code": "MRZ_CHECKSUM_FAIL",
                    "title": "ICAO 9303 Checksum Discrepancy",
                    "description": "One or more mathematical 7-3-1 check digits in the Machine Readable Zone do not match data fields",
                    "severity": "HIGH",
                    "points": pts,
                    "category": "MRZ"
                })
            if not mrz_data.get("matches_viz_fields", True):
                pts = weights.viz_mrz_mismatch_weight
                raw_score += pts
                factors.append({
                    "code": "VIZ_MRZ_MISMATCH",
                    "title": "Visual Zone vs MRZ Discrepancy",
                    "description": "Printed text on document differs from encoded MRZ character strings",
                    "severity": "MEDIUM",
                    "points": pts,
                    "category": "MRZ"
                })

        # 3. Document Integrity & Validation Rules
        if validation_data:
            if validation_data.get("is_expired"):
                pts = weights.expired_doc_weight
                raw_score += pts
                factors.append({
                    "code": "DOC_EXPIRED",
                    "title": "Expired Travel Document",
                    "description": "Document expiry date is prior to current date",
                    "severity": "MEDIUM",
                    "points": pts,
                    "category": "EXPIRY"
                })
            if validation_data.get("is_future_issue_date"):
                pts = weights.future_date_weight
                raw_score += pts
                factors.append({
                    "code": "DOC_FUTURE_DATE",
                    "title": "Impossible Future Issue Date",
                    "description": "Document records an issuance date that has not yet occurred",
                    "severity": "HIGH",
                    "points": pts,
                    "category": "FORMAT"
                })
            if not validation_data.get("is_valid_age", True):
                pts = 35.0
                raw_score += pts
                factors.append({
                    "code": "DOC_AGE_ANOMALY",
                    "title": "Biological Age Anomaly",
                    "description": "Holder date of birth indicates an impossible age or issue date precedes birth",
                    "severity": "HIGH",
                    "points": pts,
                    "category": "FORMAT"
                })
            if not validation_data.get("is_valid_doc_number_format", True):
                pts = 20.0
                raw_score += pts
                factors.append({
                    "code": "DOC_SYNTAX_ANOMALY",
                    "title": "Non-Standard Document Number",
                    "description": "Document number format does not comply with country standard syntax",
                    "severity": "LOW",
                    "points": pts,
                    "category": "FORMAT"
                })

        # 4. Forensics & Image Tampering
        if tampering_data:
            ela_score = tampering_data.get("ela_anomaly_score", 0.0)
            if ela_score >= 0.35:
                pts = weights.ela_anomaly_weight * min(2.0, ela_score / 0.5)
                pts = round(min(50.0, pts), 1)
                raw_score += pts
                factors.append({
                    "code": "FOR_ELA_ANOMALY",
                    "title": "Error Level Analysis Discrepancy",
                    "description": f"Compression error level disparity ({int(ela_score*100)}%) indicates digital modification or spliced content",
                    "severity": "HIGH" if ela_score >= 0.6 else "MEDIUM",
                    "points": pts,
                    "category": "FORENSICS"
                })

            photo_splicing = tampering_data.get("photo_splicing_score", 0.0)
            if photo_splicing >= 0.45:
                pts = weights.photo_splicing_weight
                raw_score += pts
                factors.append({
                    "code": "FOR_PHOTO_SPLICING",
                    "title": "Photo Perimeter Discontinuity",
                    "description": "Sharp step discontinuity and luminance boundary around portrait zone indicates possible photo replacement",
                    "severity": "HIGH",
                    "points": pts,
                    "category": "FORENSICS"
                })

            if tampering_data.get("metadata_manipulation_flag"):
                pts = 25.0
                raw_score += pts
                factors.append({
                    "code": "FOR_METADATA_FLAG",
                    "title": "Editing Software Signature Detected",
                    "description": "Image metadata contains traces of digital manipulation software",
                    "severity": "MEDIUM",
                    "points": pts,
                    "category": "FORENSICS"
                })

        # 5. Biometric Face Verification
        if face_data:
            match_status = face_data.get("match_status", "INCONCLUSIVE")
            sim_score = face_data.get("similarity_score", 0.0)
            
            if match_status == "MISMATCH":
                pts = weights.face_mismatch_weight
                raw_score += pts
                requires_manual_review = True
                factors.append({
                    "code": "BIO_FACE_MISMATCH",
                    "title": "Biometric Facial Mismatch",
                    "description": f"Passenger live portrait does not match document holder photo (Similarity: {sim_score}%)",
                    "severity": "HIGH",
                    "points": pts,
                    "category": "BIOMETRIC"
                })
            elif match_status in ["INCONCLUSIVE", "LOW_QUALITY", "NO_LIVE_CAPTURE"]:
                pts = weights.inconclusive_quality_weight
                raw_score += pts
                requires_manual_review = True
                factors.append({
                    "code": "BIO_INCONCLUSIVE",
                    "title": "Biometric Match Inconclusive",
                    "description": f"Face verification was inconclusive or live capture quality was degraded (Status: {match_status})",
                    "severity": "LOW",
                    "points": pts,
                    "category": "BIOMETRIC"
                })

        # Final Normalized Score (0 - 100)
        final_score = float(round(min(100.0, max(0.0, raw_score)), 1))

        # Risk Level Classification
        if final_score >= 56.0 or any(f["severity"] == "CRITICAL" for f in factors):
            risk_level = "HIGH"
        elif final_score >= 26.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        if requires_manual_review and risk_level == "LOW":
            risk_level = "MANUAL_REVIEW"

        return {
            "risk_score": final_score,
            "risk_level": risk_level,
            "requires_manual_review": requires_manual_review or (risk_level in ["MEDIUM", "HIGH"]),
            "contributing_factors_json": factors,
            "evaluated_at": datetime.now(timezone.utc)
        }
