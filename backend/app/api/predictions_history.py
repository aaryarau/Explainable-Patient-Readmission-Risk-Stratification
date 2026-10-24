from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from bson import ObjectId
import re

from ..auth.utils import get_current_user
from ..database.connection import get_database

router = APIRouter(prefix="/api/predictions-history", tags=["predictions_history"])


@router.get("/")
async def list_predictions(
    dataset: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = Query(None, description="Search by patient name or PAT-ID or PRD-ID"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
):
    db = get_database()
    query: dict = {"user_id": current_user.user_id}

    if dataset:
        query["dataset"] = dataset
    if risk_level:
        query["risk_level"] = risk_level
    if search:
        pattern = re.compile(re.escape(search.strip()), re.IGNORECASE)
        query["$or"] = [
            {"patient_name": {"$regex": pattern}},
            {"patient_record_id": {"$regex": pattern}},
            {"prediction_id": {"$regex": pattern}},
        ]

    cursor = (
        db["predictions"]
        .find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    total = await db["predictions"].count_documents(query)

    records = []
    for d in docs:
        records.append({
            "id": str(d["_id"]),
            "prediction_id": d.get("prediction_id", "—"),
            "patient_record_id": d.get("patient_record_id", "—"),
            "patient_name": d.get("patient_name", "—"),
            "dataset": d.get("dataset"),
            "prediction": d.get("prediction"),
            "probability": d.get("probability"),
            "risk_level": d.get("risk_level"),
            "cluster_id": d.get("cluster_id"),
            "created_at": d.get("created_at").isoformat() if d.get("created_at") else None,
        })

    return {"predictions": records, "total": total, "limit": limit, "skip": skip}


@router.get("/{prediction_id}")
async def get_prediction(prediction_id: str, current_user=Depends(get_current_user)):
    db = get_database()

    # Try MongoDB ObjectId first, then PRD-XXXX human ID
    doc = None
    if ObjectId.is_valid(prediction_id):
        doc = await db["predictions"].find_one({
            "_id": ObjectId(prediction_id),
            "user_id": current_user.user_id,
        })
    if not doc:
        doc = await db["predictions"].find_one({
            "prediction_id": prediction_id.upper(),
            "user_id": current_user.user_id,
        })
    if not doc:
        raise HTTPException(status_code=404, detail="Prediction not found")

    return {
        "id": str(doc["_id"]),
        "prediction_id": doc.get("prediction_id", "—"),
        "patient_record_id": doc.get("patient_record_id", "—"),
        "patient_name": doc.get("patient_name", "—"),
        "dataset": doc.get("dataset"),
        "patient_data": doc.get("patient_data"),
        "prediction": doc.get("prediction"),
        "probability": doc.get("probability"),
        "risk_level": doc.get("risk_level"),
        "cluster_id": doc.get("cluster_id"),
        "top_features": doc.get("top_features", []),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
    }


@router.delete("/{prediction_id}")
async def delete_prediction(prediction_id: str, current_user=Depends(get_current_user)):
    db = get_database()

    result = None
    if ObjectId.is_valid(prediction_id):
        result = await db["predictions"].delete_one({
            "_id": ObjectId(prediction_id),
            "user_id": current_user.user_id,
        })
    if not result or result.deleted_count == 0:
        result = await db["predictions"].delete_one({
            "prediction_id": prediction_id.upper(),
            "user_id": current_user.user_id,
        })
    if not result or result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prediction not found")

    return {"message": "Prediction deleted"}
