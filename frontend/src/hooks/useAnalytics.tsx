import { useState, useEffect } from 'react'
import { predictionService } from '../services/predictions'
import { AnalyticsSummary, TrendPoint } from '../types'

export function useAnalytics(days = 30) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [s, t] = await Promise.all([
          predictionService.analyticsSummary(),
          predictionService.analyticsTrends(days),
        ])
        if (!cancelled) {
          setSummary(s)
          setTrends(t.trends)
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load analytics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [days])

  return { summary, trends, loading, error }
}
