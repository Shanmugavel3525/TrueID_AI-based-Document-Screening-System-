# UI/UX SPECIFICATION

**Project Name:** AI-Based Fake Identity & Document Screening System  
**Problem Statement ID:** 26188  
**Organization:** Ministry of Home Affairs  
**Department:** Sashastra Seema Bal (SSB), Police II Division  
**Document Version:** 1.0.0  
**Status:** Approved Source of Truth  

---

## 1. Design Philosophy & Operational Directives

The UI/UX is built specifically for **Border Security Operations** (Sashastra Seema Bal and Immigration Checkpoints). It prioritizes:
1. **High Information Density & Rapid Scannability:** Security officers have seconds to evaluate credentials. All critical signals (MRZ check, ELA status, face match, watchlist hit, overall risk) are visible above the fold in a standardized layout.
2. **Serious, Clean & Trustworthy Aesthetic:** Avoids consumer-app gimmicks, neon gradients, bloated padding, or decorative fluff. Uses a dark/slate command-center aesthetic with crisp contrast, monospace numbers, and structured borders.
3. **Dual-Channel Status Indicators:** Never communicates status via color alone. Every risk level and validation state uses a distinct icon + color + textual badge (e.g., CheckCircle + Emerald + "VERIFIED", AlertTriangle + Amber + "WARNING", XCircle + Crimson + "CRITICAL ANOMALY").
4. **Interactive Forensic Inspector:** Officers can toggle between the raw document image, optical character bounding boxes, and the Error Level Analysis (ELA) compression heatmap.

---

## 2. Design Tokens & Visual Hierarchy

