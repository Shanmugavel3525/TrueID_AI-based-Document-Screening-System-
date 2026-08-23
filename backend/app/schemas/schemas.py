from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: str = "OFFICER"  # ADMIN, SUPERVISOR, OFFICER
    badge_number: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    badge_number: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Extracted Fields Schemas
class ExtractedFieldsSchema(BaseModel):
    document_number: Optional[str] = None
    full_name: Optional[str] = None
    surname: Optional[str] = None
    given_names: Optional[str] = None
    nationality: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    issuing_country: Optional[str] = None
    raw_fields_json: Optional[Dict[str, Any]] = None
    extraction_confidence: float = 0.0

    class Config:
        from_attributes = True

# MRZ Schemas
class MRZResultSchema(BaseModel):
    mrz_detected: bool = False
    mrz_type: Optional[str] = None
    line1: Optional[str] = None
    line2: Optional[str] = None
    line3: Optional[str] = None
    valid_doc_number_checksum: bool = False
    valid_dob_checksum: bool = False
    valid_expiry_checksum: bool = False
    valid_composite_checksum: bool = False
    all_checksums_valid: bool = False
    matches_viz_fields: bool = False
    checksum_details_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# Validation Schemas
class ValidationResultSchema(BaseModel):
    is_expired: bool = False
    is_future_issue_date: bool = False
    is_valid_age: bool = True
    is_valid_doc_number_format: bool = True
    passed_all_rules: bool = False
    rule_evaluations_json: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

# Forensics / Tampering Schemas
class SuspiciousRegion(BaseModel):
    region_name: str
    confidence: float
    description: str
    bbox: Optional[List[int]] = None  # [x, y, w, h]

class TamperingResultSchema(BaseModel):
    ela_anomaly_score: float = 0.0
    ela_heatmap_path: Optional[str] = None
    photo_splicing_score: float = 0.0
    noise_variance_score: float = 0.0
    metadata_manipulation_flag: bool = False
    has_tampering_evidence: bool = False
    suspicious_regions_json: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

# Face Verification Schemas
class FaceVerificationSchema(BaseModel):
    doc_face_detected: bool = False
    doc_face_crop_path: Optional[str] = None
    live_face_detected: bool = False
    live_face_path: Optional[str] = None
    similarity_score: float = 0.0
    match_status: str = "INCONCLUSIVE"  # MATCH, MISMATCH, INCONCLUSIVE, LOW_QUALITY
    confidence: float = 0.0

    class Config:
        from_attributes = True

# Registry Schemas
class RegistryCheckSchema(BaseModel):
    check_status: str = "CLEAR"  # CLEAR, HIT_STOLEN, HIT_WANTED, HIT_REVOKED
    matched_registry: Optional[str] = None
    matched_record_id: Optional[str] = None
    severity: str = "NONE"  # NONE, LOW, MEDIUM, HIGH, CRITICAL
    match_details_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class RegistryRecordCreate(BaseModel):
    registry_type: str  # STOLEN_PASSPORT, WANTED_PERSON, REVOKED_DOCUMENT
    document_number: Optional[str] = None
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    reason: str
    severity: str = "HIGH"

class RegistryRecordResponse(BaseModel):
    id: str
    registry_type: str
    document_number: Optional[str] = None
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    reason: str
    severity: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Risk Schemas
class RiskFactor(BaseModel):
    code: str
    title: str
    description: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    points: float
    category: str  # MRZ, EXPIRY, FORENSICS, BIOMETRIC, REGISTRY, FORMAT

class RiskAssessmentSchema(BaseModel):
    risk_score: float
    risk_level: str  # LOW, MEDIUM, HIGH, MANUAL_REVIEW
    requires_manual_review: bool
    contributing_factors_json: Optional[List[Dict[str, Any]]] = None
    evaluated_at: datetime

    class Config:
        from_attributes = True

# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    document_type: str
    original_filename: str
    file_path: str
    file_mime_type: str
    file_size_bytes: int
    sha256_hash: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Screening Schemas
class ScreeningDetailResponse(BaseModel):
    id: str
    document_id: str
    officer_id: Optional[str] = None
    status: str
    officer_notes: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    document: DocumentResponse
    extracted_fields: Optional[ExtractedFieldsSchema] = None
    mrz_result: Optional[MRZResultSchema] = None
    validation_result: Optional[ValidationResultSchema] = None
    tampering_result: Optional[TamperingResultSchema] = None
    face_result: Optional[FaceVerificationSchema] = None
    registry_check: Optional[RegistryCheckSchema] = None
    risk_assessment: Optional[RiskAssessmentSchema] = None
    officer_badge: Optional[str] = None
    officer_name: Optional[str] = None

    class Config:
        from_attributes = True

class ScreeningSummaryResponse(BaseModel):
    id: str
    document_id: str
    document_type: str
    traveler_name: Optional[str] = None
    document_number: Optional[str] = None
    nationality: Optional[str] = None
    risk_score: float = 0.0
    risk_level: str = "LOW"
    status: str = "IN_PROGRESS"
    officer_name: Optional[str] = None
    officer_badge: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

class OfficerDecisionRequest(BaseModel):
    status: str  # CLEARED, REFER_SECONDARY, REJECTED, DETAINED
    officer_notes: str

# Audit Schemas
class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    username: Optional[str] = None
    action_type: str
    resource_type: str
    resource_id: Optional[str] = None
    details_json: Optional[Dict[str, Any]] = None
    ip_address: str
    timestamp: datetime

    class Config:
        from_attributes = True

# Risk Weight Settings
class RiskWeightSettings(BaseModel):
    mrz_mismatch_weight: float = 45.0
    photo_splicing_weight: float = 40.0
    ela_anomaly_weight: float = 35.0
    face_mismatch_weight: float = 45.0
    expired_doc_weight: float = 35.0
    stolen_doc_weight: float = 80.0
    watchlist_hit_weight: float = 85.0
    future_date_weight: float = 40.0
    viz_mrz_mismatch_weight: float = 30.0
    inconclusive_quality_weight: float = 15.0

# Forward reference resolution
Token.model_rebuild()
