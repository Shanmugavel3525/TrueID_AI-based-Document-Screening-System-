# DEVELOPMENT PLAN

**Project Name:** AI-Based Fake Identity & Document Screening System  
**Problem Statement ID:** 26188  
**Organization:** Ministry of Home Affairs  
**Department:** Sashastra Seema Bal (SSB), Police II Division  
**Document Version:** 1.0.0  
**Status:** Approved Source of Truth  

---

## 1. Development Methodology & Execution Framework

This project follows strict **Document-Driven Development (DDD)** and the **Autonomous Self-Healing Loop**:
```text
PLAN (PRD -> SRS -> Arch -> UI/UX -> DevPlan)
  ↓
IMPLEMENT (Incremental Modules & Clean Architecture)
  ↓
EXECUTE & RUN (Start backend & frontend dev servers)
  ↓
INSPECT & DIAGNOSE (Terminal logs, API payloads, Browser DOM, Console errors)
  ↓
TEST (Pytest suite, Integration endpoints, End-to-end user journeys)
  ↓
FIX & REFINE (Address root causes immediately)
  ↓
ACCEPT & VERIFY (Definition of Done checklist)
```

---

## 2. Phased Implementation Roadmap

### Phase 1: Project Foundation, Core Architecture & Authentication
- **Milestone 1.1:** Setup modular backend structure (`backend/app/` with `api/`, `core/`, `models/`, `schemas/`, `services/`, `db/`).
- **Milestone 1.2:** Implement normalized relational database schema (SQLAlchemy 2.0 with SQLite/PostgreSQL support).
- **Milestone 1.3:** Setup secure JWT authentication, password hashing (Bcrypt), and role-based access control (`ADMIN`, `SUPERVISOR`, `OFFICER`).
- **Milestone 1.4:** Initialize React + TypeScript + Vite frontend with Tailwind CSS and Lucide icons.
- **Verification Gate:** Authenticated login returns valid JWT token and role-based permissions; DB tables migrate cleanly.

### Phase 2: Operations UI Design System & Dashboard Layout
- **Milestone 2.1:** Implement design system tokens (Slate 950 base, Emerald/Amber/Rose status badges, JetBrains Mono data tokens).
- **Milestone 2.2:** Build Command Navigation bar with role-based links, officer profile badge, and session logout.
- **Milestone 2.3:** Implement Operations Dashboard (`/dashboard`) with 4 KPI summary cards, risk distribution charts, pending review queue, and quick action bar.
- **Verification Gate:** Dashboard renders with crisp visual hierarchy, real-time statistics, and zero console errors.

### Phase 3: Document Ingestion, Structured OCR & ICAO 9303 MRZ Engine
- **Milestone 3.1:** Implement multipart file upload endpoint (`/api/documents/upload`) with MIME verification and SHA-256 hash logging.
- **Milestone 3.2:** Build Structured OCR Extractor (`services/ocr_service.py`) for Passports, Visas, National IDs, and Driving Licences.
- **Milestone 3.3:** Implement ICAO Doc 9303 compliant MRZ Parser (`services/mrz_service.py`) supporting TD1 (3x30), TD2 (2x36), and TD3 (2x44) with full 7-3-1 weight check-digit calculation.
- **Milestone 3.4:** Build Visual Inspection Zone (VIZ) vs MRZ cross-verification matcher.
- **Verification Gate:** Automated unit tests pass on 100% of ICAO check-digit test vectors and extract structured data fields.

### Phase 4: Document Integrity, Expiry & Format Rule Validation
- **Milestone 4.1:** Build Rule Validation Engine (`services/validation_service.py`) evaluating expiration dates, future issue dates, DOB biological plausibility, and validity periods.
- **Milestone 4.2:** Implement country-specific document number format validators and ISO 3166-1 alpha-3 nationality checks.
- **Verification Gate:** Unit tests confirm correct flagging of expired documents, impossible dates, and syntax violations.

