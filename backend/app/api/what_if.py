from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List

from ..auth.utils import get_current_user
from ..ml.predict import predict_risk
from ..ml.explain_shap import explain_prediction

router = APIRouter(prefix="/api/what-if", tags=["what_if"])


class WhatIfScenario(BaseModel):
    feature: str
    value: Any


class WhatIfRequest(BaseModel):
    dataset: str
    base_patient_data: Dict[str, Any]
    scenarios: List[WhatIfScenario]


@router.post("/simulate")
async def what_if_simulate(request: WhatIfRequest, current_user=Depends(get_current_user)):
    """
    Simulate the impact of changing individual features on the predicted risk.
    Returns risk probability for each scenario vs the baseline.
    """
    if request.dataset not in ("diabetes", "heart"):
        raise HTTPException(status_code=400, detail="Invalid dataset")

    try:
        baseline = predict_risk(request.dataset, request.base_patient_data)
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Model not trained yet.")

    scenario_results = []
    for scenario in request.scenarios:
        modified = request.base_patient_data.copy()
        modified[scenario.feature] = scenario.value
        result = predict_risk(request.dataset, modified)
        scenario_results.append({
            "feature": scenario.feature,
            "new_value": scenario.value,
            "original_value": request.base_patient_data.get(scenario.feature),
            "probability": result["probability"],
            "risk_level": result["risk_level"],
            "probability_delta": round(result["probability"] - baseline["probability"], 4),
        })

    return {
        "baseline_probability": baseline["probability"],
        "baseline_risk_level": baseline["risk_level"],
        "scenarios": scenario_results,
    }
