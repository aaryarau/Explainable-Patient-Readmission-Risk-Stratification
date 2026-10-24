"""
Unit tests for the preprocessing pipeline.
These tests run without needing trained models or a live database.
"""
import pytest
import pandas as pd
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.preprocessing import preprocess_diabetes, preprocess_heart


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_diabetes_df(n: int = 50) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    df = pd.DataFrame({
        "encounter_id": range(n),
        "patient_nbr": range(n),
        "race": rng.choice(["Caucasian", "AfricanAmerican", "?", "Other"], n),
        "gender": rng.choice(["Male", "Female"], n),
        "age": rng.choice(["[0-10)", "[10-20)", "[40-50)", "[70-80)"], n),
        "weight": ["?" ] * n,
        "admission_type_id": rng.integers(1, 8, n).astype(str),
        "discharge_disposition_id": rng.integers(1, 10, n).astype(str),
        "admission_source_id": rng.integers(1, 10, n).astype(str),
        "time_in_hospital": rng.integers(1, 14, n),
        "payer_code": ["?" ] * n,
        "medical_specialty": ["?" ] * n,
        "num_lab_procedures": rng.integers(1, 120, n),
        "num_procedures": rng.integers(0, 6, n),
        "num_medications": rng.integers(1, 80, n),
        "number_outpatient": rng.integers(0, 20, n),
        "number_emergency": rng.integers(0, 20, n),
        "number_inpatient": rng.integers(0, 20, n),
        "diag_1": rng.choice(["250", "401", "?"], n),
        "diag_2": rng.choice(["250", "?"], n),
        "diag_3": rng.choice(["250", "?"], n),
        "number_diagnoses": rng.integers(1, 16, n),
        "max_glu_serum": rng.choice(["None", ">300", "?"], n),
        "A1Cresult": rng.choice(["None", ">7", "?"], n),
        "metformin": rng.choice(["No", "Steady", "Up"], n),
        "repaglinide": ["No"] * n,
        "nateglinide": ["No"] * n,
        "chlorpropamide": ["No"] * n,
        "glimepiride": ["No"] * n,
        "acetohexamide": ["No"] * n,
        "glipizide": rng.choice(["No", "Steady"], n),
        "glyburide": ["No"] * n,
        "tolbutamide": ["No"] * n,
        "pioglitazone": ["No"] * n,
        "rosiglitazone": ["No"] * n,
        "acarbose": ["No"] * n,
        "miglitol": ["No"] * n,
        "troglitazone": ["No"] * n,
        "tolazamide": ["No"] * n,
        "examide": ["No"] * n,
        "citoglipton": ["No"] * n,
        "insulin": rng.choice(["No", "Steady", "Up", "Down"], n),
        "glyburide-metformin": ["No"] * n,
        "glipizide-metformin": ["No"] * n,
        "glimepiride-pioglitazone": ["No"] * n,
        "metformin-rosiglitazone": ["No"] * n,
        "metformin-pioglitazone": ["No"] * n,
        "change": rng.choice(["No", "Ch"], n),
        "diabetesMed": rng.choice(["Yes", "No"], n),
        "readmitted": rng.choice(["<30", ">30", "NO"], n),
    })
    return df


def make_heart_df(n: int = 50) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    return pd.DataFrame({
        "age": rng.integers(40, 95, n),
        "anaemia": rng.integers(0, 2, n),
        "creatinine_phosphokinase": rng.integers(20, 8000, n),
        "diabetes": rng.integers(0, 2, n),
        "ejection_fraction": rng.integers(14, 80, n),
        "high_blood_pressure": rng.integers(0, 2, n),
        "platelets": rng.integers(25000, 850000, n),
        "serum_creatinine": rng.uniform(0.5, 9.4, n),
        "serum_sodium": rng.integers(114, 148, n),
        "sex": rng.integers(0, 2, n),
        "smoking": rng.integers(0, 2, n),
        "time": rng.integers(4, 285, n),
        "DEATH_EVENT": rng.integers(0, 2, n),
    })


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestDiabetesPreprocessing:
    def test_returns_dataframe_and_series(self):
        df = make_diabetes_df()
        X, y = preprocess_diabetes(df)
        assert isinstance(X, pd.DataFrame)
        assert isinstance(y, pd.Series)

    def test_no_readmitted_column_in_features(self):
        df = make_diabetes_df()
        X, _ = preprocess_diabetes(df)
        assert "readmitted" not in X.columns

    def test_target_is_binary(self):
        df = make_diabetes_df()
        _, y = preprocess_diabetes(df)
        assert set(y.unique()).issubset({0, 1})

    def test_no_nan_in_output(self):
        df = make_diabetes_df()
        X, y = preprocess_diabetes(df)
        assert not X.isnull().any().any(), "Features contain NaN after preprocessing"
        assert not y.isnull().any(), "Target contains NaN after preprocessing"

    def test_drop_cols_removed(self):
        df = make_diabetes_df()
        X, _ = preprocess_diabetes(df)
        for col in ["encounter_id", "patient_nbr", "weight", "payer_code"]:
            assert col not in X.columns

    def test_all_numeric(self):
        df = make_diabetes_df()
        X, _ = preprocess_diabetes(df)
        assert all(X.dtypes.apply(lambda d: np.issubdtype(d, np.number)))


class TestHeartPreprocessing:
    def test_returns_correct_shape(self):
        df = make_heart_df()
        X, y = preprocess_heart(df)
        assert X.shape[0] == len(df)
        assert len(y) == len(df)

    def test_target_is_binary(self):
        df = make_heart_df()
        _, y = preprocess_heart(df)
        assert set(y.unique()).issubset({0, 1})

    def test_no_nan_in_features(self):
        df = make_heart_df()
        X, _ = preprocess_heart(df)
        assert not X.isnull().any().any()

    def test_death_event_not_in_features(self):
        df = make_heart_df()
        X, _ = preprocess_heart(df)
        assert "DEATH_EVENT" not in X.columns
