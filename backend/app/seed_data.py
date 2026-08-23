import os
import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone, timedelta
from PIL import Image, ImageDraw, ImageFont
import numpy as np

from backend.app.core.config import settings
from backend.app.db.session import SessionLocal, engine, Base
from backend.app.core.security import get_password_hash
from backend.app.models.models import (
    User, Document, ExtractedField, MRZResult, ValidationResult,
    TamperingResult, FaceVerificationResult, RegistryCheck,
    Screening, RiskAssessment, AuditLog, RegistryRecord
)
from backend.app.services.mrz_service import calculate_check_digit

def create_synthetic_portrait(name: str, output_path: Path, variation: int = 0) -> None:
    """Generates a synthetic portrait image for document or live webcam testing."""
    img = Image.new('RGB', (200, 240), color=(220 + variation * 5, 225, 235))
    draw = ImageDraw.Draw(img)
    
    # Head & Neck
    skin_colors = [(235, 195, 160), (220, 180, 140), (200, 160, 120)]
    skin = skin_colors[variation % len(skin_colors)]
    
    # Body / Suit
    draw.ellipse([20, 160, 180, 280], fill=(40, 50, 70))
    # Shirt collar
    draw.polygon([(85, 160), (100, 185), (115, 160)], fill=(250, 250, 250))
    # Neck
    draw.rectangle([85, 130, 115, 170], fill=skin)
    # Head
    draw.ellipse([50, 40, 150, 150], fill=skin)
    # Hair
    hair_colors = [(40, 30, 20), (20, 20, 20), (80, 50, 30)]
    draw.ellipse([46, 30, 154, 80], fill=hair_colors[variation % len(hair_colors)])
    # Eyes
    draw.ellipse([70, 85, 84, 95], fill=(255, 255, 255))
    draw.ellipse([74, 87, 80, 93], fill=(30, 30, 30))
    draw.ellipse([116, 85, 130, 95], fill=(255, 255, 255))
    draw.ellipse([120, 87, 126, 93], fill=(30, 30, 30))
    # Nose & Mouth
    draw.line([(100, 95), (96, 110), (104, 110)], fill=(160, 120, 90), width=2)
    draw.line([(85, 125), (115, 125)], fill=(180, 90, 90), width=3)
    
    img.save(output_path, format='JPEG', quality=95)

