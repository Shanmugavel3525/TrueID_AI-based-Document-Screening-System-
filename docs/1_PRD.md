# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Project Name:** AI-Based Fake Identity & Document Screening System  
**Problem Statement ID:** 26188  
**Organization:** Ministry of Home Affairs  
**Department:** Sashastra Seema Bal (SSB), Police II Division  
**Document Version:** 1.0.0  
**Status:** Approved Source of Truth  

---

## 1. Executive Summary & Problem Definition

### 1.1 Problem Context
Border checkpoints, immigration counters, and law enforcement units under the Sashastra Seema Bal (SSB) and Ministry of Home Affairs inspect thousands of travel and identity credentials daily. The current screening workflow faces critical challenges:
1. **Manual Inspection Bottlenecks:** Physical and visual verification of security features, fonts, alignment, and holograms is labor-intensive and causes lengthy transit delays.
2. **Sophisticated Forgeries:** Modern counterfeiters use high-resolution digital manipulation, photo substitution, font splicing, and synthetic metadata that evade standard naked-eye scrutiny.
3. **High Volume Pressure:** Peak transit hours create cognitive fatigue among border security officers, increasing the probability of false negatives (missed forged credentials).
4. **Fragmented Verification Workflows:** Officers must juggle separate tools for optical character recognition, MRZ computation, physical check digit validation, blacklist queries, and facial comparison.
5. **Lack of Explainable Risk Scoring:** Conventional tools output opaque "pass/fail" decisions without pinpointing specific anomalies (e.g., Error Level Analysis anomalies, ICAO checksum mismatches, or date anomalies), eroding officer trust.

### 1.2 System Purpose & Philosophy
The **AI-Based Fake Identity & Document Screening System** is designed as an intelligent, explainable **Decision Support Platform** for authorized security officers. 
- **Human-in-the-Loop:** The system **never** presents AI outputs as an unquestionable legal determination. It serves to augment officer capability by flagging suspicious visual regions, highlighting structural and checksum inconsistencies, calculating normalized multi-factor risk scores, and generating comprehensive forensic audit reports.

---

## 2. Target Users & Stakeholders

| User Role | Description & Operational Context | Primary Needs & Goals |
| :--- | :--- | :--- |
| **Primary: Border Security Officer (SSB / Police II)** | Frontline checkpoint personnel operating at primary and secondary inspection booths. | Fast (< 3s) document scanning, instant visual cues, explainable anomaly highlights, side-by-side face comparison, one-click manual determination. |
| **Secondary: Checkpoint Supervisor** | Shift commanders overseeing border lanes and handling escalated/flagged cases. | Real-time dashboard of high-risk cases, oversight of manual review queues, override capabilities, performance monitoring. |
| **Secondary: Investigation & Intelligence Unit** | Forensic examiners and intelligence officers investigating fraudulent rings. | In-depth forensic inspection (ELA heatmaps, noise variance, metadata anomalies, copy-move maps), exportable court-ready PDF audit trails. |
| **Secondary: System Administrator** | Technical operators managing checkpoint node configurations and security. | Role-based access control, registry simulator updates, risk weight threshold tuning, immutable audit log monitoring. |

---

## 3. System Goals & Objectives

1. **Reduce Screening Latency:** Reduce initial document ingestion, OCR parsing, tampering analysis, face matching, and registry verification to **under 3.5 seconds** end-to-end.
2. **Automate Multi-Tier Rule & Checksum Validation:** Automate ICAO 9303 checksum recalculation (TD1, TD2, TD3), date continuity tests (issuance vs expiry vs DOB), and format compliance.
3. **Forensic Multi-Signal Tampering Detection:** Detect photo replacement, text splicing, compression boundary inconsistencies (Error Level Analysis), and metadata manipulation.
4. **Biometric Face Verification:** Extract document portrait photo and match against a live captured portrait using deep facial embedding cosine distance with confidence scoring and quality checks.
5. **Configurable Registry Cross-Referencing:** Query simulated national registries (Lost/Stolen, Wanted/Interpol Red Notices, Revoked/Invalid permits) with sub-second response times.
6. **Explainable Risk Assessment:** Provide a composite risk score (0–100) categorized into **LOW**, **MEDIUM**, **HIGH**, and **MANUAL REVIEW**, accompanied by granular contributing factor breakdowns.
7. **Immutable Audit Trail:** Log every screening event, user action, raw artifact hash, and officer note for strict chain-of-custody compliance.

---

## 4. Scope of MVP

