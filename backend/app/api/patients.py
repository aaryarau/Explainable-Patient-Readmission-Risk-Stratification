"""
Patient record management.
Handles PAT-XXXX patient record IDs separate from prediction IDs.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone

from ..auth.utils import get_current_user
from ..database.connection import get_database

router = APIRouter(prefix="/api/patients", tags=["patients"])


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _next_patient_id(db) -> str:
    """Generate sequential PAT-XXXX ID using an atomic counter."""
    result = await db["counters"].find_one_and_update(
        {"_id": "patient_seq"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    seq = result["seq"]
    return f"PAT-{seq:04d}"


async def _next_prediction_id(db) -> str:
    """Generate sequential PRD-XXXX ID using an atomic counter."""
    result = await db["counters"].find_one_and_update(
        {"_id": "prediction_seq"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    seq = result["seq"]
    return f"PRD-{seq:04d}"


# ── Schemas ────────────────────────────────────────────────────────────────────

class PatientCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=120)

    @field_validator("full_name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 2:
            raise ValueError("Patient name must be at least 2 non-whitespace characters")
        return stripped


class PatientResponse(BaseModel):
    patient_record_id: str          # PAT-0001
    full_name: str
    created_at: str
    total_predictions: int


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def create_patient(data: PatientCreate, current_user=Depends(get_current_user)):
    """Create a new patient record and assign a PAT-XXXX ID."""
    db = get_database()
    pat_id = await _next_patient_id(db)
    doc = {
        "patient_record_id": pat_id,
        "full_name": data.full_name.strip(),
        "user_id": current_user.user_id,
        "created_at": datetime.now(timezone.utc),
    }
    await db["patients"].insert_one(doc)
    return {
        "patient_record_id": pat_id,
        "full_name": doc["full_name"],
        "created_at": doc["created_at"].isoformat(),
    }


@router.get("/")
async def list_patients(
    search: Optional[str] = Query(None, description="Search by name or PAT-ID"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
):
    """List all patient records for the current user, with optional search."""
    db = get_database()
    query: dict = {"user_id": current_user.user_id}

    if search:
        import re
        pattern = re.compile(re.escape(search.strip()), re.IGNORECASE)
        query["$or"] = [
            {"full_name": {"$regex": pattern}},
            {"patient_record_id": {"$regex": pattern}},
        ]

    cursor = db["patients"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    total = await db["patients"].count_documents(query)

    results = []
    for d in docs:
        pred_count = await db["predictions"].count_documents(
            {"patient_record_id": d["patient_record_id"], "user_id": current_user.user_id}
        )
        results.append({
            "patient_record_id": d["patient_record_id"],
            "full_name": d["full_name"],
            "created_at": d["created_at"].isoformat() if d.get("created_at") else None,
            "total_predictions": pred_count,
        })

    return {"patients": results, "total": total}


@router.get("/{patient_record_id}")
async def get_patient(patient_record_id: str, current_user=Depends(get_current_user)):
    db = get_database()
    doc = await db["patients"].find_one({
        "patient_record_id": patient_record_id.upper(),
        "user_id": current_user.user_id,
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Patient record not found")

    predictions = await db["predictions"].find(
        {"patient_record_id": patient_record_id.upper(), "user_id": current_user.user_id}
    ).sort("created_at", -1).to_list(length=100)

    return {
        "patient_record_id": doc["patient_record_id"],
        "full_name": doc["full_name"],
        "created_at": doc["created_at"].isoformat() if doc.get("created_at") else None,
        "predictions": [
            {
                "prediction_id": p.get("prediction_id", str(p["_id"])),
                "mongo_id": str(p["_id"]),
                "dataset": p.get("dataset"),
                "probability": p.get("probability"),
                "risk_level": p.get("risk_level"),
                "prediction": p.get("prediction"),
                "created_at": p["created_at"].isoformat() if p.get("created_at") else None,
            }
            for p in predictions
        ],
    }
