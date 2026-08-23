import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.db.session import engine, Base
from backend.app.api import auth, documents, screenings, registries, audit, settings as api_settings

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Based Fake Identity & Document Screening System for Ministry of Home Affairs (SSB Police II Division) - PS 26188",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Storage directory for serving documents, forensics heatmaps, and portraits
app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_DIR)), name="storage")

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(screenings.router, prefix=settings.API_V1_STR)
app.include_router(registries.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(api_settings.router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "organization": settings.ORGANIZATION,
        "problem_statement": settings.PROBLEM_STATEMENT_ID,
        "version": "1.0.0"
    }

@app.get("/")
def root():
    return {
        "message": "AI Document Screening System API Gateway Active",
        "docs": "/docs",
        "health": "/health"
    }
