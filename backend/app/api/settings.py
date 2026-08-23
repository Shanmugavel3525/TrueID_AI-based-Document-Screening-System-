from fastapi import APIRouter, Depends
from backend.app.schemas.schemas import RiskWeightSettings
from backend.app.api.deps import get_current_user, require_roles
from backend.app.models.models import User

router = APIRouter(prefix="/settings", tags=["Settings"])

# In-memory runtime weight matrix configuration (can be updated by ADMIN)
CURRENT_RISK_WEIGHTS = RiskWeightSettings()

@router.get("/risk-weights", response_model=RiskWeightSettings)
def get_risk_weights(current_user: User = Depends(get_current_user)):
    return CURRENT_RISK_WEIGHTS

@router.post("/risk-weights", response_model=RiskWeightSettings)
def update_risk_weights(
    new_weights: RiskWeightSettings,
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    global CURRENT_RISK_WEIGHTS
    CURRENT_RISK_WEIGHTS = new_weights
    return CURRENT_RISK_WEIGHTS
