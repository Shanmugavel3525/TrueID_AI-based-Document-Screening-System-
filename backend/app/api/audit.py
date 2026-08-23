from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.db.session import get_db
from backend.app.models.models import AuditLog, User
from backend.app.schemas.schemas import AuditLogResponse
from backend.app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    action_type: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "SUPERVISOR"]))
):
    query = db.query(AuditLog).outerjoin(User, AuditLog.user_id == User.id)
    if action_type and action_type != "ALL":
        query = query.filter(AuditLog.action_type == action_type)
    if resource_type and resource_type != "ALL":
        query = query.filter(AuditLog.resource_type == resource_type)
        
    logs = query.order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit).all()
    
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "user_id": l.user_id,
            "username": l.user.username if l.user else "System / Guest",
            "action_type": l.action_type,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details_json": l.details_json,
            "ip_address": l.ip_address,
            "timestamp": l.timestamp
        })
    return results
