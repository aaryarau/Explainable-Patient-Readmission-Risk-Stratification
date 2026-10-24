import { useEffect, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Card, CardHeader } from '../components/ui/Card'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { FeatureImportance } from '../components/charts/FeatureImportance'
import { predictionService } from '../services/predictions'
import { GitCompare, AlertTriangle } from 'lucide-react'
import { formatPercent } from '../utils/formatters'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts'

const METRIC_KEYS = ['accuracy', 'roc_auc', 'f1_score', 'precision', 'recall'] as const

export default function CrossDatasetIntelligence() {
  const [data, setData] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await predictionService.crossDataset()
        setData(res.datasets)
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Train both models first.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const radarData = METRIC_KEYS.map(k => ({
    metric: k.replace('_', ' ').toUpperCase(),
    Diabetes: data?.diabetes ? parseFloat((data.diabetes[k] * 100).toFixed(1)) : 0,
    Heart: data?.heart ? parseFloat((data.heart[k] * 100).toFixed(1)) : 0,
  }))

  return (
    <Layout title="Cross-Dataset Intelligence" subtitle="Compare ML methodology across both healthcare prediction tasks">
      <div className="space-y-6">
        {/* Important note */}
        <Card>
          <div className="flex gap-3">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              The Diabetes dataset predicts <strong>early hospital readmission within 30 days</strong>,
              while the Heart Failure dataset predicts <strong>death during follow-up</strong>.
              These are different prediction tasks on different populations — raw accuracy
              comparisons are not meaningful across them. This page compares methodology behaviour, not outcome equivalence.
            </p>
          </div>
        </Card>

        {loading ? (
          <PageLoader />
        ) : error ? (
          <Card><p className="text-sm text-red-500">{error}</p></Card>
        ) : data ? (
          <div className="space-y-6">
            {/* Radar comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader title="Metric Radar Comparison" icon={<GitCompare size={16} />} />
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <Radar name="Diabetes" dataKey="Diabetes" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                    <Radar name="Heart Failure" dataKey="Heart" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`${v}%`]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>

              {/* Side-by-side metrics */}
              <Card>
                <CardHeader title="Metrics Side-by-Side" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left py-2 text-xs font-medium text-gray-500">Metric</th>
                        <th className="text-right py-2 text-xs font-medium text-indigo-500">Diabetes</th>
                        <th className="text-right py-2 text-xs font-medium text-cyan-500">Heart Failure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {METRIC_KEYS.map(k => (
                        <tr key={k} className="border-b border-gray-50 dark:border-gray-800/50">
                          <td className="py-2 text-gray-600 dark:text-gray-400 capitalize">
                            {k.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2 text-right font-semibold text-indigo-600">
                            {data.diabetes ? formatPercent(data.diabetes[k]) : '—'}
                          </td>
                          <td className="py-2 text-right font-semibold text-cyan-600">
                            {data.heart ? formatPercent(data.heart[k]) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Dataset info cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                {
                  key: 'diabetes',
                  label: 'Diabetes 130-US Hospitals',
                  color: 'border-indigo-300',
                  target: 'Early readmission within 30 days',
                  source: 'UCI ML Repository — 101,766 records, 47 features',
                  notes: 'Class imbalance addressed with SMOTE. Patient-encounter split used.',
                },
                {
                  key: 'heart',
                  label: 'Heart Failure Clinical Records',
                  color: 'border-cyan-300',
                  target: 'Death during follow-up period',
                  source: 'UCI ML Repository — 299 records, 13 features',
                  notes: 'Small dataset. Results may not generalise. SMOTE applied.',
                },
              ].map(d => (
                <Card key={d.key} className={`border-l-4 ${d.color}`}>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">{d.label}</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-gray-400">Prediction Target</span>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{d.target}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Source</span>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">{d.source}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Notes</span>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">{d.notes}</p>
                    </div>
                    {data[d.key] && (
                      <div className="pt-2">
                        <span className="text-xs text-gray-400">Training Samples</span>
                        <p className="font-medium">{data[d.key].training_samples?.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Feature importance comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(['diabetes', 'heart'] as const).map(d => (
                data[d]?.top_features?.length > 0 && (
                  <Card key={d}>
                    <CardHeader
                      title={`Top Features — ${d === 'diabetes' ? 'Diabetes' : 'Heart Failure'}`}
                    />
                    <FeatureImportance features={data[d].top_features} title="" />
                  </Card>
                )
              ))}
            </div>

            <p className="text-xs text-gray-400">
              Academic research only. Do not interpret cross-dataset metric differences as
              evidence that one disease is easier to predict than another.
            </p>
          </div>
        ) : null}
      </div>
    </Layout>
  )
}
