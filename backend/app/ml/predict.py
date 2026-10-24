"""
Inference utilities — load trained artifacts and produce risk predictions.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

from .preprocessing import load_artifact


def _load_pipeline(dataset: str):
    model = load_artifact(f"{dataset}_model.pkl")
    scaler = load_artifact(f"{dataset}_scaler.pkl")
    features = load_artifact(f"{dataset}_features.pkl")
    return model, scaler, features


def predict_risk(dataset: str, patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run inference for a single patient.

    Returns:
        prediction  – 0 (low) or 1 (high)
        probability – float probability of readmission
        risk_level  – "low" | "medium" | "high"
    """
    model, scaler, features = _load_pipeline(dataset)

    # Build a single-row DataFrame aligned to training features
    row = {f: patient_data.get(f, 0) for f in features}
    X = pd.DataFrame([row])[features]

    X_scaled = scaler.transform(X)
    prediction = int(model.predict(X_scaled)[0])
    probability = float(model.predict_proba(X_scaled)[0][1])

    if probability < 0.30:
        risk_level = "low"
    elif probability < 0.60:
        risk_level = "medium"
    else:
        risk_level = "high"

    return {
        "prediction": prediction,
        "probability": probability,
        "risk_level": risk_level,
        "features_used": features,
    }


def batch_predict(dataset: str, records: list) -> list:
    """Run inference on a list of patient dicts."""
    model, scaler, features = _load_pipeline(dataset)

    rows = [{f: r.get(f, 0) for f in features} for r in records]
    X = pd.DataFrame(rows)[features]
    X_scaled = scaler.transform(X)

    predictions = model.predict(X_scaled).tolist()
    probabilities = model.predict_proba(X_scaled)[:, 1].tolist()

    results = []
    for pred, prob in zip(predictions, probabilities):
        risk_level = "low" if prob < 0.30 else ("medium" if prob < 0.60 else "high")
        results.append({"prediction": int(pred), "probability": float(prob), "risk_level": risk_level})
    return results
