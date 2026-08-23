import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="OFFICER", nullable=False)  # ADMIN, SUPERVISOR, OFFICER
    badge_number = Column(String(50), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    screenings = relationship("Screening", back_populates="officer")
    audit_logs = relationship("AuditLog", back_populates="user")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_type = Column(String(50), nullable=False)  # PASSPORT, VISA, NATIONAL_ID, DRIVING_LICENCE, PERMIT
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    sha256_hash = Column(String(64), index=True, nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    extracted_fields = relationship("ExtractedField", back_populates="document", uselist=False, cascade="all, delete-orphan")
    mrz_result = relationship("MRZResult", back_populates="document", uselist=False, cascade="all, delete-orphan")
    validation_result = relationship("ValidationResult", back_populates="document", uselist=False, cascade="all, delete-orphan")
    tampering_result = relationship("TamperingResult", back_populates="document", uselist=False, cascade="all, delete-orphan")
    face_result = relationship("FaceVerificationResult", back_populates="document", uselist=False, cascade="all, delete-orphan")
    registry_check = relationship("RegistryCheck", back_populates="document", uselist=False, cascade="all, delete-orphan")
    screening = relationship("Screening", back_populates="document", uselist=False)

class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    document_number = Column(String(50), nullable=True)
    full_name = Column(String(200), nullable=True)
    surname = Column(String(100), nullable=True)
    given_names = Column(String(100), nullable=True)
    nationality = Column(String(50), nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    issue_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    issuing_country = Column(String(50), nullable=True)
    raw_fields_json = Column(JSON, nullable=True)
    extraction_confidence = Column(Float, default=0.0, nullable=False)

    document = relationship("Document", back_populates="extracted_fields")

class MRZResult(Base):
    __tablename__ = "mrz_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    mrz_detected = Column(Boolean, default=False, nullable=False)
    mrz_type = Column(String(20), nullable=True)  # TD1, TD2, TD3
    line1 = Column(String(50), nullable=True)
    line2 = Column(String(50), nullable=True)
    line3 = Column(String(50), nullable=True)
    valid_doc_number_checksum = Column(Boolean, default=False, nullable=False)
    valid_dob_checksum = Column(Boolean, default=False, nullable=False)
    valid_expiry_checksum = Column(Boolean, default=False, nullable=False)
    valid_composite_checksum = Column(Boolean, default=False, nullable=False)
    all_checksums_valid = Column(Boolean, default=False, nullable=False)
    matches_viz_fields = Column(Boolean, default=False, nullable=False)
    checksum_details_json = Column(JSON, nullable=True)

    document = relationship("Document", back_populates="mrz_result")

class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    is_expired = Column(Boolean, default=False, nullable=False)
    is_future_issue_date = Column(Boolean, default=False, nullable=False)
    is_valid_age = Column(Boolean, default=True, nullable=False)
    is_valid_doc_number_format = Column(Boolean, default=True, nullable=False)
    passed_all_rules = Column(Boolean, default=False, nullable=False)
    rule_evaluations_json = Column(JSON, nullable=True)

    document = relationship("Document", back_populates="validation_result")

class TamperingResult(Base):
    __tablename__ = "tampering_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    ela_anomaly_score = Column(Float, default=0.0, nullable=False)
    ela_heatmap_path = Column(String(500), nullable=True)
    photo_splicing_score = Column(Float, default=0.0, nullable=False)
    noise_variance_score = Column(Float, default=0.0, nullable=False)
    metadata_manipulation_flag = Column(Boolean, default=False, nullable=False)
    has_tampering_evidence = Column(Boolean, default=False, nullable=False)
    suspicious_regions_json = Column(JSON, nullable=True)

    document = relationship("Document", back_populates="tampering_result")

class FaceVerificationResult(Base):
    __tablename__ = "face_verification_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    doc_face_detected = Column(Boolean, default=False, nullable=False)
    doc_face_crop_path = Column(String(500), nullable=True)
    live_face_detected = Column(Boolean, default=False, nullable=False)
    live_face_path = Column(String(500), nullable=True)
    similarity_score = Column(Float, default=0.0, nullable=False)
    match_status = Column(String(50), default="INCONCLUSIVE", nullable=False)  # MATCH, MISMATCH, INCONCLUSIVE, LOW_QUALITY
    confidence = Column(Float, default=0.0, nullable=False)

    document = relationship("Document", back_populates="face_result")

class RegistryCheck(Base):
    __tablename__ = "registry_checks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    check_status = Column(String(50), default="CLEAR", nullable=False)  # CLEAR, HIT_STOLEN, HIT_WANTED, HIT_REVOKED
    matched_registry = Column(String(100), nullable=True)
    matched_record_id = Column(String(100), nullable=True)
    severity = Column(String(20), default="NONE", nullable=False)  # NONE, LOW, MEDIUM, HIGH, CRITICAL
    match_details_json = Column(JSON, nullable=True)

    document = relationship("Document", back_populates="registry_check")

class Screening(Base):
    __tablename__ = "screenings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    officer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="IN_PROGRESS", nullable=False)  # IN_PROGRESS, CLEARED, REFER_SECONDARY, REJECTED, DETAINED
    officer_notes = Column(Text, nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    document = relationship("Document", back_populates="screening")
    officer = relationship("User", back_populates="screenings")
    risk_assessment = relationship("RiskAssessment", back_populates="screening", uselist=False, cascade="all, delete-orphan")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    screening_id = Column(String(36), ForeignKey("screenings.id", ondelete="CASCADE"), nullable=False, unique=True)
    risk_score = Column(Float, default=0.0, nullable=False)
    risk_level = Column(String(20), default="LOW", nullable=False)  # LOW, MEDIUM, HIGH, MANUAL_REVIEW
    requires_manual_review = Column(Boolean, default=False, nullable=False)
    contributing_factors_json = Column(JSON, nullable=True)
    evaluated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    screening = relationship("Screening", back_populates="risk_assessment")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action_type = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details_json = Column(JSON, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1", nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="audit_logs")

class RegistryRecord(Base):
    __tablename__ = "registry_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    registry_type = Column(String(50), nullable=False)  # STOLEN_PASSPORT, WANTED_PERSON, REVOKED_DOCUMENT
    document_number = Column(String(50), index=True, nullable=True)
    full_name = Column(String(200), index=True, nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    nationality = Column(String(50), nullable=True)
    reason = Column(String(500), nullable=False)
    severity = Column(String(20), default="HIGH", nullable=False)  # MEDIUM, HIGH, CRITICAL
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
