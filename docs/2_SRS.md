# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

**Project Name:** AI-Based Fake Identity & Document Screening System  
**Problem Statement ID:** 26188  
**Organization:** Ministry of Home Affairs  
**Department:** Sashastra Seema Bal (SSB), Police II Division  
**Document Version:** 1.0.0  
**Status:** Approved Source of Truth  

---

## 1. Introduction

### 1.1 Purpose
This document provides the definitive technical and functional requirements specification for the AI-Based Fake Identity & Document Screening System. It defines the exact behaviors, data contracts, validation rules, AI pipelines, and acceptance criteria.

### 1.2 System Conventions & Nomenclature
- **ICAO 9303:** International Civil Aviation Organization standards for Machine Readable Travel Documents (MRTDs).
- **MRZ:** Machine Readable Zone (Type TD1: 3x30 chars, TD2: 2x36 chars, TD3: 2x44 chars).
- **ELA:** Error Level Analysis (forensic technique highlighting compression disparity).
- **Risk Score:** Normalized score from 0 (Safe) to 100 (Severe Anomaly / Fraud).
- **Decision Status:** PENDING, CLEARED, REFER_SECONDARY, REJECTED, DETAIN.

---

## 2. Functional Requirements

### 2.1 Module 1: Authentication & Authorization (AUTH)

#### FR-001: User Authentication via Credentials
- **Description:** Authenticate registered security officers, supervisors, and administrators using username/email and hashed password.
- **Preconditions:** User account exists in database and is marked active.
- **Inputs:** `username` (string), `password` (string).
- **Processing:** Verify credentials using Argon2/Bcrypt hash comparison. Generate signed JWT token with expiry (default 8 hours) and encoded role/user_id claims.
- **Expected Output:** HTTP 200 with JWT `access_token`, `token_type: bearer`, and sanitized user profile object (`id`, `username`, `full_name`, `role`, `badge_number`).
- **Failure Conditions:** Invalid credentials return HTTP 401 Unauthorized; inactive account returns HTTP 403 Forbidden.
- **Acceptance Criteria:** Failed login attempts are recorded in the audit log. Passwords are never returned or logged in plaintext.

#### FR-002: Role-Based Authorization Enforcement
- **Description:** Restrict endpoint execution and UI views based on user role (`ADMIN`, `SUPERVISOR`, `OFFICER`).
- **Preconditions:** Valid JWT presented in Authorization header.
- **Inputs:** JWT Bearer token, route permission requirement.
- **Processing:** Decode token, validate cryptographic signature, check expiration, and match user role against required scopes.
- **Expected Output:** Authorized access to requested resource.
- **Failure Conditions:** Invalid/expired token returns HTTP 401; insufficient privileges return HTTP 403 Forbidden.
- **Acceptance Criteria:** Officers can perform screenings and view history; Supervisors can override decisions and view queue metrics; Admins can access system configuration, audit logs, and mock registry managers.

---

### 2.2 Module 2: Document Ingestion & Storage (INGEST)

