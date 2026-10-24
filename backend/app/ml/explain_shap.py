"""
SHAP-based explainability for individual predictions and global feature importance.
"""
import shap
import numpy as np
import pandas as pd
from typing import Dict, Any, List

from .preprocessing import load_artifact


def explain_prediction(dataset: str, patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute SHAP values for a single patient prediction.
    Returns per-feature SHAP contributions and a summary.
    """
    model = load_artifact(f"{dataset}_model.pkl")
    scaler = load_artifact(f"{dataset}_scaler.pkl")
    features = load_artifact(f"{dataset}_features.pkl")

    row = {f: patient_data.get(f, 0) for f in features}
    X = pd.DataFrame([row])[features]
    X_scaled = scaler.transform(X)
    # Use the first named estimator (XGBoost) for SHAP — fastest & most accurate
    base_model = model.estimators_[0] if hasattr(model, "estimators_") else model

    explainer = shap.TreeExplainer(base_model)
    shap_values = explainer.shap_values(X_scaled)

    # For binary classifiers shap_values may be shape (1, n_features)
    if isinstance(shap_values, list):
        sv = shap_values[1][0]   # class-1 shap values for the single sample
    else:
        sv = shap_values[0]

    shap_dict = {feat: float(val) for feat, val in zip(features, sv)}

    # Top contributing features (by absolute magnitude)
    sorted_features = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
    top_features = [
        {"feature": f, "shap_value": v, "direction": "increases" if v > 0 else "decreases"}
        for f, v in sorted_features[:10]
    ]

    return {
        "shap_values": shap_dict,
        "top_features": top_features,
        "base_value": float(explainer.expected_value[1] if isinstance(explainer.expected_value, list) else explainer.expected_value),
    }


def global_feature_importance(dataset: str, n_top: int = 20) -> List[Dict[str, Any]]:
    """Return global feature importances from the base XGBoost estimator."""
    model = load_artifact(f"{dataset}_model.pkl")
    features = load_artifact(f"{dataset}_features.pkl")

    base_model = model.estimators_[0] if hasattr(model, "estimators_") else model
    importances = base_model.feature_importances_

    ranked = sorted(
        zip(features, importances), key=lambda x: x[1], reverse=True
    )[:n_top]

    return [{"feature": f, "importance": float(imp)} for f, imp in ranked]
