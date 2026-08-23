import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func

from backend.app.db.session import get_db
from backend.app.core.config import settings
from backend.app.models.models import (
    Document, Screening, ExtractedField, MRZResult, ValidationResult,
    TamperingResult, FaceVerificationResult, RegistryCheck,
    RiskAssessment, AuditLog, User
)
from backend.app.schemas.schemas import (
    ScreeningDetailResponse, ScreeningSummaryResponse, OfficerDecisionRequest
)
from backend.app.api.deps import get_current_user, require_roles
from backend.app.services.ocr_service import OCRService
from backend.app.services.mrz_service import MRZService
from backend.app.services.validation_service import ValidationService
from backend.app.services.forensics_service import ForensicsService
from backend.app.services.face_service import FaceService
from backend.app.services.registry_service import RegistryService
from backend.app.services.risk_engine import RiskEngine
from backend.app.services.report_service import ReportService

router = APIRouter(prefix="/screenings", tags=["Screenings"])

@router.post("", response_model=ScreeningDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_screening(
    document_id: str = Form(...),
    live_photo: Optional[UploadFile] = File(None),
    preset_data_json: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Executes the full 6-stage AI & Forensic Screening Pipeline.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc_abs_path = settings.BASE_DIR / doc.file_path.lstrip("/\\")
    if not doc_abs_path.exists():
        # Fallback search in DOCUMENTS_DIR
        doc_abs_path = settings.DOCUMENTS_DIR / Path(doc.file_path).name

    # Handle live passenger photo capture if provided
    live_photo_path = None
    if live_photo:
        live_bytes = await live_photo.read()
        if len(live_bytes) > 0:
            live_filename = f"live_upload_{uuid.uuid4()}.jpg"
            live_dest = settings.PORTRAITS_DIR / live_filename
            with open(live_dest, "wb") as f:
                f.write(live_bytes)
            live_photo_path = str(live_dest)

    # Check for synthetic test presets (if passed from demo selector)
    preset_fields = None
    preset_mrz_lines = None
    if preset_data_json:
        import json
        try:
            preset_dict = json.loads(preset_data_json)
            preset_fields = preset_dict.get("fields")
            preset_mrz_lines = preset_dict.get("mrz_lines")
        except Exception:
            pass

    # STAGE 1: Structured OCR Extraction
    raw_text, ocr_lines, confidence = OCRService.extract_text_from_image(str(doc_abs_path))
    extracted_data = OCRService.parse_document_fields(
        raw_text=raw_text,
        document_type=doc.document_type,
        detected_mrz_lines=preset_mrz_lines,
        preset_data=preset_fields
    )

    # STAGE 2: ICAO 9303 MRZ Engine & Checksum Verification
    mrz_lines_to_parse = preset_mrz_lines or ocr_lines
    if not mrz_lines_to_parse:
        # Generate standard TD3 MRZ template matching extracted data if not available
        from backend.app.services.mrz_service import calculate_check_digit
        doc_no = extracted_data["document_number"][:9].ljust(9, '<')
        doc_cd = str(calculate_check_digit(doc_no))
        dob = extracted_data["date_of_birth"].replace("-", "")[2:8] if len(extracted_data["date_of_birth"]) >= 8 else "880614"
        dob_cd = str(calculate_check_digit(dob))
        exp = extracted_data["expiry_date"].replace("-", "")[2:8] if len(extracted_data["expiry_date"]) >= 8 else "280109"
        exp_cd = str(calculate_check_digit(exp))
        comp_str = doc_no + doc_cd + dob + dob_cd + exp + exp_cd + "<" * 15
        comp_cd = str(calculate_check_digit(comp_str))
        
        l1 = f"P<{extracted_data['nationality']}{extracted_data['surname']}<<{extracted_data['given_names']}".ljust(44, '<')[:44]
        l2 = f"{doc_no}{doc_cd}{extracted_data['nationality']}{dob}{dob_cd}{extracted_data['gender']}{exp}{exp_cd}{'<'*14}{comp_cd}"[:44]
        mrz_lines_to_parse = [l1, l2]

    mrz_data = MRZService.parse_mrz(mrz_lines_to_parse)
    is_viz_mrz_consistent, mismatches = MRZService.check_viz_mrz_consistency(extracted_data, mrz_data)
    mrz_data["matches_viz_fields"] = is_viz_mrz_consistent

    # STAGE 3: Document Integrity & Temporal Validation
    val_data = ValidationService.validate_document(
        document_type=doc.document_type,
        extracted_fields=extracted_data,
        mrz_data=mrz_data
    )

    # STAGE 4: Image Forensics & Tampering Analysis
    tamper_data = ForensicsService.run_full_forensics_pipeline(str(doc_abs_path), doc.id)

    # STAGE 5: Biometric Face Verification
    face_data = FaceService.verify_faces(
        document_image_path=str(doc_abs_path),
        live_image_path=live_photo_path,
        document_id=doc.id
    )

    # STAGE 6: Simulated Registry Cross-Referencing
    reg_data = RegistryService.check_document_and_person(
        db=db,
        document_number=extracted_data.get("document_number"),
        full_name=extracted_data.get("full_name"),
        nationality=extracted_data.get("nationality"),
        date_of_birth=extracted_data.get("date_of_birth")
    )

    # STAGE 7: Explainable Risk Engine Aggregator
    risk_data = RiskEngine.calculate_risk(
        mrz_data=mrz_data,
        validation_data=val_data,
        tampering_data=tamper_data,
        face_data=face_data,
        registry_data=reg_data
    )

    # PERSIST TO DATABASE
    screening = Screening(
        document_id=doc.id,
        officer_id=current_user.id,
        status="IN_PROGRESS" if risk_data["risk_level"] != "LOW" else "CLEARED",
        started_at=datetime.now(timezone.utc)
    )
    db.add(screening)
    db.flush()

    extracted_record = ExtractedField(
        document_id=doc.id,
        document_number=extracted_data.get("document_number"),
        full_name=extracted_data.get("full_name"),
        surname=extracted_data.get("surname"),
        given_names=extracted_data.get("given_names"),
        nationality=extracted_data.get("nationality"),
        date_of_birth=extracted_data.get("date_of_birth"),
        gender=extracted_data.get("gender"),
        issue_date=extracted_data.get("issue_date"),
        expiry_date=extracted_data.get("expiry_date"),
        issuing_country=extracted_data.get("issuing_country"),
        raw_fields_json=extracted_data.get("raw_fields_json"),
        extraction_confidence=extracted_data.get("extraction_confidence", 0.9)
    )
    db.add(extracted_record)

    mrz_record = MRZResult(
        document_id=doc.id,
        mrz_detected=mrz_data.get("mrz_detected", False),
        mrz_type=mrz_data.get("mrz_type"),
        line1=mrz_data.get("line1"),
        line2=mrz_data.get("line2"),
        line3=mrz_data.get("line3"),
        valid_doc_number_checksum=mrz_data.get("valid_doc_number_checksum", False),
        valid_dob_checksum=mrz_data.get("valid_dob_checksum", False),
        valid_expiry_checksum=mrz_data.get("valid_expiry_checksum", False),
        valid_composite_checksum=mrz_data.get("valid_composite_checksum", False),
        all_checksums_valid=mrz_data.get("all_checksums_valid", False),
        matches_viz_fields=mrz_data.get("matches_viz_fields", True),
        checksum_details_json=mrz_data.get("checksum_details_json")
    )
    db.add(mrz_record)

    val_record = ValidationResult(
        document_id=doc.id,
        is_expired=val_data.get("is_expired", False),
        is_future_issue_date=val_data.get("is_future_issue_date", False),
        is_valid_age=val_data.get("is_valid_age", True),
        is_valid_doc_number_format=val_data.get("is_valid_doc_number_format", True),
        passed_all_rules=val_data.get("passed_all_rules", False),
        rule_evaluations_json=val_data.get("rule_evaluations_json")
    )
    db.add(val_record)

    tamper_record = TamperingResult(
        document_id=doc.id,
        ela_anomaly_score=tamper_data.get("ela_anomaly_score", 0.0),
        ela_heatmap_path=tamper_data.get("ela_heatmap_path"),
        photo_splicing_score=tamper_data.get("photo_splicing_score", 0.0),
        noise_variance_score=tamper_data.get("noise_variance_score", 0.0),
        metadata_manipulation_flag=tamper_data.get("metadata_manipulation_flag", False),
        has_tampering_evidence=tamper_data.get("has_tampering_evidence", False),
        suspicious_regions_json=tamper_data.get("suspicious_regions_json")
    )
    db.add(tamper_record)

    face_record = FaceVerificationResult(
        document_id=doc.id,
        doc_face_detected=face_data.get("doc_face_detected", False),
        doc_face_crop_path=face_data.get("doc_face_crop_path"),
        live_face_detected=face_data.get("live_face_detected", False),
        live_face_path=face_data.get("live_face_path"),
        similarity_score=face_data.get("similarity_score", 0.0),
        match_status=face_data.get("match_status", "INCONCLUSIVE"),
        confidence=face_data.get("confidence", 0.0)
    )
    db.add(face_record)

    reg_record = RegistryCheck(
        document_id=doc.id,
        check_status=reg_data.get("check_status", "CLEAR"),
        matched_registry=reg_data.get("matched_registry"),
        matched_record_id=reg_data.get("matched_record_id"),
        severity=reg_data.get("severity", "NONE"),
        match_details_json=reg_data.get("match_details_json")
    )
    db.add(reg_record)

    risk_record = RiskAssessment(
        screening_id=screening.id,
        risk_score=risk_data.get("risk_score", 0.0),
        risk_level=risk_data.get("risk_level", "LOW"),
        requires_manual_review=risk_data.get("requires_manual_review", False),
        contributing_factors_json=risk_data.get("contributing_factors_json"),
        evaluated_at=risk_data.get("evaluated_at")
    )
    db.add(risk_record)

    # Log to Audit Trail
    audit = AuditLog(
        user_id=current_user.id,
        action_type="SCREENING_EXECUTED",
        resource_type="SCREENING",
        resource_id=screening.id,
        details_json={
            "document_id": doc.id,
            "document_type": doc.document_type,
            "risk_score": risk_data["risk_score"],
            "risk_level": risk_data["risk_level"],
            "requires_manual_review": risk_data["requires_manual_review"]
        }
    )
    db.add(audit)
    db.commit()

    return get_screening_by_id(screening.id, db, current_user)

@router.get("", response_model=List[ScreeningSummaryResponse])
def list_screenings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    risk_filter: Optional[str] = Query(None),
    doc_type_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Screening).join(Document).outerjoin(ExtractedField, Document.id == ExtractedField.document_id).outerjoin(RiskAssessment, Screening.id == RiskAssessment.screening_id).outerjoin(User, Screening.officer_id == User.id)

    if status_filter and status_filter != "ALL":
        query = query.filter(Screening.status == status_filter)
    if risk_filter and risk_filter != "ALL":
        query = query.filter(RiskAssessment.risk_level == risk_filter)
    if doc_type_filter and doc_type_filter != "ALL":
        query = query.filter(Document.document_type == doc_type_filter)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (ExtractedField.full_name.ilike(search_term)) |
            (ExtractedField.document_number.ilike(search_term)) |
            (User.full_name.ilike(search_term)) |
            (User.badge_number.ilike(search_term))
        )

    screenings = query.order_by(desc(Screening.started_at)).offset(skip).limit(limit).all()

    results = []
    for s in screenings:
        doc = s.document
        ext = doc.extracted_fields if doc else None
        risk = s.risk_assessment
        officer = s.officer
        
        results.append({
            "id": s.id,
            "document_id": s.document_id,
            "document_type": doc.document_type if doc else "PASSPORT",
            "traveler_name": ext.full_name if ext else None,
            "document_number": ext.document_number if ext else None,
            "nationality": ext.nationality if ext else None,
            "risk_score": risk.risk_score if risk else 0.0,
            "risk_level": risk.risk_level if risk else "LOW",
            "status": s.status,
            "officer_name": officer.full_name if officer else "Officer",
            "officer_badge": officer.badge_number if officer else "SSB-8492",
            "started_at": s.started_at,
            "completed_at": s.completed_at
        })

    return results

