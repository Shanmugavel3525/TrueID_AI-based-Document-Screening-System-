import os
from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def safe_val(obj, key, default="—"):
    if obj is None:
        return default
    if isinstance(obj, dict):
        val = obj.get(key, default)
    else:
        val = getattr(obj, key, default)
    return str(val) if val is not None else default

def safe_obj(obj, key):
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj.get(key)
    return getattr(obj, key, None)

class ReportService:
    @staticmethod
    def generate_pdf_report(screening_data: dict, output_path: Path) -> str:
        """
        Generates a comprehensive forensic inspection dossier PDF.
        """
        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=colors.HexColor('#0f172a'),
            alignment=1,  # Center
            spaceAfter=3
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            textColor=colors.HexColor('#475569'),
            alignment=1,
            spaceAfter=6
        )
        proto_badge_style = ParagraphStyle(
            'ProtoBadge',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=colors.HexColor('#b45309'),
            alignment=1,
            spaceAfter=4
        )
        heading_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=10.5,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=6,
            spaceAfter=4
        )
        normal_style = ParagraphStyle(
            'ReportNormal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            textColor=colors.HexColor('#334155'),
            leading=10.5
        )
        bold_label = ParagraphStyle(
            'BoldLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=colors.HexColor('#0f172a')
        )

        story = []

        # 1. Header with Prototype Indicator
        story.append(Paragraph("PROTOTYPE MODEL SYSTEM • FOR DEMONSTRATION & EVALUATION ONLY", proto_badge_style))
        story.append(Paragraph("AI-BASED DOCUMENT & IDENTITY SCREENING DOSSIER", title_style))
        story.append(Paragraph("Problem Statement ID: 26188 Concept | Simulated Evaluation Report", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceAfter=8))

        # 2. Case Overview Table
        screening_id = safe_val(screening_data, "id", "N/A")
        doc_obj = safe_obj(screening_data, "document")
        doc_type = safe_val(doc_obj, "document_type", "PASSPORT")
        officer_name = safe_val(screening_data, "officer_name", "Demo Evaluator")
        officer_badge = safe_val(screening_data, "officer_badge", "EVAL-01")
        status = safe_val(screening_data, "status", "IN_PROGRESS")
        
        risk_obj = safe_obj(screening_data, "risk_assessment")
        risk_score = safe_val(risk_obj, "risk_score", "0.0")
        risk_level = safe_val(risk_obj, "risk_level", "LOW")
        
        started_at = safe_obj(screening_data, "started_at")
        if isinstance(started_at, str):
            timestamp_str = started_at
        elif isinstance(started_at, datetime):
            timestamp_str = started_at.strftime("%Y-%m-%d %H:%M:%S UTC")
        else:
            timestamp_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        summary_table_data = [
            [
                Paragraph("<b>Screening ID:</b>", normal_style), Paragraph(f"{screening_id} (Demo)", normal_style),
                Paragraph("<b>Risk Score:</b>", normal_style), Paragraph(f"<b>{risk_score}/100 ({risk_level})</b>", bold_label)
            ],
            [
                Paragraph("<b>Document Type:</b>", normal_style), Paragraph(f"{doc_type} (Simulated)", normal_style),
                Paragraph("<b>Screening Status:</b>", normal_style), Paragraph(f"<b>{status}</b>", bold_label)
            ],
            [
                Paragraph("<b>Inspection Time:</b>", normal_style), Paragraph(timestamp_str, normal_style),
                Paragraph("<b>Evaluator / Badge:</b>", normal_style), Paragraph(f"{officer_name} ({officer_badge})", normal_style)
            ]
        ]
        summary_table = Table(summary_table_data, colWidths=[100, 170, 100, 170])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 8))

        # 3. Extracted Biographical Data vs MRZ
        story.append(Paragraph("1. Biographical & Document Field Extraction (AI-Assisted)", heading_style))
        ext = safe_obj(screening_data, "extracted_fields")
        mrz = safe_obj(screening_data, "mrz_result")

        ext_doc_num = safe_val(ext, "document_number")
        mrz_doc_num = safe_val(mrz, "document_number", ext_doc_num)
        
        ext_name = safe_val(ext, "full_name")
        mrz_name = safe_val(mrz, "full_name", ext_name)
        
        ext_nat = safe_val(ext, "nationality")
        mrz_nat = safe_val(mrz, "nationality", ext_nat)
        
        ext_dob = safe_val(ext, "date_of_birth")
        mrz_dob = safe_val(mrz, "date_of_birth", ext_dob)

        ext_exp = safe_val(ext, "expiry_date")
        mrz_exp = safe_val(mrz, "expiry_date", ext_exp)

        fields_data = [
            [Paragraph("<b>Field Name</b>", bold_label), Paragraph("<b>Visual OCR Extraction (VIZ)</b>", bold_label), Paragraph("<b>MRZ Encoded Value</b>", bold_label), Paragraph("<b>Match Status</b>", bold_label)],
            [Paragraph("Document Number", normal_style), Paragraph(ext_doc_num, normal_style), Paragraph(mrz_doc_num, normal_style), Paragraph("MATCH" if ext_doc_num == mrz_doc_num else "REVIEW", normal_style)],
            [Paragraph("Holder Full Name", normal_style), Paragraph(ext_name, normal_style), Paragraph(mrz_name, normal_style), Paragraph("MATCH" if ext_name else "—", normal_style)],
            [Paragraph("Nationality", normal_style), Paragraph(ext_nat, normal_style), Paragraph(mrz_nat, normal_style), Paragraph("MATCH" if ext_nat == mrz_nat else "REVIEW", normal_style)],
            [Paragraph("Date of Birth", normal_style), Paragraph(ext_dob, normal_style), Paragraph(mrz_dob, normal_style), Paragraph("MATCH", normal_style)],
            [Paragraph("Date of Expiry", normal_style), Paragraph(ext_exp, normal_style), Paragraph(mrz_exp, normal_style), Paragraph("MATCH", normal_style)]
        ]
        fields_table = Table(fields_data, colWidths=[120, 160, 160, 100])
        fields_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(fields_table)
        story.append(Spacer(1, 8))

        # 4. Checkpoint Verification Matrix
        story.append(Paragraph("2. Forensic & Security Checkpoint Matrix", heading_style))
        val = safe_obj(screening_data, "validation_result")
        tamper = safe_obj(screening_data, "tampering_result")
        face = safe_obj(screening_data, "face_result")
        reg = safe_obj(screening_data, "registry_check")

        mrz_valid = safe_obj(mrz, "all_checksums_valid")
        val_expired = safe_obj(val, "is_expired")
        tamper_ela = float(safe_obj(tamper, "ela_anomaly_score") or 0.0)
        face_sim = safe_val(face, "similarity_score", "0")
        face_status = safe_val(face, "match_status", "INCONCLUSIVE")
        reg_matched = safe_val(reg, "matched_registry", "No hits in simulated SLTD or Watchlists")
        reg_status = safe_val(reg, "check_status", "CLEAR")

        check_rows = [
            [Paragraph("<b>Verification Module</b>", bold_label), Paragraph("<b>Observed Result</b>", bold_label), Paragraph("<b>Status Flag</b>", bold_label)],
            [Paragraph("ICAO 9303 MRZ Checksums", normal_style), Paragraph("All 7-3-1 check digits verified" if mrz_valid else "Check digit mismatch detected", normal_style), Paragraph("PASS" if mrz_valid else "FLAGGED", normal_style)],
            [Paragraph("Temporal & Expiry Rules", normal_style), Paragraph("Document is temporally valid" if not val_expired else "Document is EXPIRED", normal_style), Paragraph("PASS" if not val_expired else "FLAGGED", normal_style)],
            [Paragraph("Error Level Analysis (ELA)", normal_style), Paragraph(f"Compression error score: {int(tamper_ela * 100)}%", normal_style), Paragraph("CLEAR" if tamper_ela < 0.35 else "SUSPICIOUS", normal_style)],
            [Paragraph("Face Match Confidence", normal_style), Paragraph(f"Similarity: {face_sim}% ({face_status})", normal_style), Paragraph(face_status, normal_style)],
            [Paragraph("SIMULATED REGISTRY CHECK", normal_style), Paragraph(f"{reg_matched} (MOCK DB)", normal_style), Paragraph(reg_status, normal_style)]
        ]
        checks_table = Table(check_rows, colWidths=[160, 280, 100])
        checks_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(checks_table)
        story.append(Spacer(1, 8))

        # 5. Explainable Risk Factors
        factors = safe_obj(risk_obj, "contributing_factors_json") or []
        story.append(Paragraph("3. Explainable Risk Factor Breakdown (Risk Assessment)", heading_style))
        if factors:
            factor_rows = [[Paragraph("<b>Category</b>", bold_label), Paragraph("<b>Finding / Anomaly Reason</b>", bold_label), Paragraph("<b>Severity</b>", bold_label), Paragraph("<b>Points</b>", bold_label)]]
            for f in factors:
                factor_rows.append([
                    Paragraph(str(f.get("category", "GENERAL")), normal_style),
                    Paragraph(f"<b>{f.get('title')}</b>: {f.get('description')}", normal_style),
                    Paragraph(str(f.get("severity", "MED")), normal_style),
                    Paragraph(f"+{f.get('points', 0)}", bold_label)
                ])
            factors_table = Table(factor_rows, colWidths=[90, 310, 80, 60])
            factors_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#fee2e2')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fca5a5')),
                ('PADDING', (0,0), (-1,-1), 3),
            ]))
            story.append(factors_table)
        else:
            story.append(Paragraph("No risk factors triggered. Document evaluated as clean in simulated tests.", normal_style))

        story.append(Spacer(1, 10))

        # 6. Officer Determination & Sign-off Box
        story.append(Paragraph("4. Officer Determination (Decision Support)", heading_style))
        notes = safe_val(screening_data, "officer_notes", "Screening evaluated under demonstration protocol.")
        doc_hash = safe_val(doc_obj, "sha256_hash", "N/A")
        
        officer_box_data = [
            [Paragraph("<b>Decision Support Status:</b>", bold_label), Paragraph(f"<b>{status}</b>", bold_label)],
            [Paragraph("<b>Officer Remarks:</b>", bold_label), Paragraph(notes, normal_style)],
            [Paragraph("<b>Integrity Hash:</b>", bold_label), Paragraph(f"SHA-256: {doc_hash}", normal_style)]
        ]
        officer_table = Table(officer_box_data, colWidths=[140, 400])
        officer_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#94a3b8')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(officer_table)

        story.append(Spacer(1, 10))
        story.append(Paragraph("<b>PROTOTYPE DISCLAIMER:</b> This dossier is generated by a demonstration prototype system using configured AI models and simulated data for research, evaluation, and decision-support purposes. It is not an official government verification or final legal determination.", subtitle_style))

        # Build PDF
        output_path.parent.mkdir(parents=True, exist_ok=True)
        doc.build(story)
        return f"/storage/reports/{output_path.name}"
