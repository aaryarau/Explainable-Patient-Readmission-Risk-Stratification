from fastapi import APIRouter, Depends, HTTPException
import json
import os

from ..auth.utils import get_current_user
from ..config import settings

router = APIRouter(prefix="/api/model-results", tags=["model_results"])


def _load_metrics(dataset: str) -> dict:
    path = os.path.join(settings.models_dir, f"{dataset}_metrics.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Metrics file not found: {path}")
    with open(path) as f:
        return json.load(f)


@router.get("/{dataset}")
async def model_results(dataset: str, current_user=Depends(get_current_user)):
    if dataset not in ("diabetes", "heart"):
        raise HTTPException(status_code=400, detail="Invalid dataset")
    try:
        return _load_metrics(dataset)
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Model not trained yet.")


@router.get("/")
async def all_model_results(current_user=Depends(get_current_user)):
    results = {}
    for dataset in ("diabetes", "heart"):
        try:
            results[dataset] = _load_metrics(dataset)
        except FileNotFoundError:
            results[dataset] = None
    return results
