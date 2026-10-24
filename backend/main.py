"""
ReAdmissionIQ — FastAPI backend entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import connect_to_mongo, close_mongo_connection
from app.auth.router import router as auth_router
from app.api.predict import router as predict_router
from app.api.explain import router as explain_router
from app.api.counterfactual import router as counterfactual_router
from app.api.similar_patients import router as similar_patients_router
from app.api.risk_profiles import router as risk_profiles_router
from app.api.analytics import router as analytics_router
from app.api.model_results import router as model_results_router
from app.api.reliability import router as reliability_router
from app.api.cross_dataset import router as cross_dataset_router
from app.api.predictions_history import router as predictions_history_router
from app.api.what_if import router as what_if_router
from app.api.patients import router as patients_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="ReAdmissionIQ API",
    description="Explainable Patient Readmission Risk Stratification using Hybrid ML",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(predict_router)
app.include_router(explain_router)
app.include_router(counterfactual_router)
app.include_router(similar_patients_router)
app.include_router(risk_profiles_router)
app.include_router(analytics_router)
app.include_router(model_results_router)
app.include_router(reliability_router)
app.include_router(cross_dataset_router)
app.include_router(predictions_history_router)
app.include_router(what_if_router)
app.include_router(patients_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ReAdmissionIQ API", "version": "1.0.0"}