#### FR-003: Multi-Format Document Upload
- **Description:** Allow officers to upload identity/travel documents for screening.
- **Preconditions:** Authenticated officer session.
- **Inputs:** Multipart form data containing document image/PDF file, `document_type` (`PASSPORT`, `VISA`, `NATIONAL_ID`, `DRIVING_LICENCE`, `PERMIT`), optional `notes`.
- **Processing:**
  1. Validate file size ($\le 15\text{MB}$).
  2. Verify MIME type (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
  3. Compute SHA-256 hash of original file to guarantee chain of custody.
  4. If PDF, extract high-resolution first page as normalized RGB image.
  5. Store original and normalized files in structured file storage (`storage/documents/`).
- **Expected Output:** HTTP 201 with `document_id`, `file_path`, `sha256_hash`, `upload_timestamp`, and initial screening record.
- **Failure Conditions:** Unsupported MIME type or corrupted file returns HTTP 400 with descriptive error message.
- **Acceptance Criteria:** Upload completes in $< 500\text{ms}$ on local/LAN network. File integrity verified via SHA-256.

---

### 2.3 Module 3: OCR & Machine Readable Zone (MRZ) Extraction (OCR)

#### FR-004: Dual-Engine Structured Field OCR Extraction
- **Description:** Extract visual textual fields from the document image based on document type schema.
- **Preconditions:** Valid ingested document image.
- **Inputs:** `document_id` and normalized document image.
- **Processing:** Run OCR text detection and recognition. Apply spatial region heuristics and regex patterns to parse:
  - **Passport:** Document Number, Surname, Given Names, Nationality, Date of Birth (DOB), Sex, Date of Issue, Date of Expiry, Issuing State.
  - **Visa:** Visa Number, Visa Type, Holder Name, Passport Number, Number of Entries, Valid From, Valid Until.
  - **National ID / Driving Licence:** ID Number, Full Name, DOB, Address, License Class, Expiry Date.
- **Expected Output:** JSON object with key-value pairs, field confidence scores ($0.0 - 1.0$), and detected bounding boxes.
- **Failure Conditions:** Low contrast/unreadable document results in low confidence flag (`is_low_quality: true`) with partial extraction.
- **Acceptance Criteria:** Field extraction accuracy $\ge 95\%$ on standard test benchmarks.

#### FR-005: ICAO Doc 9303 MRZ Detection & Checksum Validation
- **Description:** Locate MRZ lines, parse standard formats (TD1, TD2, TD3), and mathematically verify 7-3-1 weight check digits.
- **Preconditions:** Document image containing an MRZ strip (e.g. Passports, International Visas, ID cards).
- **Inputs:** Document image array.
- **Processing:**
  1. Detect bottom MRZ band using gradient thresholding or specialized OCR filtering.
  2. Extract 2-line (44 chars TD3, 36 chars TD2) or 3-line (30 chars TD1) MRZ strings.
  3. Validate composite check digits:
     - Document Number Checksum
     - Date of Birth Checksum
     - Expiration Date Checksum
     - Optional Data Checksum
     - Overall Composite Checksum
  4. Cross-match extracted MRZ fields against Visual Inspection Zone (VIZ) OCR fields.
- **Expected Output:** Parsed MRZ object containing `mrz_type`, `raw_lines`, `parsed_fields`, `valid_check_digits: bool`, `checksum_breakdown`, and `viz_mismatch_flags`.
- **Failure Conditions:** Incomplete or unparseable MRZ flags `mrz_detected: false` and adds a manual review signal.
- **Acceptance Criteria:** 100% mathematical accuracy on ICAO 9303 checksum verification algorithm.

---

### 2.4 Module 4: Document Integrity & Rule Validation Engine (VAL)

#### FR-006: Document Expiry and Date Logic Verification
- **Description:** Verify temporal validity and biological plausibility of extracted dates.
- **Preconditions:** Extracted date fields (DOB, Issue Date, Expiry Date).
- **Inputs:** Structured date objects.
- **Processing:**
  1. Check if `expiry_date < current_date` $\rightarrow$ Flag `EXPIRED_DOCUMENT`.
  2. Check if `issue_date > current_date` $\rightarrow$ Flag `FUTURE_ISSUE_DATE_IMPOSSIBLE`.
  3. Check if `issue_date < dob` $\rightarrow$ Flag `ISSUED_BEFORE_BIRTH_IMPOSSIBLE`.
  4. Check if traveler age $< 0$ or $> 120$ $\rightarrow$ Flag `INVALID_AGE_RANGE`.
  5. Check if passport validity period exceeds maximum legal bounds (e.g., $> 10$ years for adults).
- **Expected Output:** Array of validation rules evaluated, each with status (`PASS`, `WARN`, `FAIL`), severity, and human-readable explanation.
- **Failure Conditions:** Unparseable date strings marked as `INVALID_DATE_FORMAT` and assigned Medium risk.
- **Acceptance Criteria:** Instant evaluation ($< 20\text{ms}$) with zero false positives on standard date formats (YYYY-MM-DD, DD/MM/YYYY, YYMMDD).

#### FR-007: Document Format & Cross-Field Consistency Check
- **Description:** Verify format conformance (e.g., Indian Passport format: 1 letter followed by 7 digits; alphanumeric standard syntax).
- **Preconditions:** Extracted document number and issuing country.
- **Inputs:** `document_number`, `issuing_country`, `document_type`.
- **Processing:** Match document number against country-specific regex templates. Cross-verify Nationality code against ISO 3166-1 alpha-3 standards. Check name consistency between VIZ and MRZ.
- **Expected Output:** Validation status with specific discrepancy notes.
- **Acceptance Criteria:** Immediate flagging of malformed numbers or country code mismatches.

---

### 2.5 Module 5: Multi-Signal Image Forensics & Tampering Detection (FORENSICS)

#### FR-008: Error Level Analysis (ELA)
- **Description:** Identify digital modifications by recompressing the image at a known quality level and computing pixel error variance.
- **Preconditions:** High-resolution document image.
- **Inputs:** Original document image.
- **Processing:**
  1. Save image temporarily at JPEG quality $90\%$.
  2. Compute absolute difference matrix: $\Delta = |I_{\text{original}} - I_{\text{resaved}}|$.
  3. Scale error brightness and compute regional standard deviations.
  4. Detect localized high-error clusters (indicating inserted elements from a different compression source).
- **Expected Output:** ELA heatmap image artifact (`storage/forensics/ela_<id>.jpg`), anomaly score ($0.0 - 1.0$), and list of suspicious bounding boxes.
- **Acceptance Criteria:** Correctly highlights synthetic inserted text and spliced photos with elevated error variance.

#### FR-009: Photo-Region Splicing & Edge Inconsistency Detection
- **Description:** Inspect the document's photo zone for unnatural boundary discontinuities, double-edges, and color temperature mismatches.
- **Preconditions:** Document portrait photo coordinates located.
- **Inputs:** Cropped photo zone and surrounding document background.
- **Processing:** Compute Sobel gradient magnitude across photo perimeter; detect harsh cut-and-paste boundary artifacts; analyze Laplacian variance inside vs outside the portrait.
- **Expected Output:** `photo_tamper_score` ($0.0 - 1.0$), `photo_anomalies_detected: bool`, and visual boundary overlay.
- **Acceptance Criteria:** Flags photo-substitution attacks with high confidence.

#### FR-010: Noise Analysis & Metadata Anomaly Inspection
- **Description:** Analyze high-frequency sensor noise uniformity (Gaussian noise variance across sub-blocks) and parse EXIF metadata for editing software signatures (e.g. Photoshop, GIMP, Canva).
- **Preconditions:** Uploaded image binary.
- **Inputs:** Raw image byte stream.
- **Processing:**
  1. Extract EXIF tags (Software, ModifyDate, CameraModel, ColorSpace).
  2. Compute noise variance per $32\times 32$ block.
  3. If software tag contains image editors or EXIF creation date is incongruent, raise metadata tampering warning.
- **Expected Output:** Metadata report, noise uniformity score, and forensic flags.
- **Acceptance Criteria:** Metadata treated as supporting signal without causing unconfirmed hard failures on metadata-stripped web images.

---

### 2.6 Module 6: Biometric Face Verification (FACE)

#### FR-011: Document Portrait Extraction & Quality Check
- **Description:** Automatically detect and crop the holder portrait from the document image and assess biometric quality.
- **Preconditions:** Ingested document image.
- **Inputs:** Document image array.
- **Processing:** Run Haar-cascade / deep face detection. Detect face bounding box, assess resolution ($\ge 80\times 80\text{px}$), sharpness (Laplacian variance $> 100$), and lighting balance.
- **Expected Output:** Cropped portrait image (`storage/portraits/doc_<id>.jpg`), `face_detected: bool`, `quality_score: float`.
- **Failure Conditions:** No face detected flags `NO_FACE_ON_DOCUMENT` and requests manual inspection.
- **Acceptance Criteria:** Detects standard passport photos in $< 200\text{ms}$.

#### FR-012: Live Face Comparison & Cosine Similarity Scoring
- **Description:** Compare the document portrait against a live webcam or uploaded passenger face image.
- **Preconditions:** Extracted document portrait and live traveler face image.
- **Inputs:** `doc_face_image`, `live_face_image`.
- **Processing:**
  1. Detect and align both faces to standard coordinate frame.
  2. Extract 512-dimensional facial embedding vectors.
  3. Compute Cosine Similarity: $S_c = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}$.
  4. Compare against calibrated threshold (Match: $S_c \ge 0.70$, Inconclusive: $0.55 \le S_c < 0.70$, Mismatch: $S_c < 0.55$).