def create_synthetic_document_image(
    doc_type: str,
    country: str,
    doc_no: str,
    name: str,
    dob: str,
    expiry: str,
    mrz_lines: list,
    output_path: Path,
    tamper_type: str = "NONE"
) -> None:
    """Generates high-resolution synthetic passport / ID page."""
    img = Image.new('RGB', (800, 520), color=(248, 246, 240))
    draw = ImageDraw.Draw(img)
    
    # Document Header Band
    header_color = (25, 45, 80) if country == "IND" else ((20, 60, 40) if country == "GBR" else (70, 30, 30))
    draw.rectangle([0, 0, 800, 60], fill=header_color)
    draw.text((20, 15), f"GOVERNMENT OF {country} • PASSPORT / IDENTITY DOCUMENT", fill=(255, 255, 255))
    draw.text((680, 15), f"TYPE: {doc_type}", fill=(200, 220, 255))
    
    # Decorative Guilloche patterns simulation
    for y in range(80, 400, 20):
        draw.line([(240, y), (780, y)], fill=(235, 230, 220), width=1)
        
    # Portrait Box (Left)
    portrait_box = [30, 90, 220, 320]
    draw.rectangle(portrait_box, outline=(150, 150, 150), width=2, fill=(230, 230, 230))
    
    # Draw mini portrait inside box
    temp_portrait = output_path.parent / f"temp_port_{output_path.stem}.jpg"
    create_synthetic_portrait(name, temp_portrait, variation=1 if tamper_type != "PHOTO_SPLICED" else 2)
    port_img = Image.open(temp_portrait).resize((186, 226))
    img.paste(port_img, (32, 92))
    if temp_portrait.exists():
        temp_portrait.unlink()
        
    # If PHOTO_SPLICED, introduce sharp unnatural cut-and-paste artifact around portrait
    if tamper_type == "PHOTO_SPLICED":
        # Draw harsh mismatched border and noise patch
        draw.rectangle([28, 88, 222, 322], outline=(255, 50, 50), width=3)
        # Spliced watermark inconsistency
        draw.text((40, 330), "[MODIFIED PHOTO ZONE]", fill=(180, 0, 0))

    # Text Fields (VIZ)
    fields = [
        ("PASSPORT NO / DOC NO", doc_no),
        ("SURNAME / NOM", name.split()[-1] if ' ' in name else name),
        ("GIVEN NAMES / PRENOMS", name.split()[0] if ' ' in name else ""),
        ("NATIONALITY / NATIONALITE", country),
        ("DATE OF BIRTH / DATE DE NAISSANCE", dob),
        ("DATE OF EXPIRY / DATE D'EXPIRATION", expiry),
        ("AUTHORITY / AUTORITE", f"MHA / SSB {country}")
    ]
    
    y_pos = 85
    for label, val in fields:
        draw.text((250, y_pos), label, fill=(110, 120, 135))
        draw.text((250, y_pos + 14), val, fill=(15, 23, 42))
        y_pos += 42
        
    # MRZ Strip (Bottom 100px)
    draw.rectangle([0, 420, 800, 520], fill=(235, 238, 242))
    draw.line([(0, 420), (800, 420)], fill=(180, 190, 205), width=2)
    
    # Draw Monospaced MRZ characters
    if len(mrz_lines) >= 2:
        draw.text((30, 435), mrz_lines[0], fill=(20, 25, 35))
        draw.text((30, 470), mrz_lines[1], fill=(20, 25, 35))
    elif len(mrz_lines) == 1:
        draw.text((30, 445), mrz_lines[0], fill=(20, 25, 35))

    # If BLURRY, apply blur
    if tamper_type == "BLURRY":
        from PIL import ImageFilter
        img = img.filter(ImageFilter.GaussianBlur(radius=3.5))

    img.save(output_path, format='JPEG', quality=90)

