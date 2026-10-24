from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

from ..auth.utils import get_current_user
from ..ml.counterfactual import generate_counterfactual

router = APIRouter(prefix="/api/counterfactual", tags=["counterfactual"])


class CounterfactualRequest(BaseModel):
    dataset: str
    patient_data: Dict[str, Any]
    target_probability: float = 0.25
    max_features_to_change: int = 5


@router.post("/generate")
async def counterfactual(
    request: CounterfactualRequest, current_user=Depends(get_current_user)
):
    if request.dataset not in ("diabetes", "heart"):
        raise HTTPException(status_code=400, detail="Invalid dataset")
    try:
        return generate_counterfactual(
            request.dataset,
            request.patient_data,
            request.target_probability,
            request.max_features_to_change,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Model not trained yet.")