- **Expected Output:** `match_status` (`MATCH`, `MISMATCH`, `INCONCLUSIVE`, `POOR_QUALITY`), `similarity_score` ($0.0 - 100.0\%$), `confidence: float`, visual side-by-side comparison artifact.
- **Failure Conditions:** If live face is blurry, returns `INSUFFICIENT_IMAGE_QUALITY` without false rejection.
- **Acceptance Criteria:** Face verification latency $< 1.0\text{s}$ with distinct confidence ratings.

---

### 2.7 Module 7: Simulated Registry & Watchlist Service (REGISTRY)

#### FR-013: Mock National Registry Cross-Referencing
- **Description:** Query extensible mock databases representing national and international security registries.
- **Preconditions:** Extracted document number, holder name, nationality, DOB.
- **Inputs:** Document identifiers and traveler demographics.
- **Processing:** Query simulated tables:
  1. **Lost & Stolen Travel Documents (SLTD):** Matches stolen passport serials.
  2. **Wanted Persons / Red Notice Watchlist:** Matches high-risk individuals on name + DOB + nationality with fuzzy string matching.
  3. **Revoked / Cancelled Credentials:** Matches invalid/cancelled document numbers.
- **Expected Output:** Registry status (`CLEAR`, `HIT_STOLEN_DOCUMENT`, `HIT_WANTED_PERSON`, `HIT_REVOKED_DOCUMENT`), matching record metadata, and severity level.
- **Acceptance Criteria:** Sub-100ms response time; zero crashes on missing fields; easily seedable with synthetic test records.

