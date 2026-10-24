// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  username: string
  full_name?: string
  role: 'clinician' | 'admin' | 'researcher'
  is_active: boolean
  created_at: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

// ── Predictions ───────────────────────────────────────────────────────────────

export type Dataset = 'diabetes' | 'heart'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface PredictRequest {
  dataset: Dataset
  patient_data: Record<string, unknown>
  patient_name: string          // for identification only, never used in ML
  save_result?: boolean
}

export interface PredictResponse {
  prediction: 0 | 1
  probability: number
  risk_level: RiskLevel
  cluster_id?: number
  prediction_id?: string        // PRD-0001
  patient_record_id?: string    // PAT-0001
  patient_name?: string
  mongo_id?: string
}

export interface PredictionHistory {
  id: string
  prediction_id: string         // PRD-XXXX
  patient_record_id: string     // PAT-XXXX
  patient_name: string
  dataset: Dataset
  prediction: 0 | 1
  probability: number
  risk_level: RiskLevel
  cluster_id?: number
  created_at: string
}

export interface PatientRecord {
  patient_record_id: string
  full_name: string
  created_at: string
  total_predictions: number
}

// ── Explainability ────────────────────────────────────────────────────────────

export interface ShapFeature {
  feature: string
  shap_value: number
  direction: 'increases' | 'decreases'
}

export interface ExplainResponse {
  shap_values: Record<string, number>
  top_features: ShapFeature[]
  base_value: number
}

export interface GlobalFeature {
  feature: string
  importance: number
}

// ── Counterfactual ────────────────────────────────────────────────────────────

export interface CounterfactualChange {
  feature: string
  original_value: number
  counterfactual_value: number
  delta: number
}

export interface CounterfactualResponse {
  counterfactual: Record<string, number>
  changes: CounterfactualChange[]
  original_probability: number
  counterfactual_probability: number
  target_achieved: boolean
  message?: string
}

// ── What-If ───────────────────────────────────────────────────────────────────

export interface WhatIfScenario {
  feature: string
  value: number | string
}

export interface WhatIfResult {
  feature: string
  new_value: unknown
  original_value: unknown
  probability: number
  risk_level: RiskLevel
  probability_delta: number
}

export interface WhatIfResponse {
  baseline_probability: number
  baseline_risk_level: RiskLevel
  scenarios: WhatIfResult[]
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  total_predictions: number
  risk_distribution: { high: number; medium: number; low: number }
  predictions_last_7_days: number
}

export interface TrendPoint {
  date: string
  count: number
  avg_probability: number
}

// ── Model Results ─────────────────────────────────────────────────────────────

export interface ConfusionMatrixData {
  tn: number
  fp: number
  fn: number
  tp: number
}

export interface ModelMetrics {
  dataset: string
  accuracy: number
  roc_auc: number
  pr_auc?: number
  f1_score: number
  precision: number
  recall: number
  feature_names: string[]
  training_samples: number
  test_samples: number
  trained_at: string
  top_features?: GlobalFeature[]
  confusion_matrix?: ConfusionMatrixData
}

// ── Clusters ──────────────────────────────────────────────────────────────────

export interface ClusterProfile {
  cluster_id: number
  size: number
  centroid: Record<string, number>
  risk_label?: string
}

export interface ClusterPoint {
  x: number
  y: number
  cluster: number
}

// ── Similar Patients ──────────────────────────────────────────────────────────

export interface SimilarPatient extends Record<string, unknown> {
  similarity_score: number
  rank: number
  readmitted?: number
  probability?: number
  risk_level?: RiskLevel
}