### 2.1 Color Palette
- **Background Slate:** `bg-slate-950` (#030712) for command center backdrop.
- **Surface Elevation 1 (Cards & Sidebars):** `bg-slate-900` (#0f172a) with border `border-slate-800`.
- **Surface Elevation 2 (Inputs & Inner Panels):** `bg-slate-800/60` (#1e293b).
- **Primary Action (Command Blue/Indigo):** `bg-indigo-600` (#4f46e5), hover `bg-indigo-500`.
- **Status Green (Cleared / Pass / Verified):** `text-emerald-400`, `bg-emerald-950/40`, `border-emerald-800`.
- **Status Amber (Warning / Medium Risk / Expired):** `text-amber-400`, `bg-amber-950/40`, `border-amber-800`.
- **Status Red (High Risk / Fraud / Watchlist Hit):** `text-rose-400`, `bg-rose-950/40`, `border-rose-800`.
- **Status Purple/Blue (Manual Review Required):** `text-sky-400`, `bg-sky-950/40`, `border-sky-800`.
- **Text Hierarchy:** `text-slate-100` (Primary Titles), `text-slate-300` (Labels & Values), `text-slate-400` (Secondary/Captions), `text-slate-500` (Muted).

### 2.2 Typography
- **UI Font:** `Inter`, system-ui, -apple-system, sans-serif (Clean, highly legible at small sizes).
- **Monospace Data Font:** `JetBrains Mono`, `Consolas`, monospace (Used for Passport Numbers, MRZ strings, SHA-256 Hashes, Checksums, and Coordinates).

### 2.3 Spacing & Radius Tokens
- **Padding/Margin Scale:** 4px baseline (`p-1`=4px, `p-2`=8px, `p-3`=12px, `p-4`=16px, `p-6`=24px).
- **Border Radius:** `rounded-lg` (8px) for containers, `rounded-md` (6px) for buttons/badges, `rounded` (4px) for micro-tags.

---

## 3. Screen Specifications & Layouts

### 3.1 Screen 1: Authentication & Quick Access (`/login`)
- **Branding Header:** Official emblem placeholder, "Ministry of Home Affairs / Sashastra Seema Bal", "AI Document Screening System (PS-26188)".
- **Credential Form:** Username/Email input, Password input with visibility toggle, Security PIN / Badge verification, "Secure Sign In" button with loading spinner.
- **Quick Demo Login Bar:** Direct one-click login buttons for evaluation:
  - `[Officer Demo]` (Badge #SSB-8492)
  - `[Supervisor Demo]` (Badge #SSB-SUP-104)
  - `[Admin Demo]` (Badge #SSB-SYS-001)

### 3.2 Screen 2: Command Center Dashboard (`/dashboard`)
- **Top Stats Bar (4 Metric Cards):**
  1. *Today's Total Screenings* (with throughput trend).
  2. *Low Risk / Cleared* (Green badge, count & percentage).
  3. *Medium / High Risk Flagged* (Amber/Red badge, count & alerts).
  4. *Pending Manual Reviews* (Blue pulse indicator, immediate action trigger).
- **Quick Action Bar:** `[+ New Document Screening]`, `[View Flagged Alerts]`, `[Export Shift Report]`.
- **Two-Column Operations Grid:**
  - *Left (65% width):* Recent Screening Queue with live status badges, traveler name, document type, risk gauge, officer badge, and direct "Inspect Case" button.
  - *Right (35% width):* Risk Distribution Chart, Watchlist Activity Feed, and System Health Monitor.

### 3.3 Screen 3: New Document Screening Studio (`/screening/new`)
- **Document Type Selector:** Tabs for `Passport (TD3)`, `Visa (TD2)`, `National ID (TD1)`, `Driving Licence`, `Permit`.
- **Dual Ingestion Zone:**
  - *Document Ingestion:* Drag-and-drop file upload (PDF/JPG/PNG) + "Use Demo Sample" selector for instant testing of synthetic edge cases.
  - *Passenger Photo / Live Biometrics:* Live camera capture feed or passenger portrait photo upload.
- **Pipeline Progress Bar (Real-Time 6-Stage Execution):**
  1. *Document Ingestion & Hash* $\rightarrow$ 2. *OCR & Field Parsing* $\rightarrow$ 3. *MRZ & Checksum Engine* $\rightarrow$ 4. *Forensics & ELA Analysis* $\rightarrow$ 5. *Face Biometric Matching* $\rightarrow$ 6. *Registry & Risk Evaluation*.
- **"Execute Full Screening" Button:** Triggers concurrent analysis pipeline with micro-spinners on each stage.

### 3.4 Screen 4: Forensic Case Inspector & Decision Terminal (`/screening/:id`)
- **Header Bar:** Screening ID, Traveler Name, Document Number, Timestamp, Officer ID, and Large Risk Badge (`HIGH RISK (85/100)`).
- **Main 3-Column Inspection Terminal:**
  - **Column 1 (Visual Forensics & Document Viewer - 35%):**
    - High-res interactive image viewer.
    - View Mode Switcher: `[Original Image]` | `[Detected Text Zones]` | `[Error Level Analysis (ELA) Heatmap]` | `[Photo Region Zoom]`.
    - Tampering Anomaly Summary Box (ELA score, noise variance, metadata analysis).
  - **Column 2 (Extracted Fields & Verification Checks - 40%):**
    - *Extracted Biographical Data Table:* Document No, Surname, Given Names, DOB, Nationality, Issue Date, Expiry Date with side-by-side VIZ vs MRZ match tags.
    - *ICAO 9303 MRZ Terminal:* Raw 2-line/3-line MRZ with color-coded check digit validation (Green = Valid, Red = Mismatch).
    - *Temporal & Format Rules:* Expiry status, age validity, number syntax checks.
  - **Column 3 (Biometrics, Registry & Decision Action - 25%):**
    - *Biometric Face Match Panel:* Side-by-side cropped document portrait vs live photo with Cosine Similarity meter (e.g., `88.4% Match - HIGH CONFIDENCE`).
    - *Registry Lookup Panel:* Stolen Document check, Wanted Watchlist check, Revoked Permits check.
    - *Explainable Risk Contributors:* Expandable cards listing each contributing factor and point penalty.
    - *Official Determination Action Bar:*
      - Buttons: `[Clear Document]`, `[Refer to Secondary]`, `[Reject / Impound]`, `[Detain Subject]`.
      - Mandatory Officer Notes text area and "Sign & Submit Determination" button.
      - `[Download PDF Forensic Dossier]` button.

### 3.5 Screen 5: Screening History & Audit Explorer (`/history`)
- **Search & Filter Bar:** Text search (Traveler Name, Document No, Officer), Date Range selector, Risk Level dropdown (`ALL`, `LOW`, `MEDIUM`, `HIGH`, `MANUAL_REVIEW`), Decision Status dropdown, Document Type dropdown.
- **Data Table:** Columns for Timestamp, Screening ID, Document Type, Subject Name, Doc Number, Risk Score (visual gauge), Final Decision, Officer Badge, Actions (`[Inspect]`, `[Export PDF]`).
- **Pagination & Bulk Export:** 15 items per page, CSV/JSON export option.

### 3.6 Screen 6: Flagged Alerts & Watchlist Triage (`/alerts`)
- Prioritized view of all unresolved high-risk screenings, stolen document hits, and watchlist matches requiring immediate secondary inspection or supervisory sign-off.

### 3.7 Screen 7: System Settings & Configurator (`/settings`)
- *Risk Engine Weight Matrix:* Sliders for MRZ mismatch weight, ELA anomaly weight, Face mismatch weight, Expired doc weight, Watchlist hit weight.
- *Mock Registry Simulator Manager:* Table to view, add, edit, or delete simulated stolen passports, wanted individuals, and revoked documents.
- *Immutable Audit Log Viewer (Admin/Supervisor only):* Chronological event log with filterable actions, user IDs, IP addresses, and cryptographic state hashes.

---

## 4. Accessibility & Responsive Directives

1. **Keyboard Accessibility:** All primary workflows (upload, trigger analysis, decision selection, modal navigation) support standard keyboard navigation (`Tab`, `Enter`, `Space`, `Esc`).
2. **Focus Visibility:** Standard visible focus ring `ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950`.
3. **Screen Resolution Support:** Optimized for 1080p ($1920\times 1080$) and 1440p desktop security workstations, with fluid responsive collapsing down to laptop ($1366\times 768$) and tablet ($1024\times 768$) viewports.
