from fastapi import APIRouter, Depends, HTTPException
import json
import os

from ..auth.utils import get_current_user
from ..config import settings
from ..ml.explain_shap import global_feature_importance

router = APIRouter(prefix="/api/cross-dataset", tags=["cross_dataset"])


@router.get("/comparison")
async def cross_dataset_comparison(current_user=Depends(get_current_user)):
    """Compare metrics and top features across both datasets."""
    results = {}
    for dataset in ("diabetes", "heart"):
        metrics_path = os.path.join(settings.models_dir, f"{dataset}_metrics.json")
        if os.path.exists(metrics_path):
            with open(metrics_path) as f:
                results[dataset] = json.load(f)
            try:
                results[dataset]["top_features"] = global_feature_importance(dataset, n_top=10)
            except Exception:
                results[dataset]["top_features"] = []
        else:
            results[dataset] = None

    if not any(results.values()):
        raise HTTPException(status_code=503, detail="No models trained yet.")

    return {"datasets": results}


@router.get("/feature-overlap")
async def feature_overlap(current_user=Depends(get_current_user)):
    """Identify features that are important in both datasets."""
    try:
        diabetes_feats = {f["feature"] for f in global_feature_importance("diabetes", 20)}
        heart_feats = {f["feature"] for f in global_feature_importance("heart", 20)}
        overlap = diabetes_feats & heart_feats
        return {
            "overlap_features": list(overlap),
            "diabetes_only": list(diabetes_feats - heart_feats),
            "heart_only": list(heart_feats - diabetes_feats),
        }
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="One or more models not trained yet.")
