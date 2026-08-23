from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.core.security import verify_password, get_password_hash, create_access_token
from backend.app.models.models import User, AuditLog
from backend.app.schemas.schemas import Token, LoginRequest, UserResponse, UserCreate
from backend.app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == login_data.username) | (User.email == login_data.username)
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        # Record failed login attempt in audit log
        audit = AuditLog(
            user_id=user.id if user else None,
            action_type="AUTH_LOGIN_FAILED",
            resource_type="AUTH",
            resource_id=login_data.username,
            details_json={"attempted_username": login_data.username, "status": "REJECTED"},
            ip_address=request.client.host if request.client else "127.0.0.1"
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated")
        
    access_token = create_access_token(subject=user.id, role=user.role)
    
    # Audit log successful login
    audit = AuditLog(
        user_id=user.id,
        action_type="AUTH_LOGIN_SUCCESS",
        resource_type="AUTH",
        resource_id=user.id,
        details_json={"username": user.username, "role": user.role, "badge": user.badge_number},
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    db.add(audit)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/register", response_model=UserResponse)
def register_officer(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    existing = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email) | (User.badge_number == user_in.badge_number)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this username, email, or badge number already exists")
        
    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        badge_number=user_in.badge_number,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
