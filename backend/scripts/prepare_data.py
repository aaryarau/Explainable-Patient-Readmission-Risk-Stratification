#!/usr/bin/env python3
"""
Data preparation script.
Validates the downloaded CSV files, shows basic statistics,
and confirms the target distribution before training.

Usage (from backend/ directory):
    python scripts/prepare_data.py
"""
import os
import sys
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.ml.preprocessing import preprocess_diabetes, preprocess_heart
from app.config import settings


def validate_and_report(name: str, path: str, preprocess_fn, target_col_hint: str):
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"  Path: {path}")
    print(f"{'='*60}")

    if not os.path.exists(path):
        print(f"  ERROR: File not found. Run: python scripts/download_data.py")
        return

    df = pd.read_csv(path)
    print(f"\n  Raw shape          : {df.shape[0]:,} rows x {df.shape[1]} columns")
    print(f"  Memory usage       : {df.memory_usage(deep=True).sum() / 1e6:.1f} MB")

    # Missing values
    missing = df.isnull().sum() + (df == '?').sum()
    missing = missing[missing > 0]
    if len(missing):
        print(f"\n  Columns with missing/'?' values ({len(missing)} total):")
        for col, cnt in missing.items():
            pct = 100 * cnt / len(df)
            print(f"    {col:<40} {cnt:>6,}  ({pct:.1f}%)")
    else:
        print("  No missing values detected.")

    # Target distribution
    print(f"\n  Target column hint : {target_col_hint}")
    if target_col_hint in df.columns:
        vc = df[target_col_hint].value_counts()
        print(f"  Value counts:")
        for val, cnt in vc.items():
            print(f"    {str(val):<20} {cnt:>6,}  ({100*cnt/len(df):.1f}%)")

    # Preprocess and report
    print(f"\n  Running preprocessing pipeline ...")
    try:
        X, y = preprocess_fn(df)
        pos = y.sum()
        neg = len(y) - pos
        print(f"  Preprocessed shape : {X.shape[0]:,} rows x {X.shape[1]} features")
        print(f"  Target positives   : {int(pos):,}  ({100*pos/len(y):.1f}%)")
        print(f"  Target negatives   : {int(neg):,}  ({100*neg/len(y):.1f}%)")
        print(f"  Imbalance ratio    : 1:{neg/max(pos,1):.1f}")
        print(f"  Feature list       :")
        for i, col in enumerate(X.columns):
            print(f"    {i+1:3}. {col}")
    except Exception as e:
        print(f"  ERROR during preprocessing: {e}")
        raise


def main():
    validate_and_report(
        name="Diabetes 130-US Hospitals (Readmission)",
        path=settings.diabetes_data_path,
        preprocess_fn=preprocess_diabetes,
        target_col_hint="readmitted",
    )

    validate_and_report(
        name="Heart Failure Clinical Records",
        path=settings.heart_data_path,
        preprocess_fn=preprocess_heart,
        target_col_hint="DEATH_EVENT",
    )

    print(f"\n{'='*60}")
    print("  Data preparation complete. Proceed with: python scripts/train_all.py")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
