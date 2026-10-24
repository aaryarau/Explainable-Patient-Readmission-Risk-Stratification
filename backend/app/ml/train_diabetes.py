"""
Training pipeline for the Diabetes 130-US Hospitals readmission model.
Hybrid approach: XGBoost + KMeans clustering for risk stratification.
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    roc_auc_score, accuracy_score, f1_score,
    precision_score, recall_score, classification_report,
)
import joblib
import os
import json
from datetime import datetime, timezone

from .preprocessing import preprocess_diabetes, scale_features, apply_smote, save_artifact
from ..config import settings


def train_diabetes_model(data_path: str = None) -> dict:
    """
    Full training pipeline for the diabetes readmission model.
    Returns a dict of evaluation metrics.
    """
    path = data_path or settings.diabetes_data_path
    print(f"Loading diabetes data from {path} ...")
    df = pd.read_csv(path, low_memory=False)

    print("Preprocessing ...")
    X, y = preprocess_diabetes(df)
    feature_names = X.columns.tolist()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Scale
    X_train_sc, X_test_sc, scaler = scale_features(X_train, X_test)

    # SMOTE on training set only
    X_train_res, y_train_res = apply_smote(X_train_sc, y_train)

    # ── Model Definition ──────────────────────────────────────────────────────
    xgb = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=8,        # handle class imbalance explicitly
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
    )
    rf = RandomForestClassifier(
        n_estimators=200, max_depth=10,
        class_weight="balanced",   # also balance RF
        random_state=42, n_jobs=-1
    )

    ensemble = VotingClassifier(
        estimators=[("xgb", xgb), ("rf", rf)], voting="soft", weights=[2, 1]
    )

    print("Training ensemble model ...")
    ensemble.fit(X_train_res, y_train_res)

    # ── Evaluation ────────────────────────────────────────────────────────────
    y_pred = ensemble.predict(X_test_sc)
    y_proba = ensemble.predict_proba(X_test_sc)[:, 1]

    from sklearn.metrics import confusion_matrix as cm_fn
    from sklearn.metrics import average_precision_score
    cm = cm_fn(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    metrics = {
        "dataset": "diabetes",
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_proba)),
        "pr_auc": float(average_precision_score(y_test, y_proba)),
        "f1_score": float(f1_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred)),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "feature_names": feature_names,
        "training_samples": int(len(X_train_res)),
        "test_samples": int(len(X_test)),
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }

    print(f"ROC-AUC: {metrics['roc_auc']:.4f}  |  F1: {metrics['f1_score']:.4f}")
    print(classification_report(y_test, y_pred))

    # ── Persist Artifacts ─────────────────────────────────────────────────────
    save_artifact(ensemble, "diabetes_model.pkl")
    save_artifact(scaler, "diabetes_scaler.pkl")
    save_artifact(feature_names, "diabetes_features.pkl")

    metrics_path = os.path.join(settings.models_dir, "diabetes_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print("Artifacts saved.")
    return metrics


if __name__ == "__main__":
    train_diabetes_model()
