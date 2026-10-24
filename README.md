# ReAdmissionIQ — Explainable Healthcare Intelligence

> **Academic Research Platform** — Explainable Patient Readmission Risk Stratification Using Hybrid Machine Learning and Clustering

---

## Overview

ReAdmissionIQ is a full-stack, research-oriented machine learning web platform that predicts
early hospital readmission using two real UCI datasets. Every prediction is accompanied by
SHAP-based explanations, counterfactual scenarios, similar-patient retrieval, K-Means risk
profiling, and a calibration-aware reliability dashboard.

**Website title:** ReAdmissionIQ — Explainable Healthcare Intelligence

**Disclaimer:** This application is developed for academic and research purposes only.
Its outputs are machine-learning predictions and must not be used as a substitute for
professional medical judgment.

---

## Datasets

| Dataset | Source | Records | Features | Prediction Target |
|---------|--------|---------|----------|-------------------|
| Diabetes 130-US Hospitals | [UCI ID 296](https://archive.ics.uci.edu/dataset/296) | 101,766 | 47 | Early readmission within 30 days |
| Heart Failure Clinical Records | [UCI ID 519](https://archive.ics.uci.edu/dataset/519) | 299 | 13 | Death during follow-up period |

These are **separate prediction tasks on different populations** — their accuracy scores are not comparable.

### Target Construction (Diabetes)
The original `readmitted` column has three values: `<30`, `>30`, `NO`.
The binary target is constructed as:  `1 if readmitted == "<30" else 0`  
This captures the clinically actionable event: readmission **within 30 days**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Charts | Recharts |
| Backend | Python 3.11 + FastAPI |
| ML | scikit-learn, XGBoost, SHAP, imbalanced-learn |
| Database | MongoDB (Motor async driver) |
| Auth | JWT (python-jose) + bcrypt |

---

## Project Structure

```
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── app/
│   │   ├── auth/               # JWT auth, password hashing
│   │   ├── api/                # REST route handlers
│   │   ├── database/           # MongoDB connection + document schemas
│   │   ├── ml/                 # ML pipeline modules
│   │   └── config.py
│   ├── models/                 # Saved .pkl artifacts (auto-created)
│   ├── data/                   # Dataset CSVs (download separately)
│   ├── scripts/
│   │   ├── download_data.py    # Download datasets from UCI
│   │   └── train_all.py        # Full training pipeline
│   └── tests/
│       ├── test_preprocessing.py
│       └── test_api.py
│
└── frontend/
    ├── src/
    │   ├── pages/              # All 17 application pages
    │   ├── components/         # UI, layout, and chart components
    │   ├── context/            # Auth + Theme context
    │   ├── services/           # Axios API wrappers
    │   └── types/              # TypeScript types
    └── package.json
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB 6+ running locally (`mongod`)

---

### 1. Clone / open the project

```bash
cd "Explainable Patient Readmission Risk Stratification Using Hybrid Machine Learning and Clustering"
```

### 2. Set up Python environment

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env if needed — defaults work for local MongoDB
```

### 4. Download the datasets

```bash
python scripts/download_data.py
```

This uses `ucimlrepo` to fetch both datasets. If it fails, follow the manual steps printed by the script.

Expected files after download:
- `backend/data/diabetes_130.csv`
- `backend/data/heart_failure.csv`

### 5. Train the models

```bash
python scripts/train_all.py
```

This runs the full pipeline:
1. Loads and preprocesses both datasets
2. Trains the hybrid ensemble (XGBoost + Random Forest soft-voting) for each
3. Evaluates on held-out test sets
4. Saves model artifacts to `backend/models/`
5. Fits K-Means clustering on each dataset

Expected outputs in `backend/models/`:
```
diabetes_model.pkl    diabetes_scaler.pkl   diabetes_features.pkl
diabetes_metrics.json diabetes_kmeans.pkl
heart_model.pkl       heart_scaler.pkl      heart_features.pkl
heart_metrics.json    heart_kmeans.pkl
```

Training typically takes 5–15 minutes depending on hardware.

### 6. Start MongoDB

```bash
mongod --dbpath /usr/local/var/mongodb   # macOS Homebrew
# or: brew services start mongodb-community
```

### 7. Start the FastAPI backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 8. Install and start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: http://localhost:5173

---

## Application Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Public overview page |
| Dashboard | `/dashboard` | Prediction activity, stats, trends |
| Patient Analysis | `/patient-analysis` | Run a risk prediction |
| Explainable AI | `/explainable` | SHAP explanations + global importance |
| Risk Profiles | `/risk-profiles` | K-Means patient cohorts |
| Similar Patients | `/similar-patients` | Nearest-neighbor patient retrieval |
| Counterfactual Lab | `/counterfactual` | What-would-change-the-prediction analysis |
| What-If Simulator | `/what-if` | Interactive feature sensitivity explorer |
| Model Lab | `/model-lab` | Evaluation metrics, ROC, feature importance |
| Trust & Reliability | `/reliability` | Calibration plot, Brier score, ECE, limitations |
| Cross-Dataset | `/cross-dataset` | Diabetes vs Heart Failure methodology comparison |
| Analytics | `/analytics` | Prediction trends, distribution charts |
| Prediction History | `/history` | Browse/delete saved predictions |
| Settings | `/settings` | Account, theme, password |

---

## API Endpoints

```
POST /api/auth/register          Create account
POST /api/auth/login             Get JWT token
GET  /api/auth/me                Current user

POST /api/predict/               Run prediction (saved to MongoDB)
POST /api/explain/prediction     SHAP explanation for one patient
GET  /api/explain/global/{ds}    Global feature importance
POST /api/counterfactual/generate  Find feature changes that flip prediction
POST /api/what-if/simulate       Simulate feature value changes
POST /api/similar-patients/      Nearest-neighbor patient search

GET  /api/risk-profiles/{ds}     K-Means cluster summaries
GET  /api/model-results/{ds}     Trained model metrics
GET  /api/analytics/summary      Prediction count / risk distribution
GET  /api/analytics/trends       Time-series prediction activity
GET  /api/cross-dataset/comparison  Side-by-side dataset comparison
POST /api/reliability/calibration   Calibration curve data
POST /api/reliability/metrics       Brier score, ECE

GET  /api/predictions-history/       List saved predictions (paginated)
GET  /api/predictions-history/{id}   Retrieve single prediction
DELETE /api/predictions-history/{id} Delete a saved prediction

GET  /health                     Service health check
```

All endpoints except `/health`, `/api/auth/register`, and `/api/auth/login`
require a Bearer token in the `Authorization` header.

---

## ML Pipeline Details

### Hybrid Ensemble
Both datasets use a **soft-voting ensemble**:
- **XGBoost** (weight 2): gradient boosted trees, handles mixed data well
- **Random Forest** (weight 1): strong regularisation, low variance

For Heart Failure, a **Gradient Boosting** estimator is added as a third component.

### Class Imbalance
The Diabetes dataset has ~11% positive class. **SMOTE** is applied to the
training set only to avoid leakage into the test set.

### Preprocessing
- Categorical encoding via `LabelEncoder` per column
- Numerical imputation via median strategy
- Feature scaling via `StandardScaler`
- Target-leaking discharge codes removed (IDs 11, 13, 14, 19, 20, 21)

### Clustering
**K-Means (k=5)** is fitted on the full preprocessed, scaled dataset.
Cluster profiles show centroid feature values in original scale.
These are descriptive groups — not clinical diagnoses.

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

For the API integration tests, MongoDB must be running.
For preprocessing tests only (no DB required):

```bash
pytest tests/test_preprocessing.py -v
```

---

## User Roles

| Role | Permissions |
|------|-------------|
| `analyst` | Run predictions, view explanations, access all analysis tools |
| `admin` | All analyst permissions + system statistics |

Role is set at registration. Permissions are enforced on the backend.

---

## Assumptions and Limitations

1. **Diabetes target leakage:** Discharge disposition codes that indicate hospital transfer or death have been excluded from training to avoid leaking the outcome.

2. **Patient-grouped splitting:** The Diabetes dataset contains repeat patient visits (same `patient_nbr`). The current implementation uses a random stratified split. A patient-grouped split would be more rigorous but may reduce the proportion of the rare class in the test set for this dataset size.

3. **SHAP for ensemble:** SHAP values are computed on the XGBoost base estimator only (not the full voting ensemble) for computational tractability.

4. **Counterfactual search:** The current implementation uses greedy random perturbation. A gradient-based or DiCE-style optimisation would find better counterfactuals but is significantly more computationally expensive.

5. **Calibration display:** The calibration plot on the Reliability page uses an approximation; production deployment would require ground-truth labels from a held-out validation split.

6. **Heart Failure dataset size:** 299 records is very small. Results should not be generalised. This dataset is used to demonstrate that the same methodology applies to a different healthcare task.

---

## Environment Variables Reference

```env
MONGODB_URL=mongodb://localhost:27017   # MongoDB connection string
DATABASE_NAME=readmissioniq             # Database name
SECRET_KEY=<long-random-string>         # JWT signing key (change in production!)
ALGORITHM=HS256                         # JWT algorithm
ACCESS_TOKEN_EXPIRE_MINUTES=30          # Token lifetime
DIABETES_DATA_PATH=data/diabetes_130.csv
HEART_DATA_PATH=data/heart_failure.csv
MODELS_DIR=models                       # Directory for .pkl artifacts
```

---

## Academic Citation

If you use this platform in academic work, please cite:

- Strack, B. et al. (2014). Impact of HbA1c Measurement on Hospital Readmission Rates. *BioMed Research International*.
- Chicco, D. & Jurman, G. (2020). Machine learning can predict survival of patients with heart failure. *BMC Medical Informatics and Decision Making*.