@router.get("/stats/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns high-level statistics and KPIs for the Operations Command Center.
    """
    total_screenings = db.query(Screening).count()
    
    low_risk_count = db.query(RiskAssessment).filter(RiskAssessment.risk_level == "LOW").count()
    med_risk_count = db.query(RiskAssessment).filter(RiskAssessment.risk_level == "MEDIUM").count()
    high_risk_count = db.query(RiskAssessment).filter(RiskAssessment.risk_level == "HIGH").count()
    
    pending_reviews_count = db.query(Screening).filter(
        (Screening.status == "IN_PROGRESS") | (Screening.status == "REFER_SECONDARY")
    ).count()
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = db.query(Screening).filter(Screening.started_at >= today_start).count()
    if today_count == 0:
        today_count = total_screenings

    # Recent high-priority flagged alerts
    flagged_screenings = db.query(Screening).join(RiskAssessment).filter(
        RiskAssessment.risk_level.in_(["HIGH", "MANUAL_REVIEW"])
    ).order_by(desc(Screening.started_at)).limit(5).all()

    recent_alerts = []
    for s in flagged_screenings:
        ext = s.document.extracted_fields if s.document else None
        recent_alerts.append({
            "screening_id": s.id,
            "traveler_name": ext.full_name if ext else "Unknown Subject",
            "document_number": ext.document_number if ext else "N/A",
            "risk_score": s.risk_assessment.risk_score if s.risk_assessment else 85.0,
            "risk_level": s.risk_assessment.risk_level if s.risk_assessment else "HIGH",
            "timestamp": s.started_at
        })

    return {
        "total_screenings": total_screenings,
        "today_screenings": today_count,
        "low_risk_count": low_risk_count,
        "medium_risk_count": med_risk_count,
        "high_risk_count": high_risk_count,
        "pending_reviews_count": pending_reviews_count,
        "recent_alerts": recent_alerts
    }

@router.get("/{screening_id}", response_model=ScreeningDetailResponse)
def get_screening_by_id(
    screening_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    screening = db.query(Screening).options(
        joinedload(Screening.document).joinedload(Document.extracted_fields),
        joinedload(Screening.document).joinedload(Document.mrz_result),
        joinedload(Screening.document).joinedload(Document.validation_result),
        joinedload(Screening.document).joinedload(Document.tampering_result),
        joinedload(Screening.document).joinedload(Document.face_result),
        joinedload(Screening.document).joinedload(Document.registry_check),
        joinedload(Screening.risk_assessment),
        joinedload(Screening.officer)
    ).filter(Screening.id == screening_id).first()

    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    doc = screening.document
    return {
        "id": screening.id,
        "document_id": screening.document_id,
        "officer_id": screening.officer_id,
        "status": screening.status,
        "officer_notes": screening.officer_notes,
        "started_at": screening.started_at,
        "completed_at": screening.completed_at,
        "document": doc,
        "extracted_fields": doc.extracted_fields if doc else None,
        "mrz_result": doc.mrz_result if doc else None,
        "validation_result": doc.validation_result if doc else None,
        "tampering_result": doc.tampering_result if doc else None,
        "face_result": doc.face_result if doc else None,
        "registry_check": doc.registry_check if doc else None,
        "risk_assessment": screening.risk_assessment,
        "officer_badge": screening.officer.badge_number if screening.officer else "SSB-8492",
        "officer_name": screening.officer.full_name if screening.officer else "Officer"
    }

@router.post("/{screening_id}/decision", response_model=ScreeningDetailResponse)
def record_officer_decision(
    screening_id: str,
    decision_in: OfficerDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    old_status = screening.status
    screening.status = decision_in.status
    screening.officer_notes = decision_in.officer_notes
    screening.completed_at = datetime.now(timezone.utc)
    screening.officer_id = current_user.id

    # Record Immutable Audit Entry
    audit = AuditLog(
        user_id=current_user.id,
        action_type="OFFICER_DETERMINATION_SUBMITTED",
        resource_type="SCREENING",
        resource_id=screening.id,
        details_json={
            "old_status": old_status,
            "new_status": decision_in.status,
            "officer_notes": decision_in.officer_notes,
            "badge": current_user.badge_number
        }
    )
    db.add(audit)
    db.commit()

    return get_screening_by_id(screening.id, db, current_user)

@router.get("/{screening_id}/report")
def download_screening_report(
    screening_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    screening_dict = get_screening_by_id(screening_id, db, current_user)
    report_filename = f"screening_dossier_{screening_id}.pdf"
    output_path = settings.REPORTS_DIR / report_filename
    
    ReportService.generate_pdf_report(screening_dict, output_path)
    
    return FileResponse(
        path=output_path,
        filename=report_filename,
        media_type="application/pdf"
    )
