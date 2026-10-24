from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

from ..auth.utils import get_current_user
from ..ml.clustering import get_cluster_summary

router = APIRouter(prefix="/api/risk-profiles", tags=["risk_profiles"])


@router.get("/{dataset}")
async def risk_profiles(dataset: str, current_user=Depends(get_current_user)):
    if dataset not in ("diabetes", "heart"):
        raise HTTPException(status_code=400, detail="Invalid dataset")
    try:
        clusters = get_cluster_summary(dataset)
        # Annotate clusters with descriptive risk labels
        risk_labels = ["Very Low", "Low", "Moderate", "High", "Very High"]
        for i, c in enumerate(clusters):
            c["risk_label"] = risk_labels[i % len(risk_labels)]
        return {"profiles": clusters, "dataset": dataset}
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Clustering model not trained yet.")