### Phase 5: Multi-Signal Image Forensics & Biometric Face Verification
- **Milestone 5.1:** Implement Error Level Analysis (ELA) service (`services/forensics_service.py`) generating difference matrices and compression anomaly heatmaps.
- **Milestone 5.2:** Build Photo-Region Splicing & Noise Variance Detector for cut-and-paste and edge discontinuity detection.
- **Milestone 5.3:** Build Metadata Anomaly Analyzer checking EXIF editing software tags and timestamps.
- **Milestone 5.4:** Implement Biometric Face Verification service (`services/face_service.py`) for document portrait auto-cropping, live photo alignment, and Cosine similarity scoring.
- **Verification Gate:** ELA generates visual heatmaps; face verification computes calibrated cosine similarity with match/mismatch/inconclusive states.

### Phase 6: Explainable Risk Engine & Simulated Registries
- **Milestone 6.1:** Build Simulated National Security Registries (`services/registry_service.py`) for Stolen Passports (SLTD), Wanted Persons (Red Notices), and Revoked Credentials.
- **Milestone 6.2:** Build Explainable Risk Aggregator (`services/risk_engine.py`) calculating normalized scores ($0 - 100$), risk tiers (`LOW`, `MEDIUM`, `HIGH`, `MANUAL_REVIEW`), and plain-language factor breakdowns.
- **Verification Gate:** Risk engine produces explainable point-by-point justifications for every screening scenario.

### Phase 7: Officer Decisioning, Forensic Case Inspector, History & Audit Trail
- **Milestone 7.1:** Build interactive Forensic Case Inspector (`/screening/:id`) with ELA heatmap toggle, side-by-side face comparison, MRZ inspector, and decision action bar.
- **Milestone 7.2:** Implement Officer Manual Determination (`/api/screenings/:id/decision`) with mandatory notes and state transition logging.
- **Milestone 7.3:** Build PDF Case Dossier Generator (`services/report_service.py`) using ReportLab.
- **Milestone 7.4:** Implement Screening History & Search Grid (`/history`) with multi-filter parameters and pagination.
- **Milestone 7.5:** Implement Flagged Alerts Center (`/alerts`) and Immutable Audit Log Explorer (`/settings`).
- **Verification Gate:** Officer can inspect, evaluate, override/confirm risk, enter notes, download PDF, and search historical records.

### Phase 8: Synthetic Demo Datasets & Automated Test Suites
- **Milestone 8.1:** Pre-generate 10 comprehensive synthetic test cases (Clean Passport, Expired Passport, Tampered MRZ, Spliced Photo, Face Mismatch, Watchlist Hit, Combined Multi-Anomaly, Low Quality/Blur, Corrupted File).
- **Milestone 8.2:** Write end-to-end Pytest suite covering all API endpoints, auth scopes, validation logic, and risk calculation.
- **Verification Gate:** 100% of automated test suites pass synchronously.

### Phase 9: Autonomous QA, Browser Verification & Hardening
- **Milestone 9.1:** Launch live dev servers and perform comprehensive browser subagent QA.
- **Milestone 9.2:** Verify responsive design across 1920x1080, 1366x768, and tablet resolutions.
- **Milestone 9.3:** Resolve all browser console warnings, network latency bottlenecks, and edge-case exceptions.

---

## 3. Definition of Done (DoD) Checklist

A feature is considered **DONE** only when:
- [x] Traceable to PRD, SRS, Architecture, and UI/UX documents.
- [x] Backend API endpoint implemented with Pydantic request/response schemas.
- [x] Relational database persistence verified with foreign keys and indexes.
- [x] Frontend UI component fully styled according to design tokens.
- [x] Loading, success, empty, and error states visually validated.
- [x] Automated test written and passing.
- [x] Tested in live browser session with zero unhandled console errors.
- [x] Audit log entry recorded for state mutations.
