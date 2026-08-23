# SYSTEM ARCHITECTURE DOCUMENT

**Project Name:** AI-Based Fake Identity & Document Screening System  
**Problem Statement ID:** 26188  
**Organization:** Ministry of Home Affairs  
**Department:** Sashastra Seema Bal (SSB), Police II Division  
**Document Version:** 1.0.0  
**Status:** Approved Source of Truth  

---

## 1. System Overview & Architectural Topology

The system is designed as a modular, high-throughput, explainable edge/checkpoint screening platform. It follows a clean separation of concerns between client-side security workstation UI, high-performance asynchronous REST API backend, isolated computer vision/forensic intelligence modules, and relational persistence.

```mermaid
graph TD
    subgraph Client_Workstation [Frontline Officer Workstation / Browser]
        UI[React + Vite + TypeScript UI]
        Cam[Live WebCam / Photo Capture]
        State[Client State & Query Cache]
    end

    subgraph Backend_Gateway [FastAPI Secure Gateway]
        Auth[Auth & RBAC Middleware]
        DocRouter[Document & Screening Router]
        ValRouter[Validation & Forensics Router]
        RegRouter[Registry & Settings Router]
        AuditRouter[Audit Log Engine]
    end

    subgraph AI_Forensics_Engine [Modular AI & Forensic Analysis Services]
        OCR_Engine[OCR & Region Field Extractor]
        MRZ_Engine[ICAO 9303 MRZ & Checksum Engine]
        Val_Engine[Document Rules & Temporal Validator]
        ELA_Engine[Error Level Analysis & Noise Forensics]
        Photo_Engine[Photo Splicing & Edge Inspector]
        Face_Engine[Face Detection & Cosine Verification]
        Risk_Engine[Explainable Multi-Signal Risk Aggregator]
    end

    subgraph Data_Storage [Persistent Storage Layer]
        DB[(SQLite / PostgreSQL Relational DB)]
        FileStore[Secure Local / Compartmentalized Storage]
        SimRegistry[(Simulated Security Registries)]
    end

    UI -->|JWT Authenticated REST / JSON| Auth
    Cam -->|Base64 / Multipart Capture| UI
    Auth --> DocRouter
    Auth --> ValRouter
    Auth --> RegRouter
    Auth --> AuditRouter

    DocRouter --> FileStore
    DocRouter --> OCR_Engine
    DocRouter --> MRZ_Engine
    DocRouter --> Val_Engine
    DocRouter --> ELA_Engine
    DocRouter --> Photo_Engine
    DocRouter --> Face_Engine
    DocRouter --> Risk_Engine

    RegRouter --> SimRegistry
    Risk_Engine --> DB
    AuditRouter --> DB
    DocRouter --> DB
```

---

## 2. Technology Stack & Rationale

| Layer | Technology Selected | Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 / 19 + TypeScript + Vite | Blazing fast HMR, strict type safety, zero runtime overhead, responsive desktop security UI. |
| **Styling & Icons** | Tailwind CSS + Lucide Icons | Clean, serious, high-density security operations design system; zero external bloat; strict spacing tokens. |
| **Backend Framework** | Python 3.14 + FastAPI + Pydantic v2 | High-concurrency async I/O, native OpenAPI 3.1 documentation, strict data contract validation. |
| **Relational Database** | SQLite (Dev/Edge) / PostgreSQL (Prod) | Normalized multi-entity schema with SQLAlchemy 2.0 ORM; atomic transactions; zero data leakage. |
| **Image & Forensics Processing**| NumPy, SciPy, Pillow, Custom Computer Vision | Vectorized pixel operations, DCT coefficient analysis, ELA difference matrices, gradient filtering. |
| **Biometrics & Face Matching** | Vector Face Alignment + 512D Cosine Embeddings | Rapid facial localization, bounding box extraction, and distance scoring without external cloud dependencies. |
| **Document OCR & MRZ** | Optimized OCR Extractor + ICAO 9303 Checksum Engine | Fast text parsing and 100% accurate mathematical check-digit recalculation for TD1, TD2, TD3. |
| **Document Reporting** | ReportLab + Structured JSON | Exportable, high-fidelity PDF forensic audit sheets for secondary inspection and evidentiary chain of custody. |

---

## 3. Normalized Database Schema & Data Models

The relational database enforces complete auditability, entity relationships, and historical integrity without bloating tables with large binary blobs.

