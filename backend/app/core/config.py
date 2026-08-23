import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Based Fake Identity & Document Screening System"
    PROBLEM_STATEMENT_ID: str = "26188"
    ORGANIZATION: str = "Ministry of Home Affairs - SSB Police II"
    API_V1_STR: str = "/api"

    # Security & Tokens
    SECRET_KEY: str = "sih-2026-ssb-mha-ultra-secure-jwt-key-998822"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours

    # Storage Paths
    BASE_DIR: Path = BASE_DIR / "backend"
    STORAGE_DIR: Path = BASE_DIR / "storage"
    DOCUMENTS_DIR: Path = STORAGE_DIR / "documents"
    NORMALIZED_DIR: Path = STORAGE_DIR / "normalized"
    FORENSICS_DIR: Path = STORAGE_DIR / "forensics"
    PORTRAITS_DIR: Path = STORAGE_DIR / "portraits"
    REPORTS_DIR: Path = STORAGE_DIR / "reports"
    SAMPLES_DIR: Path = STORAGE_DIR / "samples"

    # Database — Neon PostgreSQL (override via .env)
    DATABASE_URL: str = "postgresql://neondb_owner:npg_kB6bZSLel2Io@ep-wandering-base-awpwbju2-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require"

    # AI & Risk Thresholds
    FACE_MATCH_THRESHOLD: float = 0.68
    FACE_INCONCLUSIVE_THRESHOLD: float = 0.52
    ELA_SUSPICIOUS_THRESHOLD: float = 0.35
    NOISE_ANOMALY_THRESHOLD: float = 0.40

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"]

    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Ensure storage directories exist
for directory in [
    settings.STORAGE_DIR,
    settings.DOCUMENTS_DIR,
    settings.NORMALIZED_DIR,
    settings.FORENSICS_DIR,
    settings.PORTRAITS_DIR,
    settings.REPORTS_DIR,
    settings.SAMPLES_DIR
]:
    directory.mkdir(parents=True, exist_ok=True)