---

### 2.8 Module 8: Explainable Risk Engine (RISK)

#### FR-014: Weighted Multi-Factor Risk Calculation & Factor Explanation
- **Description:** Aggregate signals from OCR, MRZ, Validation, Tampering, Face Verification, and Registry checks into an explainable risk evaluation.
- **Preconditions:** All upstream analysis modules completed.
- **Inputs:** Structured results from Modules 3 through 7.
- **Processing:**
  1. Initialize Risk Score $R = 0$.
  2. Apply configurable weighted penalties for triggered signals:
     - Registry Watchlist Hit: $+85\text{ pts}$ (CRITICAL)
     - Stolen Document Hit: $+80\text{ pts}$ (CRITICAL)
     - MRZ Checksum Mismatch: $+45\text{ pts}$ (HIGH)
     - Photo Tampering / ELA Anomaly: $+40\text{ pts}$ (HIGH)
     - Expired Document: $+35\text{ pts}$ (MEDIUM)
     - Face Biometric Mismatch: $+45\text{ pts}$ (HIGH)
     - Text Splicing / Font Anomaly: $+30\text{ pts}$ (MEDIUM)
     - Visual vs MRZ Field Discrepancy: $+35\text{ pts}$ (MEDIUM)
     - Inconclusive Biometric Quality: $+15\text{ pts}$ (LOW)
  3. Cap total risk at $100$.
  4. Determine Risk Category:
     - $0 - 25$: **LOW** (Green)
     - $26 - 55$: **MEDIUM** (Yellow/Amber)
     - $56 - 100$: **HIGH** (Red)
     - Special Flag: **MANUAL REVIEW REQUIRED** (Blue/Purple) if any inconclusive signal or high-risk alert is triggered.
  5. Generate clear, ordered list of plain-language contributing reasons.
- **Expected Output:** JSON object with `overall_risk_score`, `risk_level`, `requires_manual_review`, `contributing_factors: list[RiskFactor]`, `confidence_level: float`.
- **Acceptance Criteria:** Full traceability for every point in the risk score; no unexplainable numbers.

---

### 2.9 Module 9: Screening Review, Decisioning & Audit Trail (REVIEW)

#### FR-015: Officer Manual Determination & Case Finalization
- **Description:** Allow authorized officers to record an official screening determination with rationale and notes.
- **Preconditions:** Completed screening record.
- **Inputs:** `screening_id`, `decision` (`CLEARED`, `REFER_SECONDARY`, `REJECTED`, `DETAINED`), `officer_notes` (text).
- **Processing:** Update screening status in database, record officer ID, timestamp, and append to immutable audit log.
- **Expected Output:** Updated screening object with finalized status.
- **Acceptance Criteria:** Determination state is immediately visible on dashboard and history tables.

#### FR-016: Immutable Audit Log Generation
- **Description:** Maintain an append-only log of all system actions (logins, uploads, screenings, overrides, exports, config changes).
- **Preconditions:** Any system event.
- **Inputs:** `user_id`, `action_type`, `resource_type`, `resource_id`, `details` (JSON), `ip_address`.
- **Processing:** Insert immutable row into `audit_logs` table with SHA-256 hash chaining of previous state.
- **Expected Output:** Persisted audit record.
- **Acceptance Criteria:** Audit logs are searchable by ADMIN/SUPERVISOR and cannot be edited or deleted through application APIs.
