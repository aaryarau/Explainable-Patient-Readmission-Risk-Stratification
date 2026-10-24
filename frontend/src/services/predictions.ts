import api from './api'
import {
  PredictRequest,
  PredictResponse,
  ExplainResponse,
  CounterfactualResponse,
  WhatIfResponse,
  WhatIfScenario,
  SimilarPatient,
  ClusterProfile,
  ModelMetrics,
  AnalyticsSummary,
  TrendPoint,
  PredictionHistory,
  Dataset,
} from '../types'

export const predictionService = {
  predict: async (req: PredictRequest): Promise<PredictResponse> => {
    const res = await api.post('/predict/', req)
    return res.data
  },

  explain: async (dataset: Dataset, patient_data: Record<string, unknown>): Promise<ExplainResponse> => {
    const res = await api.post('/explain/prediction', { dataset, patient_data })
    return res.data
  },

  globalImportance: async (dataset: Dataset, n_top = 20) => {
    const res = await api.get(`/explain/global/${dataset}?n_top=${n_top}`)
    return res.data
  },

  counterfactual: async (
    dataset: Dataset,
    patient_data: Record<string, unknown>,
    target_probability = 0.25,
    max_features_to_change = 5
  ): Promise<CounterfactualResponse> => {
    const res = await api.post('/counterfactual/generate', {
      dataset,
      patient_data,
      target_probability,
      max_features_to_change,
    })
    return res.data
  },

  whatIf: async (
    dataset: Dataset,
    base_patient_data: Record<string, unknown>,
    scenarios: WhatIfScenario[]
  ): Promise<WhatIfResponse> => {
    const res = await api.post('/what-if/simulate', { dataset, base_patient_data, scenarios })
    return res.data
  },

  similarPatients: async (
    dataset: Dataset,
    patient_data: Record<string, unknown>,
    top_k = 5
  ): Promise<{ similar_patients: SimilarPatient[]; total_pool: number }> => {
    const res = await api.post('/similar-patients/', { dataset, patient_data, top_k })
    return res.data
  },

  riskProfiles: async (dataset: Dataset): Promise<{ profiles: ClusterProfile[] }> => {
    const res = await api.get(`/risk-profiles/${dataset}`)
    return res.data
  },

  modelResults: async (dataset?: Dataset): Promise<ModelMetrics | Record<string, ModelMetrics>> => {
    const url = dataset ? `/model-results/${dataset}` : '/model-results/'
    const res = await api.get(url)
    return res.data
  },

  analyticsSummary: async (): Promise<AnalyticsSummary> => {
    const res = await api.get('/analytics/summary')
    return res.data
  },

  analyticsTrends: async (days = 30, dataset?: Dataset): Promise<{ trends: TrendPoint[] }> => {
    const params = new URLSearchParams({ days: String(days) })
    if (dataset) params.append('dataset', dataset)
    const res = await api.get(`/analytics/trends?${params}`)
    return res.data
  },

  listPredictions: async (params?: {
    dataset?: Dataset
    risk_level?: string
    search?: string
    limit?: number
    skip?: number
  }): Promise<{ predictions: PredictionHistory[]; total: number }> => {
    const res = await api.get('/predictions-history/', { params })
    return res.data
  },

  getPrediction: async (id: string) => {
    const res = await api.get(`/predictions-history/${id}`)
    return res.data
  },

  deletePrediction: async (id: string) => {
    const res = await api.delete(`/predictions-history/${id}`)
    return res.data
  },

  crossDataset: async () => {
    const res = await api.get('/cross-dataset/comparison')
    return res.data
  },

  reliability: async (predictions: Array<{ probability: number; actual_label: number }>, dataset: Dataset) => {
    const res = await api.post('/reliability/metrics', { dataset, predictions })
    return res.data
  },
}
