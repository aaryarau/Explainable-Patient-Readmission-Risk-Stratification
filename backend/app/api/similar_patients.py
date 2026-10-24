from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List

from ..auth.utils import get_current_user
from ..ml.similarity import find_similar_patients
from ..database.connection import get_database

router = APIRouter(prefix="/api/similar-patients", tags=["similar_patients"])


class SimilarPatientsRequest(BaseModel):
    dataset: str
    patient_data: Dict[str, Any]
    top_k: int = 5
    metric: str = "cosine"


@router.post("/")
async def similar_patients(
    request: SimilarPatientsRequest, current_user=Depends(get_current_user)
):
    if request.dataset not in ("diabetes", "heart"):
        raise HTTPException(status_code=400, detail="Invalid dataset")

    db = get_database()
    # Fetch recent predictions from DB to use as the reference pool
    cursor = db["predictions"].find({"dataset": request.dataset}).sort("created_at", -1).limit(500)
    historical = await cursor.to_list(length=500)

    if not historical:
        raise HTTPException(
            status_code=404,
            detail="No historical patients in database yet. Make some predictions first.",
        )

    # Flatten patient_data + outcome fields for similarity comparison
    pool = []
    for p in historical:
        record = p.get("patient_data", {}).copy()
        record["readmitted"] = p.get("prediction", 0)
        record["probability"] = p.get("probability", 0.0)
        record["risk_level"] = p.get("risk_level", "unknown")
        pool.append(record)

    try:
        results = find_similar_patients(
            request.dataset,
            request.patient_data,
            pool,
            top_k=request.top_k,
            metric=request.metric,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Model not trained yet.")

    return {"similar_patients": results, "total_pool": len(pool)}
