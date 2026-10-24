from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel

from ..auth.utils import get_current_user

router = APIRouter(prefix="/api/reliability", tags=["reliability"])


class ReliabilityDataRequest(BaseModel):
    dataset: str
    predictions: List[Dict[str, Any]]   # list of {probability, actual_label}


@router.post("/calibration")
async def calibration(request: ReliabilityDataRequest, current_user=Depends(get_current_user)):
    """
    Compute calibration curve from provided prediction/label pairs.
    The client sends (probability, actual_label) pairs so this can work
    without re-running the full test set server-side.
    """
    import numpy as np
    from sklearn.calibration import calibration_curve

    if len(request.predictions) < 10:
        raise HTTPException(status_code=400, detail="Need at least 10 data points for calibration.")

    y_prob = np.array([p["probability"] for p in request.predictions])
    y_true = np.array([p["actual_label"] for p in request.predictions])

    frac_pos, mean_pred = calibration_curve(y_true, y_prob, n_bins=10)

    return {
        "fraction_of_positives": frac_pos.tolist(),
        "mean_predicted_value": mean_pred.tolist(),
    }


@router.post("/metrics")
async def reliability_metrics(
    request: ReliabilityDataRequest, current_user=Depends(get_current_user)
):
    import numpy as np

    y_prob = np.array([p["probability"] for p in request.predictions])
    y_true = np.array([p["actual_label"] for p in request.predictions])

    brier = float(np.mean((y_prob - y_true) ** 2))

    n_bins = 10
    bins = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for i in range(n_bins):
        mask = (y_prob >= bins[i]) & (y_prob < bins[i + 1])
        if mask.sum() > 0:
            acc = float(np.mean(y_true[mask] == (y_prob[mask] >= 0.5)))
            conf = float(np.mean(y_prob[mask]))
            ece += mask.sum() * abs(acc - conf)
    ece /= max(len(y_prob), 1)

    return {"brier_score": brier, "expected_calibration_error": float(ece)}
