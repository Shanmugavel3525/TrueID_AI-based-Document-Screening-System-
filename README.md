<div align="center">

# 🛡️ TrueID Application
### AI-Based Fake Identity & Document Screening System

**Problem Statement ID: 26188 | Ministry of Home Affairs

![Prototype](https://img.shields.io/badge/Status-Prototype%20Model-amber?style=for-the-badge&logo=shield&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-14%2F14%20Passing-22c55e?style=for-the-badge&logo=pytest&logoColor=white)

> ⚠️ **PROTOTYPE MODEL** — This system is developed for demonstration, research, and evaluation purposes only.  
> Results are AI-assisted decision support and should not be treated as a final legal determination or official government verification.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Demo Credentials](#-demo-credentials)
- [AI Pipeline](#-ai-pipeline)
- [Test Suite](#-test-suite)
- [Disclaimer](#-disclaimer)

---

## 🔍 Overview

**TrueID** is a production-quality prototype of an AI-powered document screening and identity verification platform built for border/security checkpoint scenarios under **Smart India Hackathon (SIH) Problem Statement #26188**.

The system enables authorized security officers to:
- Rapidly screen passports, visas, national ID cards, driving licences, and travel permits
- Detect document tampering and manipulation with ELA forensics
- Validate MRZ (Machine Readable Zone) against ICAO Doc 9303 standards
- Perform biometric 1:1 face matching between document portrait and live capture
- Cross-reference against simulated stolen document and watchlist registries
- Generate explainable, weighted risk scores with a full PDF forensic dossier

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **OCR Field Extraction** | Automated extraction of name, DOB, nationality, document number, expiry date |
| 🔢 **ICAO 9303 MRZ Engine** | Full TD1/TD2/TD3 MRZ parsing with 7-3-1 weighted checksum algorithm |
| 🔬 **ELA Forensics** | Error Level Analysis for pixel-level tampering and photo-splicing detection |
| 👤 **Biometric Face Match** | 512-dimensional embedding cosine similarity between document & live portrait |
| 📡 **Simulated Registry Checks** | Mock Interpol SLTD, Red Notice, and Revoked Permits watchlist cross-reference |
| ⚖️ **Risk Scoring Engine** | Explainable weighted multi-factor risk score (0–100) with contributing factor breakdown |
| 📑 **PDF Dossier Export** | Full ReportLab forensic inspection report per case |
| 🔐 **Role-Based Access** | JWT auth with OFFICER / SUPERVISOR / ADMIN roles |
| 📊 **Real-time Dashboard** | Live KPI stats, screening pipeline visualization, recent activity feed |
| 🗃️ **Audit Trail** | Full immutable audit log of all actions per officer |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DocVerify AI                         │
├─────────────────┬───────────────────────────────────────┤
│   Frontend      │   Backend                             │
│   React 19      │   FastAPI (Python)                    │
│   TypeScript    │                                       │
│   Tailwind v4   │  ┌──────────────────────────────┐    │
│   Vite          │  │     AI Screening Pipeline     │    │
│                 │  │  1. OCR Field Extraction      │    │
│  ┌───────────┐  │  │  2. ICAO 9303 MRZ Parsing    │    │
│  │ Dashboard │  │  │  3. ELA Tampering Analysis   │    │
│  │ Screening │──┼──│  4. Biometric Face Match     │    │
│  │ Inspector │  │  │  5. Registry Cross-Check     │    │
│  │ History   │  │  │  6. Risk Score Calculation   │    │
│  │ Alerts    │  │  └──────────────────────────────┘    │
│  │ Settings  │  │                                       │
│  └───────────┘  │  ┌──────────────────────────────┐    │
│                 │  │   Neon PostgreSQL (Cloud)     │    │
└─────────────────┴──│   12 tables, pgv18, SSL      │    │
                     └──────────────────────────────┘    │
```

---

## 🛠️ Tech Stack

### Backend
| Component | Technology |
|---|---|
| Framework | FastAPI 0.115 |
| Database | Neon PostgreSQL 18 (via SQLAlchemy ORM) |
| Auth | JWT (python-jose) + bcrypt password hashing |
| Image Processing | Pillow (PIL) |
| PDF Generation | ReportLab |
| OCR (simulated) | Custom pattern-based extractor |
| MRZ Parsing | Custom ICAO 9303 7-3-1 engine |
| Testing | pytest + httpx |

### Frontend
| Component | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| HTTP Client | Fetch API |
| Auth State | React Context API |

---

## 📁 Project Structure

```
AI-Based-Fake-Identity-Document-Screening-System/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI route handlers
│   │   │   ├── auth.py       # Login, /me, quick-demo
│   │   │   ├── documents.py  # Document upload
│   │   │   ├── screenings.py # Screening CRUD + AI pipeline
│   │   │   ├── registries.py # Mock registry management
│   │   │   ├── audit.py      # Audit log viewer
│   │   │   └── settings.py   # Risk weight config
│   │   ├── core/
│   │   │   ├── config.py     # Settings + env loading
│   │   │   └── security.py   # JWT + bcrypt utilities
│   │   ├── db/
│   │   │   └── session.py    # SQLAlchemy engine (Neon)
│   │   ├── models/
│   │   │   └── models.py     # ORM table definitions
│   │   ├── schemas/
│   │   │   └── schemas.py    # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── mrz_service.py       # ICAO 9303 MRZ engine
│   │   │   ├── forensics_service.py # ELA tampering analysis
│   │   │   ├── face_service.py      # Biometric matcher
│   │   │   ├── ocr_service.py       # Field extractor
│   │   │   ├── registry_service.py  # Watchlist checker
│   │   │   ├── risk_engine.py       # Risk scorer
│   │   │   ├── validation_service.py# Document rule validator
│   │   │   └── report_service.py    # PDF dossier generator
│   │   ├── main.py           # FastAPI app entrypoint
│   │   └── seed_data.py      # Demo data seeder
│   └── tests/
│       ├── test_api.py       # Auth & API endpoint tests
│       ├── test_flow.py      # End-to-end lifecycle test
│       ├── test_mrz.py       # MRZ engine unit tests
│       ├── test_risk_engine.py
│       └── test_validation.py
├── frontend/
│   ├── public/
│   │   └── favicon.svg       # Custom shield favicon
│   └── src/
│       ├── components/
│       │   ├── common/       # RiskBadge, StatusBadge
│       │   └── layout/       # Navbar
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── NewScreening.tsx
│       │   ├── CaseInspector.tsx
│       │   ├── History.tsx
│       │   ├── Alerts.tsx
│       │   ├── Settings.tsx
│       │   └── Login.tsx
│       ├── services/
│       │   └── api.ts        # All backend API calls
│       └── types/
│           └── index.ts      # TypeScript type definitions
├── docs/
│   ├── 1_PRD.md              # Product Requirements Document
│   ├── 2_SRS.md              # Software Requirements Specification
│   ├── 3_SYSTEM_ARCHITECTURE.md
│   ├── 4_UI_UX_SPECIFICATION.md
│   └── 5_DEVELOPMENT_PLAN.md
├── .env.example              # Environment variable template
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Neon](https://neon.tech) account (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/void-tech-shiv/AI-Based-Fake-Identity-Document-Screening-System.git
cd AI-Based-Fake-Identity-Document-Screening-System
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Linux/macOS)
source .venv/bin/activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose[cryptography] \
    bcrypt passlib pillow numpy reportlab pydantic-settings python-multipart \
    pytest httpx anyio
```

### 3. Configure Environment

```bash
# Copy the template
cp .env.example .env
```

Edit `.env` and set your Neon PostgreSQL connection string:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
SECRET_KEY=your-long-random-secret-key
```

### 4. Initialize & Seed Database

```bash
# Tables are auto-created on first startup via SQLAlchemy create_all()
# Seed demo users + 10 synthetic screening cases:
python -m backend.app.seed_data
```

### 5. Start Backend

```bash
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend runs at: **http://127.0.0.1:8000**  
Interactive API docs: **http://127.0.0.1:8000/docs**

### 6. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://127.0.0.1:5173**

---

## 🔑 Demo Credentials

| Role | Username | Password | Access Level |
|---|---|---|---|
| 🟢 Officer | `officer` | `officer123` | Screen documents, submit decisions |
| 🟡 Supervisor | `supervisor` | `super123` | All officer access + approve referrals |
| 🔴 Admin | `admin` | `admin123` | Full system access + audit logs |

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate and get JWT token |
| `GET` | `/api/auth/me` | Get current user profile |
| `POST` | `/api/documents/upload` | Upload a document image |
| `POST` | `/api/screenings/` | Create and run full AI screening |
| `GET` | `/api/screenings/` | List all screenings (paginated) |
| `GET` | `/api/screenings/{id}` | Get full screening detail + forensics |
| `POST` | `/api/screenings/{id}/decision` | Submit officer decision |
| `GET` | `/api/screenings/{id}/report` | Download PDF forensic dossier |
| `GET` | `/api/screenings/stats/dashboard` | Dashboard KPI statistics |
| `GET` | `/api/registries` | List simulated watchlist registries |
| `POST` | `/api/registries` | Add registry record (Admin/Supervisor) |
| `GET` | `/api/settings/risk-weights` | Get risk factor weights |
| `PUT` | `/api/settings/risk-weights` | Update risk factor weights |
| `GET` | `/api/audit-logs` | View audit trail (Admin only) |

Full interactive documentation: **http://127.0.0.1:8000/docs**

---

## 🤖 AI Pipeline

Each document submission runs through a **6-stage sequential AI pipeline**:

```
Stage 1: OCR Field Extraction
  └─ Extracts: name, DOB, nationality, document number, expiry, gender

Stage 2: ICAO Doc 9303 MRZ Validation
  └─ Parses TD1/TD2/TD3 MRZ zones
  └─ Validates all 7 check digits using 7-3-1 weighted modulo-10 algorithm
  └─ Cross-checks MRZ values against VIZ (visual inspection zone) fields

Stage 3: Error Level Analysis (ELA) Forensics
  └─ Re-compresses image at 95% JPEG quality
  └─ Computes per-pixel error delta amplified ×10
  └─ Identifies high-error anomaly regions (splicing, cloning, retouching)

Stage 4: Biometric Face Verification
  └─ Extracts document portrait region
  └─ Simulates 512-dimensional facial embedding
  └─ Computes cosine similarity between document and live face
  └─ Classifies: MATCH / MISMATCH / INCONCLUSIVE / LOW_QUALITY

Stage 5: Simulated Registry Cross-Check
  └─ Checks: Interpol SLTD (Stolen & Lost Travel Documents)
  └─ Checks: Red Notices (Wanted Persons)
  └─ Checks: Revoked/Cancelled Permits
  └─ Returns: CLEAR / HIT_STOLEN / HIT_WANTED / HIT_REVOKED

Stage 6: Weighted Risk Assessment
  └─ Aggregates all stage results
  └─ Applies configurable per-factor weights
  └─ Produces final risk score 0–100
  └─ Classifies: LOW / MEDIUM / HIGH / MANUAL_REVIEW
  └─ Generates explainable contributing factors list
```

---

## 🧪 Test Suite

```bash
# Run all tests
python -m pytest -v backend/tests/

# Expected output:
# backend/tests/test_api.py::test_health_endpoint              PASSED
# backend/tests/test_api.py::test_auth_login_success           PASSED
# backend/tests/test_api.py::test_auth_login_invalid           PASSED
# backend/tests/test_api.py::test_list_screenings_authenticated PASSED
# backend/tests/test_api.py::test_dashboard_stats_endpoint     PASSED
# backend/tests/test_flow.py::test_full_platform_lifecycle     PASSED
# backend/tests/test_mrz.py::test_mrz_check_digit_calculation  PASSED
# backend/tests/test_mrz.py::test_mrz_td3_passport_parsing     PASSED
# backend/tests/test_mrz.py::test_mrz_tampered_check_digit     PASSED
# backend/tests/test_risk_engine.py::test_risk_engine_clean    PASSED
# backend/tests/test_risk_engine.py::test_risk_watchlist_hit   PASSED
# backend/tests/test_validation.py::test_clean_document        PASSED
# backend/tests/test_validation.py::test_expired_document      PASSED
# backend/tests/test_validation.py::test_future_issue_date     PASSED
#
# ==================== 14 passed in 2.29s ====================
```

---

## 📄 Documentation

| Document | Description |
|---|---|
| [`docs/1_PRD.md`](docs/1_PRD.md) | Product Requirements Document |
| [`docs/2_SRS.md`](docs/2_SRS.md) | Software Requirements Specification |
| [`docs/3_SYSTEM_ARCHITECTURE.md`](docs/3_SYSTEM_ARCHITECTURE.md) | System Architecture |
| [`docs/4_UI_UX_SPECIFICATION.md`](docs/4_UI_UX_SPECIFICATION.md) | UI/UX Specification |
| [`docs/5_DEVELOPMENT_PLAN.md`](docs/5_DEVELOPMENT_PLAN.md) | Development Plan |

---

## ⚠️ Disclaimer

> **PROTOTYPE DEMONSTRATION SYSTEM**
>
> This platform is a **prototype** developed to demonstrate AI-assisted identity and document screening capabilities for Smart India Hackathon Problem Statement #26188.
>
> - Results are intended for **evaluation and decision-support demonstration only**
> - All registry checks use **simulated/mock data** — not connected to any real government database, Interpol, or Ministry of Home Affairs system
> - AI outputs should **never be treated as a final legal determination**
> - This system is **not an official government verification portal**
> - No real personal identity data should be submitted to this system

---

## 👥 Team

**Organization:** Ministry of Home Affairs — Sashastra Seema Bal (SSB), Police II Division  
**Problem Statement:** #26188 — AI-Based Fake Identity & Document Screening System  
**Developer:** [void-tech-shiv](https://github.com/void-tech-shiv)

---

<div align="center">

**TrueID App** · Prototype Model · Problem Statement ID: 26188

*Built with ❤️ for Smart India Hackathon*

</div>
