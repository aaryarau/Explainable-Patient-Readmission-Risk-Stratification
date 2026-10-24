#!/usr/bin/env python3
"""
Seed the MongoDB database with demo prediction records so all analytics
pages are populated immediately after setup.

Usage (from backend/ directory):
    python scripts/seed_demo_data.py

Requires a running MongoDB instance and trained models.
"""
import os
import sys
import asyncio
import random
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.ml.predict import predict_risk

# ── Demo patient templates ────────────────────────────────────────────────────

DIABETES_TEMPLATES = [
    {"age": 7, "time_in_hospital": 8, "num_lab_procedures": 72, "num_procedures": 2,
     "num_medications": 24, "number_outpatient": 0, "number_emergency": 3,
     "number_inpatient": 4, "number_diagnoses": 9, "insulin": 1, "diabetesMed": 1,
     "change": 1, "A1Cresult": 3},
    {"age": 3, "time_in_hospital": 2, "num_lab_procedures": 22, "num_procedures": 0,
     "num_medications": 8, "number_outpatient": 1, "number_emergency": 0,
     "number_inpatient": 0, "number_diagnoses": 4, "insulin": 0, "diabetesMed": 1,
     "change": 0, "A1Cresult": 1},
    {"age": 5, "time_in_hospital": 5, "num_lab_procedures": 45, "num_procedures": 1,
     "num_medications": 16, "number_outpatient": 0, "number_emergency": 1,
     "number_inpatient": 2, "number_diagnoses": 7, "insulin": 1, "diabetesMed": 1,
     "change": 1, "A1Cresult": 2},
    {"age": 8, "time_in_hospital": 11, "num_lab_procedures": 90, "num_procedures": 4,
     "num_medications": 30, "number_outpatient": 0, "number_emergency": 5,
     "number_inpatient": 6, "number_diagnoses": 12, "insulin": 1, "diabetesMed": 1,
     "change": 1, "A1Cresult": 3},
    {"age": 2, "time_in_hospital": 1, "num_lab_procedures": 15, "num_procedures": 0,
     "num_medications": 6, "number_outpatient": 2, "number_emergency": 0,
     "number_inpatient": 0, "number_diagnoses": 3, "insulin": 0, "diabetesMed": 0,
     "change": 0, "A1Cresult": 0},
]

HEART_TEMPLATES = [
    {"age": 75, "anaemia": 1, "creatinine_phosphokinase": 582, "diabetes": 1,
     "ejection_fraction": 14, "high_blood_pressure": 1, "platelets": 127000,
     "serum_creatinine": 2.7, "serum_sodium": 130, "sex": 1, "smoking": 0, "time": 4},
    {"age": 55, "anaemia": 0, "creatinine_phosphokinase": 100, "diabetes": 0,
     "ejection_fraction": 50, "high_blood_pressure": 0, "platelets": 250000,
     "serum_creatinine": 0.9, "serum_sodium": 140, "sex": 0, "smoking": 0, "time": 200},
    {"age": 65, "anaemia": 1, "creatinine_phosphokinase": 250, "diabetes": 0,
     "ejection_fraction": 30, "high_blood_pressure": 1, "platelets": 200000,
     "serum_creatinine": 1.6, "serum_sodium": 134, "sex": 1, "smoking": 1, "time": 20},
    {"age": 45, "anaemia": 0, "creatinine_phosphokinase": 60, "diabetes": 1,
     "ejection_fraction": 60, "high_blood_pressure": 0, "platelets": 300000,
     "serum_creatinine": 0.8, "serum_sodium": 142, "sex": 0, "smoking": 0, "time": 250},
    {"age": 80, "anaemia": 1, "creatinine_phosphokinase": 800, "diabetes": 1,
     "ejection_fraction": 20, "high_blood_pressure": 1, "platelets": 100000,
     "serum_creatinine": 3.0, "serum_sodium": 128, "sex": 1, "smoking": 1, "time": 7},
]

DEMO_USER_ID = "000000000000000000000001"


async def seed(n_days: int = 30, records_per_day: int = 3):
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    col = db["predictions"]

    print(f"Seeding {n_days * records_per_day} demo predictions over {n_days} days ...")

    rng = random.Random(42)
    inserted = 0

    for day in range(n_days):
        ts_base = datetime.now(timezone.utc) - timedelta(days=(n_days - day))
        for _ in range(records_per_day):
            dataset = rng.choice(["diabetes", "heart"])
            template = rng.choice(DIABETES_TEMPLATES if dataset == "diabetes" else HEART_TEMPLATES)

            # Jitter the values slightly so records aren't identical
            patient = {
                k: v + rng.gauss(0, max(abs(v) * 0.05, 0.1)) if isinstance(v, (int, float)) else v
                for k, v in template.items()
            }

            try:
                result = predict_risk(dataset, patient)
            except FileNotFoundError:
                print("  Models not found — run train_all.py first.")
                client.close()
                return

            ts = ts_base + timedelta(hours=rng.randint(0, 23), minutes=rng.randint(0, 59))

            doc = {
                "user_id": DEMO_USER_ID,
                "dataset": dataset,
                "patient_data": {k: round(float(v), 4) for k, v in patient.items()},
                "prediction": result["prediction"],
                "probability": result["probability"],
                "risk_level": result["risk_level"],
                "cluster_id": None,
                "created_at": ts,
            }
            await col.insert_one(doc)
            inserted += 1

    total = await col.count_documents({})
    print(f"  Inserted {inserted} demo records.  Total in DB: {total}")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
