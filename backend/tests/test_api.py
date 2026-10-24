"""
Integration tests for key API endpoints.

Tests that need MongoDB are marked with @pytest.mark.db and are skipped
automatically when no live MongoDB is available (CI / offline environments).
The health check, auth-guard, and input-validation tests run without any DB.

Run all tests:          pytest tests/test_api.py -v
Run DB tests only:      pytest tests/test_api.py -v -m db
Skip DB tests:          pytest tests/test_api.py -v -m "not db"
"""
import pytest
import sys
import os
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import AsyncClient, ASGITransport
from main import app


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def anyio_backend():
    return "asyncio"


def _make_mock_collection():
    """Return an AsyncMock that behaves like a Motor collection."""
    col = AsyncMock()
    col.find_one = AsyncMock(return_value=None)
    col.insert_one = AsyncMock(return_value=MagicMock(inserted_id="507f1f77bcf86cd799439011"))
    col.count_documents = AsyncMock(return_value=0)
    col.update_one = AsyncMock(return_value=MagicMock(modified_count=1))
    col.delete_one = AsyncMock(return_value=MagicMock(deleted_count=1))
    return col


@pytest.fixture
def mock_db():
    """Patch get_database() to return a fake DB dict so DB-dependent tests run offline."""
    fake_users = _make_mock_collection()
    fake_preds = _make_mock_collection()

    mock_database = MagicMock()
    mock_database.__getitem__ = MagicMock(side_effect=lambda key: {
        "users": fake_users,
        "predictions": fake_preds,
    }.get(key, _make_mock_collection()))

    with patch("app.database.connection.get_database", return_value=mock_database):
        with patch("app.auth.router.get_database", return_value=mock_database):
            with patch("app.api.predict.get_database", return_value=mock_database):
                yield mock_database, fake_users, fake_preds


# ── Tests that need NO database ───────────────────────────────────────────────

@pytest.mark.anyio
async def test_health():
    """Health endpoint should always return 200."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "ReAdmissionIQ" in data["service"]


@pytest.mark.anyio
async def test_predict_requires_auth():
    """Predict endpoint must reject unauthenticated requests."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/predict/", json={
            "dataset": "diabetes",
            "patient_data": {"age": 5},
        })
    assert response.status_code == 401


@pytest.mark.anyio
async def test_explain_requires_auth():
    """Explain endpoint must reject unauthenticated requests."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/explain/prediction", json={
            "dataset": "diabetes",
            "patient_data": {},
        })
    assert response.status_code == 401


@pytest.mark.anyio
async def test_counterfactual_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/counterfactual/generate", json={
            "dataset": "diabetes",
            "patient_data": {},
        })
    assert response.status_code == 401


@pytest.mark.anyio
async def test_similar_patients_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/similar-patients/", json={
            "dataset": "diabetes",
            "patient_data": {},
        })
    assert response.status_code == 401


@pytest.mark.anyio
async def test_risk_profiles_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/risk-profiles/diabetes")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_model_results_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/model-results/diabetes")
    assert response.status_code == 401


# ── Tests with mocked DB ──────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_register_route_exists():
    """Register route must be reachable (not 404/405). DB errors are acceptable."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Send a deliberately invalid payload to get a 422 validation error
        # (which proves the route exists and runs before any DB/bcrypt call)
        response = await client.post("/api/auth/register", json={
            "email": "not-an-email",  # triggers Pydantic validation error
            "username": "u",          # too short — min_length=3 … actually 1 char
            "password": "short",      # too short — min_length=8
        })
    # 422 = Pydantic validation caught it before DB/bcrypt — route exists
    assert response.status_code in (400, 422)
    assert response.status_code != 404
    assert response.status_code != 405


@pytest.mark.anyio
async def test_invalid_dataset_rejected_with_auth(mock_db):
    """Predict endpoint should reject unknown dataset names (400 or 422 both valid)."""
    from app.auth.utils import create_access_token
    token = create_access_token({"sub": "507f1f77bcf86cd799439011", "email": "t@t.com"})

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Include patient_name so only the dataset field triggers rejection
        response = await client.post(
            "/api/predict/",
            json={"dataset": "unknown_dataset", "patient_name": "Test Patient", "patient_data": {}},
            headers={"Authorization": f"Bearer {token}"},
        )
    # 400 = explicit dataset validation, 422 = Pydantic schema rejection — both correct
    assert response.status_code in (400, 422)
    assert response.status_code != 200


@pytest.mark.anyio
async def test_heart_invalid_dataset_rejected_with_auth(mock_db):
    """Also confirm 'badname' is rejected for heart dataset path."""
    from app.auth.utils import create_access_token
    token = create_access_token({"sub": "507f1f77bcf86cd799439011", "email": "t@t.com"})

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/explain/prediction",
            json={"dataset": "badname", "patient_data": {}},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 400


# ── Preprocessing integration ─────────────────────────────────────────────────

def test_preprocessing_imports_cleanly():
    """Smoke test: all ML modules import without error."""
    from app.ml.preprocessing import preprocess_diabetes, preprocess_heart, scale_features
    from app.ml.predict import predict_risk
    from app.ml.explain_shap import explain_prediction, global_feature_importance
    from app.ml.clustering import assign_cluster, get_cluster_summary
    from app.ml.counterfactual import generate_counterfactual
    from app.ml.similarity import find_similar_patients
    assert True  # reaching here means all imports succeeded


def test_evaluate_module():
    """compute_metrics should work with synthetic binary data."""
    import numpy as np
    from app.ml.evaluate import compute_metrics

    rng = np.random.default_rng(0)
    y_true = rng.integers(0, 2, 100)
    y_pred = rng.integers(0, 2, 100)
    y_proba = rng.uniform(0, 1, 100)

    metrics = compute_metrics(y_true, y_pred, y_proba)
    assert "accuracy" in metrics
    assert "roc_auc" in metrics
    assert "confusion_matrix" in metrics
    assert 0.0 <= metrics["accuracy"] <= 1.0
    assert 0.0 <= metrics["roc_auc"] <= 1.0
