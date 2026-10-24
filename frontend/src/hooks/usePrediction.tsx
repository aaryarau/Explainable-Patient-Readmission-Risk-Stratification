import { useState, useCallback } from 'react'
import { predictionService } from '../services/predictions'
import { PredictResponse, Dataset } from '../types'
import toast from 'react-hot-toast'

export function usePrediction() {
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const predict = useCallback(
    async (dataset: Dataset, patientData: Record<string, unknown>, patientName: string, save = true) => {
      setLoading(true)
      setError(null)
      try {
        const res = await predictionService.predict({
          dataset,
          patient_data: patientData,
          patient_name: patientName,
          save_result: save,
        })
        setResult(res)
        return res
      } catch (err: any) {
        const msg = err?.response?.data?.detail || 'Prediction failed'
        setError(msg)
        toast.error(msg)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, loading, error, predict, reset }
}