```mermaid
erDiagram
    USERS ||--o{ SCREENINGS : conducts
    USERS ||--o{ AUDIT_LOGS : triggers
    DOCUMENTS ||--o| EXTRACTED_FIELDS : contains
    DOCUMENTS ||--o| MRZ_RESULTS : contains
    DOCUMENTS ||--o| VALIDATION_RESULTS : has
    DOCUMENTS ||--o| TAMPERING_RESULTS : has
    DOCUMENTS ||--o| FACE_VERIFICATION_RESULTS : has
    DOCUMENTS ||--o| REGISTRY_CHECKS : has
    SCREENINGS ||--|| DOCUMENTS : screens
    SCREENINGS ||--|| RISK_ASSESSMENTS : evaluates
    SCREENINGS ||--o{ AUDIT_LOGS : references

    USERS {
        string id PK
        string username UK
        string email UK
        string hashed_password
        string full_name
        string role "ADMIN | SUPERVISOR | OFFICER"
        string badge_number
        boolean is_active
        datetime created_at
    }

    DOCUMENTS {
        string id PK
        string document_type "PASSPORT | VISA | NATIONAL_ID | DRIVING_LICENCE"
        string original_filename
        string file_path
        string file_mime_type
        integer file_size_bytes
        string sha256_hash
        datetime uploaded_at
    }

    EXTRACTED_FIELDS {
        string id PK
        string document_id FK
        string document_number
        string full_name
        string surname
        string given_names
        string nationality
        string date_of_birth
        string gender
        string issue_date
        string expiry_date
        string issuing_country
        json raw_fields_json
        float extraction_confidence
    }

    MRZ_RESULTS {
        string id PK
        string document_id FK
        boolean mrz_detected
        string mrz_type "TD1 | TD2 | TD3"
        string line1
        string line2
        string line3
        boolean valid_doc_number_checksum
        boolean valid_dob_checksum
        boolean valid_expiry_checksum
        boolean valid_composite_checksum
        boolean all_checksums_valid
        boolean matches_viz_fields
        json checksum_details
    }

    VALIDATION_RESULTS {
        string id PK
        string document_id FK
        boolean is_expired
        boolean is_future_issue_date
        boolean is_valid_age
        boolean is_valid_doc_number_format
        boolean passed_all_rules
        json rule_evaluations
    }

    TAMPERING_RESULTS {
        string id PK
        string document_id FK
        float ela_anomaly_score
        string ela_heatmap_path
        float photo_splicing_score
        float noise_variance_score
        boolean metadata_manipulation_flag
        boolean has_tampering_evidence
        json suspicious_regions
    }

    FACE_VERIFICATION_RESULTS {
        string id PK
        string document_id FK
        boolean doc_face_detected
        string doc_face_crop_path
        boolean live_face_detected
        string live_face_path
        float similarity_score
        string match_status "MATCH | MISMATCH | INCONCLUSIVE | LOW_QUALITY"
        float confidence
    }

    REGISTRY_CHECKS {
        string id PK
        string document_id FK
        string check_status "CLEAR | HIT_STOLEN | HIT_WANTED | HIT_REVOKED"
        string matched_registry
        string matched_record_id
        string severity "NONE | LOW | MEDIUM | HIGH | CRITICAL"
        json match_details
    }

    RISK_ASSESSMENTS {
        string id PK
        string screening_id FK
        float risk_score "0 - 100"
        string risk_level "LOW | MEDIUM | HIGH | MANUAL_REVIEW"
        boolean requires_manual_review
        json contributing_factors
        datetime evaluated_at
    }

    SCREENINGS {
        string id PK
        string document_id FK
        string officer_id FK
        string status "IN_PROGRESS | CLEARED | REFER_SECONDARY | REJECTED | DETAINED"
        string officer_notes
        datetime started_at
        datetime completed_at
    }

    AUDIT_LOGS {
        string id PK
        string user_id FK
        string action_type
        string resource_type
        string resource_id
        json details
        string ip_address
        datetime timestamp
    }
```

---

## 4. File Storage Strategy

All binary and derived image files are compartmentalized on local disk storage:
```text
storage/
├── documents/       # Original uploaded raw documents (PDF, JPG, PNG)
├── normalized/      # Standardized RGB 300-DPI images for AI processing
├── forensics/       # Generated ELA difference heatmaps and noise gradient maps
├── portraits/       # Cropped document face portraits and live webcam captures
└── reports/         # Generated PDF case audit reports
```
- **Integrity Verification:** Every uploaded file has its SHA-256 digest calculated immediately upon ingestion and saved in `documents.sha256_hash`.
- **Zero Raw Blobs in DB:** The database stores only relative sanitized paths and cryptographic hashes, preventing database engine bloat.

---

## 5. Security & Role-Based Access Control (RBAC)

### 5.1 Roles and Permission Matrix

| Capability | OFFICER | SUPERVISOR | ADMIN |
| :--- | :---: | :---: | :---: |
| Authenticate / View Own Profile | Yes | Yes | Yes |
| Ingest Document & Run Screening | Yes | Yes | Yes |
| View Screening History & Cases | Yes | Yes | Yes |
| Submit Final Officer Decision | Yes | Yes | Yes |
| Override Previous Screening Decision | No | Yes | Yes |
| View Global Shift & Risk Analytics | Yes | Yes | Yes |
| Search & Export Immutable Audit Logs | No | Yes | Yes |
| Configure Risk Calculation Weights | No | No | Yes |
| Manage Simulated Watchlist & Registries | No | No | Yes |
| Manage Officer Accounts & Badges | No | No | Yes |

### 5.2 Cryptographic Safeguards
1. **Passlib / Bcrypt:** Officer passwords hashed with work factor 12.
2. **PyJWT (HS256):** Stateless session tokens with expiration and scope enforcement.
3. **CORS & Input Sanitization:** Explicit allowed origins, strict Pydantic payload models preventing injection.
4. **Audit Immutability:** Audit records are strictly append-only.