### 4.1 In Scope (Core MVP Deliverables)
- **Multi-Document Ingestion:** Support for Passports, Visas, National Identity Cards (Aadhaar/e-ID), Driving Licences, and Border Entry Permits in JPG, PNG, and PDF formats.
- **Dual-Engine OCR & MRZ Extractor:** Full structured field extraction and ICAO Doc 9303 compliant Machine Readable Zone (MRZ) parser with strict check-digit verification.
- **Document Integrity & Expiry Engine:** Automated checking for expiration, impossible dates, missing mandatory fields, and internal field inconsistencies (e.g., Visual OCR vs MRZ text mismatches).
- **Multi-Signal Image Forensics (Tampering Pipeline):**
  - Error Level Analysis (ELA) for JPEG resaving discrepancy detection.
  - Frequency & noise variance analysis for digital copy-paste / splicing detection.
  - Photo-region edge continuity and luminance inconsistency detection.
  - Image EXIF / metadata anomaly analyzer.
- **Biometric Face Verification:** Live webcam/portrait capture, document portrait cropping, face detection, alignment, embedding extraction, and cosine similarity scoring with configurable match thresholds.
- **Simulated Registry & Watchlist Service:** Extensible mock microservice for Lost/Stolen travel documents, Wanted Persons / Red Notices, and Revoked Visas/Passports.
- **Explainable Multi-Factor Risk Engine:** Transparent signal aggregation with configurable weight matrix, severity classifications, and plain-language risk factors.
- **Comprehensive Security Dashboard & History:** High-density desktop dashboard with live metrics, multi-parameter search/filter, full case inspector, PDF/JSON export, and immutable audit logs.
- **Role-Based Access Control (RBAC):** JWT-secured authentication with ADMIN, SUPERVISOR, and OFFICER roles.
- **Synthetic Test Dataset:** 10 pre-configured forensic test cases covering valid, expired, MRZ-tampered, photo-substituted, face-mismatched, watchlist-hit, blurry, and corrupted documents.

### 4.2 Out of Scope for MVP
- Live direct integration with classified production IB/Interpol databases (simulated with realistic mock APIs).
- Hardware firmware integration with physical border optical readers/e-Passport chip RFID readers (handled via image/document ingestion).
- Automated legal determinations (system strictly enforces human officer final sign-off).
- Commercial payment processing, social features, or public end-user facing portals.

---

## 5. User Stories

1. **US-01 (Officer - Document Scanning):** As a Border Officer, I want to upload a traveler's passport photo or PDF so that the system immediately extracts all biographical fields and flags any ICAO 9303 checksum errors.
2. **US-02 (Officer - Tampering Detection):** As a Border Officer, I want to see a visual heatmap and highlighted bounding boxes of tampered text or spliced photos so that I can physically examine suspicious areas on the physical booklet.
3. **US-03 (Officer - Face Verification):** As a Border Officer, I want to compare the traveler's live webcam photo against the passport portrait to verify that the person in front of me is the legitimate document holder.
4. **US-04 (Officer - Explainable Decision Support):** As a Border Officer, I want clear, bulleted risk justifications (e.g., "MRZ Checksum 2 Failed", "Photo Region ELA Discrepancy > 85%", "Passport Number on Stolen Watchlist") rather than a black-box score so that I can justify secondary inspection referrals.
5. **US-05 (Officer - Manual Determination):** As a Border Officer, I want to record my final decision (Clear, Refer to Secondary, Detain) along with officer notes, creating an auditable screening record.
6. **US-06 (Supervisor - Queue Management):** As a Checkpoint Supervisor, I want to filter and review all high-risk screenings flagged across my shift to ensure protocol compliance and assist officers in complex cases.
7. **US-07 (Admin - Configuration & Audit):** As a System Administrator, I want to inspect immutable audit logs, adjust risk calculation weights, and update simulated watchlist entries without restarting the service.

---

## 6. Success Metrics & Performance Targets

| Metric | Target SLA | Method of Measurement |
| :--- | :--- | :--- |
| **OCR Field Extraction Accuracy** | $\ge 95\%$ on standard resolution | Automated test suite over synthetic test documents |
| **MRZ Checksum Parsing Accuracy** | $100\%$ on readable MRZ lines | ICAO Doc 9303 mathematical test vectors |
| **Tampering Detection Precision** | $\ge 90\%$ on synthetic spliced samples | ELA / noise anomaly verification matrix |
| **Face Verification Speed** | $< 1.2$ seconds | Server response time for biometric endpoint |
| **End-to-End Screening Pipeline** | $< 3.5$ seconds total backend processing | Measured from document upload to risk output |
| **UI Interaction Latency** | $< 100$ ms responsiveness | Client-side performance profiling |
| **Audit Logging Completeness** | $100\%$ of screening & auth events | Automated audit table integrity check |

---

## 7. Security, Privacy & Compliance Guidelines

1. **Zero Raw Secret Exposure:** JWT signing secrets and database credentials stored exclusively in server environment variables.
2. **Data Minimization & Redaction:** Sensitive biometric embeddings and document hashes isolated; raw files stored in compartmentalized storage with restricted access.
3. **Role-Based Access Control:** API routes strictly protected by granular scopes (e.g., only ADMIN can configure risk weights or view raw audit logs).
4. **Immutable Audit Records:** All audit entries are append-only with cryptographic SHA-256 state tracking.
