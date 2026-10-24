"""
Similar-patient retrieval using cosine similarity on scaled feature vectors.
"""
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances
from typing import Dict, Any, List

from .preprocessing import load_artifact


def find_similar_patients(
    dataset: str,
    patient_data: Dict[str, Any],
    all_patients: List[Dict[str, Any]],
    top_k: int = 5,
    metric: str = "cosine",
) -> List[Dict[str, Any]]:
    """
    Find the top-k most similar patients to the query patient.

    Parameters
    ----------
    dataset     : "diabetes" | "heart"
    patient_data: query patient feature dict
    all_patients: list of historical patient dicts (each has feature values + outcome)
    top_k       : number of neighbours to return
    metric      : "cosine" | "euclidean"
    """
    scaler = load_artifact(f"{dataset}_scaler.pkl")
    features = load_artifact(f"{dataset}_features.pkl")

    # Use DataFrames to suppress sklearn feature-name warnings
    query_df = pd.DataFrame([[patient_data.get(f, 0) for f in features]], columns=features)
    query_scaled = scaler.transform(query_df)

    db_rows_df = pd.DataFrame(
        [[p.get(f, 0) for f in features] for p in all_patients],
        columns=features,
    )
    db_matrix = scaler.transform(db_rows_df)

    if metric == "cosine":
        scores = cosine_similarity(query_scaled, db_matrix)[0]
        sorted_idx = np.argsort(scores)[::-1][:top_k]
        similarity_scores = scores[sorted_idx].tolist()
    else:
        dists = euclidean_distances(query_scaled, db_matrix)[0]
        sorted_idx = np.argsort(dists)[:top_k]
        # Convert distance to similarity score [0, 1]
        similarity_scores = (1 / (1 + dists[sorted_idx])).tolist()

    results = []
    for rank, (idx, sim) in enumerate(zip(sorted_idx, similarity_scores)):
        patient = all_patients[int(idx)].copy()
        patient["similarity_score"] = float(sim)
        patient["rank"] = rank + 1
        results.append(patient)

    return results
