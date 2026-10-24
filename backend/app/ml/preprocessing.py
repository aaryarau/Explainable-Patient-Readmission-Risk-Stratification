"""
Shared preprocessing utilities for both the Diabetes 130 and Heart Failure datasets.
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from imblearn.over_sampling import SMOTE
import joblib
import os
from typing import Tuple, Dict, Any

from ..config import settings


# ── Diabetes 130-US Hospitals ───────────────────────────────────────────────────

DIABETES_DROP_COLS = [
    "encounter_id", "patient_nbr", "weight", "payer_code",
    "medical_specialty", "examide", "citoglipton",
]

DIABETES_CATEGORICAL = [
    "race", "gender", "age", "admission_type_id", "discharge_disposition_id",
    "admission_source_id", "diag_1", "diag_2", "diag_3",
    "max_glu_serum", "A1Cresult", "change", "diabetesMed",
]

DIABETES_DRUG_COLS = [
    "metformin", "repaglinide", "nateglinide", "chlorpropamide", "glimepiride",
    "acetohexamide", "glipizide", "glyburide", "tolbutamide", "pioglitazone",
    "rosiglitazone", "acarbose", "miglitol", "troglitazone", "tolazamide",
    "insulin", "glyburide-metformin", "glipizide-metformin",
    "glimepiride-pioglitazone", "metformin-rosiglitazone", "metformin-pioglitazone",
]


def preprocess_diabetes(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    df = df.copy()

    # Target: readmitted within 30 days → 1, else → 0
    df["target"] = (df["readmitted"] == "<30").astype(int)
    df.drop(columns=["readmitted"], inplace=True)

    # Drop low-utility columns
    df.drop(columns=[c for c in DIABETES_DROP_COLS if c in df.columns], inplace=True)

    # Replace '?' with NaN
    df.replace("?", np.nan, inplace=True)

    # Drop rows where target-leaking discharge happened
    if "discharge_disposition_id" in df.columns:
        df = df[~df["discharge_disposition_id"].isin([11, 13, 14, 19, 20, 21])]

    # Encode drug columns: No → 0, else → 1
    for col in DIABETES_DRUG_COLS:
        if col in df.columns:
            df[col] = (df[col] != "No").astype(int)

    # Encode categoricals
    for col in DIABETES_CATEGORICAL:
        if col in df.columns:
            df[col] = df[col].astype(str)
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].fillna("Unknown"))

    # Impute remaining numerics
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    num_cols = [c for c in num_cols if c != "target"]
    imputer = SimpleImputer(strategy="median")
    df[num_cols] = imputer.fit_transform(df[num_cols])

    y = df.pop("target")
    return df, y


# ── Heart Failure ───────────────────────────────────────────────────────────────

HEART_FEATURES = [
    "age", "anaemia", "creatinine_phosphokinase", "diabetes",
    "ejection_fraction", "high_blood_pressure", "platelets",
    "serum_creatinine", "serum_sodium", "sex", "smoking", "time",
]


def preprocess_heart(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    df = df.copy()
    df.replace("?", np.nan, inplace=True)

    available = [c for c in HEART_FEATURES if c in df.columns]
    X = df[available].copy()

    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    imputer = SimpleImputer(strategy="median")
    X[num_cols] = imputer.fit_transform(X[num_cols])

    y = df["death_event"].astype(int) if "death_event" in df.columns else df["DEATH_EVENT"].astype(int)
    return X, y


# ── Shared Utilities ────────────────────────────────────────────────────────────

def scale_features(
    X_train: pd.DataFrame, X_test: pd.DataFrame
) -> Tuple[np.ndarray, np.ndarray, StandardScaler]:
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    return X_train_scaled, X_test_scaled, scaler


def apply_smote(
    X: np.ndarray, y: pd.Series, random_state: int = 42
) -> Tuple[np.ndarray, np.ndarray]:
    smote = SMOTE(random_state=random_state)
    X_res, y_res = smote.fit_resample(X, y)
    return X_res, y_res


def save_artifact(obj: Any, name: str) -> str:
    os.makedirs(settings.models_dir, exist_ok=True)
    path = os.path.join(settings.models_dir, name)
    joblib.dump(obj, path)
    return path


def load_artifact(name: str) -> Any:
    path = os.path.join(settings.models_dir, name)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model artifact not found: {path}")
    return joblib.load(path)
