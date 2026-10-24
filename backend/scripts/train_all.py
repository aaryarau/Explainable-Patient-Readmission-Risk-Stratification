#!/usr/bin/env python3
"""
Master training script.
Trains both the Diabetes readmission model and Heart Failure model,
then fits K-Means clustering on each dataset.

Usage (from backend/ directory):
    python scripts/train_all.py
"""
import os
import sys
import json
import numpy as np
import pandas as pd

# Ensure the backend package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.train_diabetes import train_diabetes_model
from app.ml.train_heart import train_heart_model
from app.ml.preprocessing import preprocess_diabetes, preprocess_heart, scale_features, load_artifact
from app.ml.clustering import train_clusters
from app.config import settings


def train_clustering(dataset: str, preprocess_fn, data_path: str):
    """Fit KMeans on the full preprocessed dataset."""
    print(f"\nTraining KMeans clustering for {dataset} ...")
    df = pd.read_csv(data_path, low_memory=False)
    X, _ = preprocess_fn(df)

    # Load the scaler fitted during model training
    scaler = load_artifact(f"{dataset}_scaler.pkl")
    X_scaled = scaler.transform(X)

    km = train_clusters(dataset, X_scaled, n_clusters=5)
    print(f"  KMeans fitted — {km.n_clusters} clusters, inertia={km.inertia_:.2f}")


def main():
    print("=" * 60)
    print("ReAdmissionIQ — Training Pipeline")
    print("=" * 60)

    os.makedirs(settings.models_dir, exist_ok=True)

    # ── Diabetes model ────────────────────────────────────────────────────────
    diabetes_path = settings.diabetes_data_path
    if not os.path.exists(diabetes_path):
        print(f"\nERROR: Diabetes dataset not found at '{diabetes_path}'")
        print("Run: python scripts/download_data.py first")
        sys.exit(1)

    print(f"\n[1/4] Training Diabetes readmission model ...")
    d_metrics = train_diabetes_model(diabetes_path)
    print(f"  ROC-AUC: {d_metrics['roc_auc']:.4f}  F1: {d_metrics['f1_score']:.4f}")

    # ── Heart Failure model ───────────────────────────────────────────────────
    heart_path = settings.heart_data_path
    if not os.path.exists(heart_path):
        print(f"\nERROR: Heart Failure dataset not found at '{heart_path}'")
        print("Run: python scripts/download_data.py first")
        sys.exit(1)

    print(f"\n[2/4] Training Heart Failure model ...")
    h_metrics = train_heart_model(heart_path)
    print(f"  ROC-AUC: {h_metrics['roc_auc']:.4f}  F1: {h_metrics['f1_score']:.4f}")

    # ── Clustering ────────────────────────────────────────────────────────────
    print(f"\n[3/4] Fitting clustering — Diabetes ...")
    train_clustering("diabetes", preprocess_diabetes, diabetes_path)

    print(f"\n[4/4] Fitting clustering — Heart Failure ...")
    train_clustering("heart", preprocess_heart, heart_path)

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("Training complete. Artifacts saved to:", settings.models_dir)
    print("\nDiabetes model:")
    for k, v in d_metrics.items():
        if isinstance(v, float):
            print(f"  {k}: {v:.4f}")
    print("\nHeart Failure model:")
    for k, v in h_metrics.items():
        if isinstance(v, float):
            print(f"  {k}: {v:.4f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
