from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from ..auth.utils import get_current_user
from ..ml.predict import predict_risk
from ..ml.clustering import assign_cluster
from ..ml.explain_shap import explain_prediction
from ..database.connection import get_database

router = APIRouter(prefix="/api/predict", tags=["predict"])


# ── Counter helper (shared with patients.py) ──────────────────────────────────

async def _next_prediction_id(db) -> str:
    result = await db["counters"].find_one_and_update(
        {"_id": "prediction_seq"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return f"PRD-{result['seq']:04d}"


async def _get_or_create_patient(db, user_id: str, patient_name: str) -> dict:
    """Look up existing patient by name+user, or create a new PAT-XXXX record."""
    # Try exact name match for this user first
    existing = await db["patients"].find_one({
        "user_id": user_id,
        "full_name": {"$regex": f"^{patient_name.strip()}$", "$options": "i"},
    })
    if existing:
        return existing

    # Create new patient record
    seq_result = await db["counters"].find_one_and_update(
        {"_id": "patient_seq"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    pat_id = f"PAT-{seq_result['seq']:04d}"
    doc = {
        "patient_record_id": pat_id,
        "full_name": patient_name.strip(),
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc),
    }
    await db["patients"].insert_one(doc)
    return doc


# ── Schemas ────────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    dataset: str
    patient_data: Dict[str, Any]
    patient_name: str = Field(..., min_length=1, max_length=120,
                              description="Patient full name — for identification only, never used in prediction")
    save_result: bool = True

    @field_validator("patient_name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 2:
            raise ValueError("Patient name must be at least 2 non-whitespace characters")
        return stripped


class PredictResponse(BaseModel):
    prediction: int
    probability: float
    risk_level: str
    cluster_id: Optional[int] = None
    prediction_id: Optional[str] = None        # PRD-0001
    patient_record_id: Optional[str] = None    # PAT-0001
    patient_name: Optional[str] = None
    mongo_id: Optional[str] = None             # raw MongoDB _id


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.post("/", response_model=PredictResponse)
async def predict(request: PredictRequest, current_user=Depends(get_current_user)):
    if request.dataset not in ("diabetes", "heart"):
        raise HTTPException(status_code=400, detail="dataset must be 'diabetes' or 'heart'")

    # ── ML inference (patient_name is deliberately excluded) ──────────────────
    try:
        result = predict_risk(request.dataset, request.patient_data)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail=f"Model for '{request.dataset}' not trained yet. Run training scripts first.",
        )

    # ── Cluster assignment ────────────────────────────────────────────────────
    cluster_info = None
    try:
        cluster_info = assign_cluster(request.dataset, request.patient_data)
    except FileNotFoundError:
        pass

    # ── SHAP top features (stored for history view) ───────────────────────────
    top_features_summary = None
    try:
        explanation = explain_prediction(request.dataset, request.patient_data)
        top_features_summary = explanation.get("top_features", [])[:5]
    except Exception:
        pass

    prediction_id = None
    patient_record_id = None
    mongo_id = None

    if request.save_result:
        db = get_database()

        # Get or create the patient record (PAT-XXXX)
        patient_doc = await _get_or_create_patient(
            db, current_user.user_id, request.patient_name
        )
        patient_record_id = patient_doc["patient_record_id"]

        # Generate human-readable prediction ID (PRD-XXXX)
        prediction_id = await _next_prediction_id(db)

        doc = {
            "prediction_id": prediction_id,
            "patient_record_id": patient_record_id,
            "patient_name": request.patient_name.strip(),
            "user_id": current_user.user_id,
            "dataset": request.dataset,
            "patient_data": request.patient_data,   # clinical features only
            "prediction": result["prediction"],
            "probability": result["probability"],
            "risk_level": result["risk_level"],
            "cluster_id": cluster_info["cluster_id"] if cluster_info else None,
            "top_features": top_features_summary,
            "created_at": datetime.now(timezone.utc),
        }
        inserted = await db["predictions"].insert_one(doc)
        mongo_id = str(inserted.inserted_id)

    return PredictResponse(
        prediction=result["prediction"],
        probability=result["probability"],
        risk_level=result["risk_level"],
        cluster_id=cluster_info["cluster_id"] if cluster_info else None,
        prediction_id=prediction_id,
        patient_record_id=patient_record_id,
        patient_name=request.patient_name.strip() if request.save_result else None,
        mongo_id=mongo_id,
    )
