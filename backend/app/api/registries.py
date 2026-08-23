from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.db.session import get_db
from backend.app.models.models import RegistryRecord, User, AuditLog
from backend.app.schemas.schemas import RegistryRecordCreate, RegistryRecordResponse
from backend.app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/registries", tags=["Registries"])

@router.get("", response_model=List[RegistryRecordResponse])
def list_registry_records(
    registry_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(RegistryRecord)
    if registry_type and registry_type != "ALL":
        query = query.filter(RegistryRecord.registry_type == registry_type)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (RegistryRecord.document_number.ilike(search_term)) |
            (RegistryRecord.full_name.ilike(search_term)) |
            (RegistryRecord.reason.ilike(search_term))
        )
    return query.order_by(desc(RegistryRecord.created_at)).offset(skip).limit(limit).all()

@router.post("", response_model=RegistryRecordResponse, status_code=status.HTTP_201_CREATED)
def create_registry_record(
    record_in: RegistryRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "SUPERVISOR"]))
):
    record = RegistryRecord(
        registry_type=record_in.registry_type,
        document_number=record_in.document_number.upper() if record_in.document_number else None,
        full_name=record_in.full_name.upper() if record_in.full_name else None,
        date_of_birth=record_in.date_of_birth,
        nationality=record_in.nationality.upper() if record_in.nationality else None,
        reason=record_in.reason,
        severity=record_in.severity,
        is_active=True
    )
    db.add(record)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action_type="REGISTRY_RECORD_CREATED",
        resource_type="REGISTRY",
        resource_id=record.id,
        details_json=record_in.dict()
    )
    db.add(audit)
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_registry_record(
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    record = db.query(RegistryRecord).filter(RegistryRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    db.delete(record)
    audit = AuditLog(
        user_id=current_user.id,
        action_type="REGISTRY_RECORD_DELETED",
        resource_type="REGISTRY",
        resource_id=record_id,
        details_json={"deleted_id": record_id}
    )
    db.add(audit)
    db.commit()
    return None
