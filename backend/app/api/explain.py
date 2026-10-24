from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List

from ..auth.utils import get_current_user
from ..ml.explain_shap import explain_prediction, global_feature_importance

router = APIRouter(prefix="/api/explain", tags=["explain"])


class ExplainRequest(BaseModel):
    dataset: str
    patient_data: Dict[str, Any]


@router.post("/prediction")
async def explain(request: ExplainRequest, current_user=Depends(get_current_user)):
    if request.dataset not in ("diabetes", "heart"):
        raise HTTPException(status_code=400, detail="dataset must be 'diabetes' or 'heart'")
    try:
        return explain_prediction(request.dataset, request.patient_data)
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Model not trained yet.")


@router.get("/global/{dataset}")
async def global_importance(dataset: str, n_top: int = 20, current_user=Depends(get_current_user)):
    if dataset not in ("diabetes", "heart"):
        raise HTTPException(status_code=400, detail="Invalid dataset")
    try:
        return {"features": global_feature_importance(dataset, n_top)}
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Model not trained yet.")