def seed_database():
    """Initializes database tables, users, mock registries, and 10 synthetic test cases."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Seed Default Users
    users_data = [
        {"username": "officer", "email": "officer@ssb.gov.in", "password": "officer123", "full_name": "Inspector Vikram Singh", "role": "OFFICER", "badge_number": "SSB-8492"},
        {"username": "supervisor", "email": "supervisor@ssb.gov.in", "password": "super123", "full_name": "Commander Anita Sharma", "role": "SUPERVISOR", "badge_number": "SSB-SUP-104"},
        {"username": "admin", "email": "admin@ssb.gov.in", "password": "admin123", "full_name": "SysAdmin R. K. Verma", "role": "ADMIN", "badge_number": "SSB-SYS-001"}
    ]
    for u in users_data:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            user = User(
                username=u["username"],
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                badge_number=u["badge_number"],
                is_active=True
            )
            db.add(user)
    db.commit()

    # 2. Seed Simulated Registry Records
    registry_entries = [
        {"registry_type": "STOLEN_PASSPORT", "document_number": "Z8819203", "full_name": "UNKNOWN", "reason": "Reported stolen in international transit (Interpol SLTD Ref #SLTD-8819)", "severity": "CRITICAL"},
        {"registry_type": "STOLEN_PASSPORT", "document_number": "K9920144", "full_name": "UNKNOWN", "reason": "Lost credential logged at checkpoint departure gate", "severity": "HIGH"},
        {"registry_type": "WANTED_PERSON", "document_number": "N7710293", "full_name": "VIKTOR KOROL", "date_of_birth": "1980-04-12", "nationality": "RUS", "reason": "Interpol Red Notice: Transnational Fraud & Financial Forgery Syndicate", "severity": "CRITICAL"},
        {"registry_type": "WANTED_PERSON", "document_number": "M6650123", "full_name": "FARHAN MALIK", "date_of_birth": "1985-09-22", "nationality": "PAK", "reason": "National Security Advisory: High-risk border surveillance subject", "severity": "CRITICAL"},
        {"registry_type": "REVOKED_DOCUMENT", "document_number": "R4419082", "full_name": "ALEXEI PETROV", "reason": "Passport revoked by issuing consulate due to duplicate fraudulent application", "severity": "HIGH"}
    ]
    for reg in registry_entries:
        existing = db.query(RegistryRecord).filter(
            RegistryRecord.registry_type == reg["registry_type"],
            RegistryRecord.document_number == reg.get("document_number")
        ).first()
        if not existing:
            rec = RegistryRecord(
                registry_type=reg["registry_type"],
                document_number=reg.get("document_number"),
                full_name=reg.get("full_name"),
                date_of_birth=reg.get("date_of_birth"),
                nationality=reg.get("nationality"),
                reason=reg["reason"],
                severity=reg["severity"],
                is_active=True
            )
            db.add(rec)
    db.commit()

    # 3. Generate 10 Synthetic Test Cases
    officer_user = db.query(User).filter(User.username == "officer").first()
    officer_id = officer_user.id if officer_user else None

    test_cases = [
        {
            "title": "Clean Valid Indian Passport",
            "doc_type": "PASSPORT", "country": "IND", "doc_no": "P1284920", "name": "RAJESH SHARMA",
            "dob": "1988-06-14", "expiry": "2028-01-09", "gender": "M",
            "tamper_type": "NONE", "face_match": True,
            "status": "CLEARED", "officer_notes": "All ICAO check digits verified. Face biometric matched. Subject cleared."
        },
        {
            "title": "Expired British Passport",
            "doc_type": "PASSPORT", "country": "GBR", "doc_no": "G9921045", "name": "JOHN DAVIS",
            "dob": "1975-11-20", "expiry": "2021-05-12", "gender": "M",
            "tamper_type": "NONE", "face_match": True,
            "status": "REFER_SECONDARY", "officer_notes": "Passport expired 2021. Referred to secondary inspection for emergency transit visa check."
        },
        {
            "title": "Tampered MRZ Checksum German Passport",
            "doc_type": "PASSPORT", "country": "DEU", "doc_no": "C3391028", "name": "MARKUS WEBER",
            "dob": "1982-03-08", "expiry": "2029-08-15", "gender": "M",
            "tamper_type": "MRZ_TAMPERED", "face_match": True,
            "status": "REJECTED", "officer_notes": "Mathematical 7-3-1 check digit failure in document number zone. Suspected altered serial."
        },
        {
            "title": "Photo-Replaced US Passport (ELA Discrepancy)",
            "doc_type": "PASSPORT", "country": "USA", "doc_no": "E4401928", "name": "DAVID MILLER",
            "dob": "1990-09-17", "expiry": "2030-10-22", "gender": "M",
            "tamper_type": "PHOTO_SPLICED", "face_match": False,
            "status": "REJECTED", "officer_notes": "Error Level Analysis detected high compression anomaly around portrait perimeter. Physical tampering evident."
        },
        {
            "title": "Biometric Face Mismatch (Impersonator)",
            "doc_type": "PASSPORT", "country": "CAN", "doc_no": "C7719204", "name": "EMILY CLARKE",
            "dob": "1993-04-25", "expiry": "2027-12-30", "gender": "F",
            "tamper_type": "NONE", "face_match": False,
            "status": "REFER_SECONDARY", "officer_notes": "Passenger portrait similarity only 28.4%. Possible lookalike impersonator."
        },
        {
            "title": "Interpol Red Notice Watchlist Hit",
            "doc_type": "PASSPORT", "country": "RUS", "doc_no": "N7710293", "name": "VIKTOR KOROL",
            "dob": "1980-04-12", "expiry": "2026-08-30", "gender": "M",
            "tamper_type": "NONE", "face_match": True,
            "status": "DETAINED", "officer_notes": "Immediate detention. Interpol Red Notice hit for transnational financial forgery syndicate."
        },
        {
            "title": "Interpol Stolen Travel Document (SLTD) Hit",
            "doc_type": "PASSPORT", "country": "FRA", "doc_no": "Z8819203", "name": "PIERRE LAURENT",
            "dob": "1985-02-14", "expiry": "2028-04-19", "gender": "M",
            "tamper_type": "NONE", "face_match": True,
            "status": "REJECTED", "officer_notes": "Document serial Z8819203 flagged as stolen in international transit."
        },
        {
            "title": "Compounding Anomalies (Expired + ELA + MRZ Mismatch)",
            "doc_type": "PASSPORT", "country": "SGP", "doc_no": "S5501928", "name": "ALAN TEO",
            "dob": "1978-08-19", "expiry": "2020-03-15", "gender": "M",
            "tamper_type": "PHOTO_SPLICED", "face_match": False,
            "status": "REJECTED", "officer_notes": "High fraud probability: Document is expired, photo region spliced, and MRZ check digits fail."
        },
        {
            "title": "Low-Quality / Degraded Scanned Document",
            "doc_type": "NATIONAL_ID", "country": "IND", "doc_no": "ID8849201", "name": "SURESH KUMAR",
            "dob": "1984-12-05", "expiry": "2032-11-20", "gender": "M",
            "tamper_type": "BLURRY", "face_match": True,
            "status": "IN_PROGRESS", "officer_notes": "Scan quality degraded. Request physical credential re-inspection."
        },
        {
            "title": "Revoked Border Entry Permit",
            "doc_type": "PERMIT", "country": "IND", "doc_no": "R4419082", "name": "ALEXEI PETROV",
            "dob": "1986-07-11", "expiry": "2027-09-01", "gender": "M",
            "tamper_type": "NONE", "face_match": True,
            "status": "REJECTED", "officer_notes": "Permit #R4419082 cancelled by Home Ministry due to duplicate application."
        }
    ]

    for i, tc in enumerate(test_cases):
        sample_filename = f"sample_case_{i+1}.jpg"
        sample_path = settings.SAMPLES_DIR / sample_filename
        
        # Calculate Check Digits
        doc_no_raw = tc["doc_no"][:9].ljust(9, '<')
        doc_cd = str(calculate_check_digit(doc_no_raw))
        if tc["tamper_type"] == "MRZ_TAMPERED":
            # Tamper the check digit
            doc_cd = "0" if doc_cd != "0" else "9"
            
        dob_mrz = tc["dob"].replace("-", "")[2:8]
        dob_cd = str(calculate_check_digit(dob_mrz))
        exp_mrz = tc["expiry"].replace("-", "")[2:8]
        exp_cd = str(calculate_check_digit(exp_mrz))
        comp_str = doc_no_raw + doc_cd + dob_mrz + dob_cd + exp_mrz + exp_cd + "<" * 15
        comp_cd = str(calculate_check_digit(comp_str))
        
        surname = tc["name"].split()[-1] if ' ' in tc["name"] else tc["name"]
        given = tc["name"].split()[0] if ' ' in tc["name"] else ""
        l1 = f"P<{tc['country']}{surname}<<{given}".ljust(44, '<')[:44]
        l2 = f"{doc_no_raw}{doc_cd}{tc['country']}{dob_mrz}{dob_cd}{tc['gender']}{exp_mrz}{exp_cd}{'<'*14}{comp_cd}"[:44]
        
        # Generate the physical image artifact
        create_synthetic_document_image(
            doc_type=tc["doc_type"],
            country=tc["country"],
            doc_no=tc["doc_no"],
            name=tc["name"],
            dob=tc["dob"],
            expiry=tc["expiry"],
            mrz_lines=[l1, l2],
            output_path=sample_path,
            tamper_type=tc["tamper_type"]
        )
        
        # Compute SHA-256 hash
        with open(sample_path, "rb") as f:
            sha256_hash = hashlib.sha256(f.read()).hexdigest()

        # Check if already seeded in DB
        existing_doc = db.query(Document).filter(Document.original_filename == sample_filename).first()
        if not existing_doc:
            doc = Document(
                document_type=tc["doc_type"],
                original_filename=sample_filename,
                file_path=f"/storage/samples/{sample_filename}",
                file_mime_type="image/jpeg",
                file_size_bytes=sample_path.stat().st_size,
                sha256_hash=sha256_hash,
                uploaded_at=datetime.now(timezone.utc) - timedelta(hours=i * 2)
            )
            db.add(doc)
            db.flush()

            # Extracted Fields
            ext = ExtractedField(
                document_id=doc.id,
                document_number=tc["doc_no"],
                full_name=tc["name"],
                surname=surname,
                given_names=given,
                nationality=tc["country"],
                date_of_birth=tc["dob"],
                gender=tc["gender"],
                issue_date="2018-01-10",
                expiry_date=tc["expiry"],
                issuing_country=tc["country"],
                extraction_confidence=0.65 if tc["tamper_type"] == "BLURRY" else 0.96
            )
            db.add(ext)

            # MRZ Record
            is_valid_mrz = tc["tamper_type"] != "MRZ_TAMPERED"
            mrz = MRZResult(
                document_id=doc.id,
                mrz_detected=True,
                mrz_type="TD3",
                line1=l1,
                line2=l2,
                valid_doc_number_checksum=is_valid_mrz,
                valid_dob_checksum=True,
                valid_expiry_checksum=True,
                valid_composite_checksum=is_valid_mrz,
                all_checksums_valid=is_valid_mrz,
                matches_viz_fields=True,
                checksum_details_json={"doc_cd": doc_cd, "dob_cd": dob_cd, "exp_cd": exp_cd}
            )
            db.add(mrz)

            # Validation
            is_exp = datetime.strptime(tc["expiry"], "%Y-%m-%d") < datetime.now()
            val = ValidationResult(
                document_id=doc.id,
                is_expired=is_exp,
                is_future_issue_date=False,
                is_valid_age=True,
                is_valid_doc_number_format=True,
                passed_all_rules=not is_exp and is_valid_mrz,
                rule_evaluations_json=[
                    {"rule": "EXPIRY_CHECK", "status": "FAIL" if is_exp else "PASS", "severity": "HIGH" if is_exp else "NONE"}
                ]
            )
            db.add(val)

            # Forensics
            is_spliced = tc["tamper_type"] == "PHOTO_SPLICED"
            ela_score = 0.78 if is_spliced else (0.12 if tc["tamper_type"] != "BLURRY" else 0.05)
            tamper = TamperingResult(
                document_id=doc.id,
                ela_anomaly_score=ela_score,
                ela_heatmap_path=f"/storage/forensics/ela_{doc.id}.jpg" if is_spliced else None,
                photo_splicing_score=0.72 if is_spliced else 0.08,
                noise_variance_score=0.65 if is_spliced else 0.10,
                metadata_manipulation_flag=is_spliced,
                has_tampering_evidence=is_spliced,
                suspicious_regions_json=[{"region": "Photo Boundary", "score": 0.85}] if is_spliced else []
            )
            db.add(tamper)

            # Face Verification
            face_sim = 88.4 if tc["face_match"] and tc["tamper_type"] != "BLURRY" else (24.2 if not tc["face_match"] else 52.0)
            face_status = "MATCH" if face_sim >= 70.0 else ("MISMATCH" if face_sim < 50.0 else "INCONCLUSIVE")
            face = FaceVerificationResult(
                document_id=doc.id,
                doc_face_detected=True,
                doc_face_crop_path=f"/storage/portraits/doc_{doc.id}.jpg",
                live_face_detected=True,
                live_face_path=f"/storage/portraits/live_{doc.id}.jpg",
                similarity_score=face_sim,
                match_status=face_status,
                confidence=0.92
            )
            db.add(face)

            # Registry Check
            reg_status = "CLEAR"
            matched_reg = None
            if tc["name"] == "VIKTOR KOROL":
                reg_status = "HIT_WANTED"
                matched_reg = "Interpol Red Notice & National Watchlist"
            elif tc["doc_no"] == "Z8819203":
                reg_status = "HIT_STOLEN"
                matched_reg = "Interpol Stolen & Lost Travel Documents (SLTD)"
            elif tc["doc_no"] == "R4419082":
                reg_status = "HIT_REVOKED"
                matched_reg = "National Revoked Document Registry"

            reg_chk = RegistryCheck(
                document_id=doc.id,
                check_status=reg_status,
                matched_registry=matched_reg,
                severity="CRITICAL" if reg_status != "CLEAR" else "NONE",
                match_details_json={"registry": matched_reg} if matched_reg else {}
            )
            db.add(reg_chk)

            # Risk Assessment calculation
            risk_score = 8.0  # Clean baseline
            if reg_status != "CLEAR":
                risk_score = 92.0
            elif is_spliced and is_exp:
                risk_score = 88.0
            elif is_spliced:
                risk_score = 75.0
            elif not is_valid_mrz:
                risk_score = 65.0
            elif not tc["face_match"]:
                risk_score = 62.0
            elif is_exp:
                risk_score = 45.0
            elif tc["tamper_type"] == "BLURRY":
                risk_score = 30.0

            risk_level = "HIGH" if risk_score >= 56.0 else ("MEDIUM" if risk_score >= 26.0 else "LOW")
            if tc["tamper_type"] == "BLURRY":
                risk_level = "MANUAL_REVIEW"

            factors = []
            if reg_status != "CLEAR":
                factors.append({"category": "REGISTRY", "title": "Watchlist/Registry Match", "description": matched_reg, "severity": "CRITICAL", "points": 85.0})
            if is_spliced:
                factors.append({"category": "FORENSICS", "title": "Photo Tampering / ELA Anomaly", "description": "High compression disparity detected", "severity": "HIGH", "points": 40.0})
            if not is_valid_mrz:
                factors.append({"category": "MRZ", "title": "ICAO 9303 Checksum Mismatch", "description": "7-3-1 weight check digit failed", "severity": "HIGH", "points": 45.0})
            if not tc["face_match"]:
                factors.append({"category": "BIOMETRIC", "title": "Facial Biometric Mismatch", "description": f"Similarity score {face_sim}%", "severity": "HIGH", "points": 45.0})
            if is_exp:
                factors.append({"category": "EXPIRY", "title": "Expired Travel Document", "description": f"Document expired on {tc['expiry']}", "severity": "MEDIUM", "points": 35.0})

            # Screening
            screening = Screening(
                document_id=doc.id,
                officer_id=officer_id,
                status=tc["status"],
                officer_notes=tc["officer_notes"],
                started_at=datetime.now(timezone.utc) - timedelta(hours=i * 2),
                completed_at=datetime.now(timezone.utc) - timedelta(hours=i * 2 - 1)
            )
            db.add(screening)
            db.flush()

            risk_rec = RiskAssessment(
                screening_id=screening.id,
                risk_score=risk_score,
                risk_level=risk_level,
                requires_manual_review=risk_level in ["HIGH", "MEDIUM", "MANUAL_REVIEW"],
                contributing_factors_json=factors,
                evaluated_at=datetime.now(timezone.utc)
            )
            db.add(risk_rec)

    db.commit()
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
