#!/usr/bin/env python3
"""
Download both UCI datasets and save them to backend/data/.
Uses ucimlrepo if available, falls back to direct requests.
"""
import os
import sys

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)


def download_with_ucimlrepo():
    from ucimlrepo import fetch_ucirepo

    # ── Diabetes 130-US Hospitals (ID 296) ──────────────────────────────────
    print("Downloading Diabetes 130-US Hospitals dataset (ID 296) ...")
    diabetes = fetch_ucirepo(id=296)
    df_X = diabetes.data.features
    df_y = diabetes.data.targets
    import pandas as pd
    df = pd.concat([df_X, df_y], axis=1)
    path = os.path.join(DATA_DIR, "diabetes_130.csv")
    df.to_csv(path, index=False)
    print(f"  Saved {len(df):,} rows → {path}")

    # ── Heart Failure Clinical Records (ID 519) ──────────────────────────────
    print("Downloading Heart Failure Clinical Records dataset (ID 519) ...")
    heart = fetch_ucirepo(id=519)
    df_X2 = heart.data.features
    df_y2 = heart.data.targets
    df2 = pd.concat([df_X2, df_y2], axis=1)
    path2 = os.path.join(DATA_DIR, "heart_failure.csv")
    df2.to_csv(path2, index=False)
    print(f"  Saved {len(df2):,} rows → {path2}")


def download_direct():
    """
    Fallback: download raw CSV files from publicly accessible mirrors.
    Replace these URLs with the actual direct download links if ucimlrepo fails.
    """
    import requests

    # Direct download URLs (update if links change)
    URLS = {
        "diabetes_130.csv": (
            "https://archive.ics.uci.edu/static/public/296/diabetes+130-us+hospitals+for+years+1999-2008.zip"
        ),
        "heart_failure.csv": (
            "https://archive.ics.uci.edu/static/public/519/heart+failure+clinical+records.zip"
        ),
    }

    print("Attempting direct download (ZIP files — manual extraction may be needed)...")
    for filename, url in URLS.items():
        dest = os.path.join(DATA_DIR, filename.replace(".csv", ".zip"))
        print(f"  Downloading {url} ...")
        try:
            r = requests.get(url, timeout=60)
            r.raise_for_status()
            with open(dest, "wb") as f:
                f.write(r.content)
            print(f"  Saved to {dest} — extract manually to get CSV")
        except Exception as e:
            print(f"  Download failed: {e}")

    print("\nManual steps if download failed:")
    print("  1. Visit https://archive.ics.uci.edu/dataset/296")
    print("     Download, extract, rename CSV to: backend/data/diabetes_130.csv")
    print("  2. Visit https://archive.ics.uci.edu/dataset/519")
    print("     Download, extract, rename CSV to: backend/data/heart_failure.csv")


if __name__ == "__main__":
    try:
        download_with_ucimlrepo()
        print("\nAll datasets downloaded successfully.")
    except Exception as e:
        print(f"ucimlrepo failed: {e}")
        print("Falling back to direct download ...")
        download_direct()
