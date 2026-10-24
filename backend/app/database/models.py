from pydantic import BaseModel, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId


# ── Pydantic v2-compatible ObjectId type ───────────────────────────────────────

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema_obj, handler: GetJsonSchemaHandler) -> JsonSchemaValue:
        return {"type": "string"}


# ── User Documents ──────────────────────────────────────────────────────────────

class UserDocument(BaseModel):
    """MongoDB document schema for a registered user."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: str
    username: str
    hashed_password: str
    full_name: Optional[str] = None
    role: str = "analyst"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

    def dict(self, **kwargs):
        kwargs.setdefault("by_alias", True)
        data = super().model_dump(**kwargs)
        if data.get("_id") is None:
            data.pop("_id", None)
        return data


# ── Prediction Documents ────────────────────────────────────────────────────────

class PredictionDocument(BaseModel):
    """MongoDB document schema for a stored prediction result."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    dataset: str
    patient_data: Dict[str, Any]
    prediction: int
    probability: float
    risk_level: str
    shap_values: Optional[Dict[str, float]] = None
    top_features: Optional[List[Dict[str, Any]]] = None
    cluster_id: Optional[int] = None
    model_version: str = "1.0.0"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


# ── Model Metadata Documents ────────────────────────────────────────────────────

class ModelMetadataDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    dataset: str
    model_type: str
    version: str
    accuracy: float
    roc_auc: float
    f1_score: float
    precision: float
    recall: float
    feature_names: List[str]
    hyperparameters: Dict[str, Any]
    training_samples: int
    test_samples: int
    trained_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    trained_by: Optional[str] = None
    notes: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


# ── Audit Log Documents ─────────────────────────────────────────────────────────

class AuditLogDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    action: str
    resource: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str = "success"
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }
