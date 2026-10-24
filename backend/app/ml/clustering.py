"""
KMeans clustering for patient risk stratification and cohort discovery.
"""
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from typing import Dict, Any, List, Optional

from .preprocessing import load_artifact, save_artifact


def train_clusters(dataset: str, X_scaled: np.ndarray, n_clusters: int = 5) -> KMeans:
    """Fit a KMeans model and persist it."""
    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    km.fit(X_scaled)
    save_artifact(km, f"{dataset}_kmeans.pkl")
    return km


def assign_cluster(dataset: str, patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """Assign a new patient to an existing cluster and return cluster metadata."""
    scaler = load_artifact(f"{dataset}_scaler.pkl")
    features = load_artifact(f"{dataset}_features.pkl")
    km = load_artifact(f"{dataset}_kmeans.pkl")

    # Use DataFrame so scaler recognises feature names (suppresses sklearn warning)
    row_df = pd.DataFrame([[patient_data.get(f, 0) for f in features]], columns=features)
    row_scaled = scaler.transform(row_df)

    cluster_id = int(km.predict(row_scaled)[0])
    distances = km.transform(row_scaled)[0]
    nearest_distance = float(distances[cluster_id])

    return {
        "cluster_id": cluster_id,
        "distance_to_centroid": nearest_distance,
        "all_distances": distances.tolist(),
    }


def get_cluster_summary(dataset: str) -> List[Dict[str, Any]]:
    """Return per-cluster statistics (size and centroid feature values)."""
    km = load_artifact(f"{dataset}_kmeans.pkl")
    features = load_artifact(f"{dataset}_features.pkl")
    scaler = load_artifact(f"{dataset}_scaler.pkl")

    # Inverse-transform centroids for interpretable values
    centroids_original = scaler.inverse_transform(km.cluster_centers_)

    summary = []
    for i, centroid in enumerate(centroids_original):
        summary.append({
            "cluster_id": i,
            "size": int(np.sum(km.labels_ == i)),
            "centroid": {feat: float(val) for feat, val in zip(features, centroid)},
        })
    return summary


def pca_projection(dataset: str, X_scaled: np.ndarray) -> List[Dict[str, Any]]:
    """Project scaled data into 2D using PCA for scatter plot visualization."""
    km = load_artifact(f"{dataset}_kmeans.pkl")
    labels = km.predict(X_scaled)

    pca = PCA(n_components=2)
    coords = pca.fit_transform(X_scaled)

    return [
        {"x": float(c[0]), "y": float(c[1]), "cluster": int(l)}
        for c, l in zip(coords, labels)
    ]
