import hashlib
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.core.config import settings
from backend.app.models.models import Document, User, AuditLog
from backend.app.schemas.schemas import DocumentResponse
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form("PASSPORT"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {ALLOWED_MIME_TYPES}"
        )
        
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds maximum size of 15MB")
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
    # Calculate SHA-256 Digest for immutable chain of custody
    sha256_hash = hashlib.sha256(contents).hexdigest()
    
    # Save file to storage
    file_ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    doc_id = str(uuid.uuid4())
    stored_filename = f"{doc_id}{file_ext}"
    dest_path = settings.DOCUMENTS_DIR / stored_filename
    
    with open(dest_path, "wb") as f:
        f.write(contents)
        
    # Relative path for frontend/api consumers
    rel_path = f"/storage/documents/{stored_filename}"
    
    doc = Document(
        id=doc_id,
        document_type=document_type.upper(),
        original_filename=file.filename or "uploaded_document",
        file_path=rel_path,
        file_mime_type=file.content_type,
        file_size_bytes=len(contents),
        sha256_hash=sha256_hash
    )
    db.add(doc)
    
    # Record Audit Log
    audit = AuditLog(
        user_id=current_user.id,
        action_type="DOCUMENT_UPLOAD",
        resource_type="DOCUMENT",
        resource_id=doc.id,
        details_json={
            "filename": file.filename,
            "document_type": document_type,
            "sha256": sha256_hash,
            "size": len(contents)
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(doc)
    
    return doc

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
