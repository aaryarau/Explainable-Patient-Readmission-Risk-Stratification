"""
Counterfactual explanation generator.
Finds the minimal, plausible feature changes that flip a prediction
from high-risk to low-risk using a greedy best-first perturbation search.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from .preprocessing import load_artifact


# Features that should NOT be modified (historical / immutable)
IMMUTABLE_FEATURES = {
    "race", "gender", "age", "admission_type_id", "admission_source_id",
    "encounter_id", "patient_nbr", "sex",
}


def _predict_prob(model, scaler, feature_names: List[str], row: np.ndarray) -> float:
    # Wrap in DataFrame so scaler recognises feature names (suppresses sklearn warning)
    X = pd.DataFrame([row], columns=feature_names)
    scaled = scaler.transform(X)
    return float(model.predict_proba(scaled)[0][1])


def generate_counterfactual(
    dataset: str,
    patient_data: Dict[str, Any],
    target_probability: float = 0.25,
    max_features_to_change: int = 5,
    n_attempts: int = 200,
    step_sizes: Optional[List[float]] = None,
) -> Dict[str, Any]:
    """
    Search for the nearest counterfactual using a greedy best-first strategy.

    Each iteration perturbs one mutable feature by a small step in the direction
    that most reduces the predicted probability.  The search is deterministic
    except for tie-breaking, making results reproducible.

    Returns the best candidate found, regardless of whether the target was reached.
    All results are labelled as model-based scenario analysis.
    """
    model = load_artifact(f"{dataset}_model.pkl")
    scaler = load_artifact(f"{dataset}_scaler.pkl")
    feature_names: List[str] = load_artifact(f"{dataset}_features.pkl")

    if step_sizes is None:
        step_sizes = [0.05, 0.1, 0.2, 0.5, 1.0]

    # Build original vector
    original = np.array([float(patient_data.get(f, 0)) for f in feature_names])
    original_prob = _predict_prob(model, scaler, feature_names, original)

    if original_prob <= target_probability:
        return {
            "counterfactual": {f: float(v) for f, v in zip(feature_names, original)},
            "changes": [],
            "original_probability": original_prob,
            "counterfactual_probability": original_prob,
            "target_achieved": True,
            "message": "Patient is already below the target risk threshold.",
        }

    # Determine mutable feature indices
    mutable_idx = [
        i for i, f in enumerate(feature_names)
        if f not in IMMUTABLE_FEATURES
    ][:max_features_to_change * 3]   # restrict search space

    current = original.copy()
    current_prob = original_prob
    changed_features: set = set()
    best_cf = original.copy()
    best_prob = original_prob

    for _ in range(n_attempts):
        if current_prob <= target_probability:
            break

        best_delta_prob = 0.0
        best_move = None

        # Try each mutable feature in each direction/step
        for idx in mutable_idx:
            if len(changed_features) >= max_features_to_change and idx not in changed_features:
                continue
            for step in step_sizes:
                for direction in (-1.0, 1.0):
                    candidate = current.copy()
                    candidate[idx] += direction * step * max(abs(original[idx]), 1.0)
                    # Clip to non-negative for count-type features
                    candidate[idx] = max(candidate[idx], 0.0)
                    p = _predict_prob(model, scaler, feature_names, candidate)
                    delta = current_prob - p   # positive = improvement
                    if delta > best_delta_prob:
                        best_delta_prob = delta
                        best_move = (idx, candidate.copy(), p)

        if best_move is None:
            break

        idx, current, current_prob = best_move
        changed_features.add(idx)

        if current_prob < best_prob:
            best_prob = current_prob
            best_cf = current.copy()

    # Build change list
    changes = [
        {
            "feature": feature_names[i],
            "original_value": float(original[i]),
            "counterfactual_value": float(best_cf[i]),
            "delta": float(best_cf[i] - original[i]),
        }
        for i in range(len(feature_names))
        if abs(best_cf[i] - original[i]) > 1e-6
        and feature_names[i] not in IMMUTABLE_FEATURES
    ]

    # Sort by absolute delta descending
    changes.sort(key=lambda x: abs(x["delta"]), reverse=True)

    return {
        "counterfactual": {f: float(v) for f, v in zip(feature_names, best_cf)},
        "changes": changes,
        "original_probability": float(original_prob),
        "counterfactual_probability": float(best_prob),
        "target_achieved": best_prob <= target_probability,
        "message": None,
    }
