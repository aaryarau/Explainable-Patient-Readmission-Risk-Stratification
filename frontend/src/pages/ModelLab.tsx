import { useEffect, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Card, CardHeader } from '../components/ui/Card'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { ROCCurve } from '../components/charts/ROCCurve'
import { FeatureImportance } from '../components/charts/FeatureImportance'
import { ConfusionMatrix } from '../components/charts/ConfusionMatrix'
import { predictionService } from '../services/predictions'
import { ModelMetrics, Dataset } from '../types'
import { Database, CheckCircle } from 'lucide-react'
import { formatPercent } from '../utils/formatters'

const METRIC_LABELS: { key: keyof ModelMetrics; label: string }[] = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'roc_auc', label: 'ROC-AUC' },
  { key: 'f1_score', label: 'F1 Score' },
  { key: 'precision', label: 'Precision' },
  { key: 'recall', label: 'Recall' },
]

export default function ModelLab() {
  const [dataset, setDataset] = useState<Dataset>('diabetes')
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null)
  const [globalFeats, setGlobalFeats] = useState<{ feature: string; importance: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (d: Dataset) => {
    setLoading(true)
    setError('')
    try {
      const [m, g] = await Promise.all([
        predictionService.modelResults(d) as Promise<ModelMetrics>,
        predictionService.globalImportance(d),
      ])
      setMetrics(m)
      setGlobalFeats(g.features || [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Model not trained yet. Run training scripts first.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(dataset) }, [dataset])

  return (
    <Layout title="Model Lab" subtitle="Trained model evaluation metrics and feature analysis">
      <div className="space-y-6">
        {/* Dataset selector */}
        <Card>
          <div className="flex items-center gap-4">
            <label className="label mb-0">Dataset</label>
            {(['diabetes', 'heart'] as Dataset[]).map(d => (
              <button
                key={d}
                onClick={() => setDataset(d)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dataset === d
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                {d === 'diabetes' ? 'Diabetes 130-US' : 'Heart Failure'}
              </button>
            ))}
          </div>
        </Card>

        {loading ? (
          <PageLoader />
        ) : error ? (
          <Card>
            <div className="flex items-center gap-3 text-amber-600">
              <Database size={20} />
              <p className="text-sm">{error}</p>
            </div>
          </Card>
        ) : metrics ? (
          <div className="space-y-6">
            {/* Metric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {METRIC_LABELS.map(({ key, label }) => (
                <Card key={key} className="text-center">
                  <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                    {formatPercent(metrics[key] as number)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </Card>
              ))}
            </div>

            {/* Training info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader title="Training Details" icon={<CheckCircle size={16} />} />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Training Samples</span>
                    <span className="font-medium">{metrics.training_samples?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Test Samples</span>
                    <span className="font-medium">{metrics.test_samples?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Features Used</span>
                    <span className="font-medium">{metrics.feature_names?.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trained At</span>
                    <span className="font-medium text-xs">
                      {metrics.trained_at
                        ? new Date(metrics.trained_at).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* ROC Curve */}
              <Card className="lg:col-span-2">
                <ROCCurve auc={metrics.roc_auc} dataset={dataset} />
              </Card>
            </div>

            {/* Feature importance */}
            {globalFeats.length > 0 && (
              <Card>
                <CardHeader
                  title="Feature Importance"
                  subtitle="Top features by XGBoost gain"
                  icon={<Database size={16} />}
                />
                <FeatureImportance features={globalFeats} title="" />
              </Card>
            )}

            {/* Confusion Matrix */}
            {metrics.confusion_matrix && (
              <Card>
                <CardHeader title="Confusion Matrix" subtitle="Test set predictions" />
                <ConfusionMatrix data={metrics.confusion_matrix} title="" />
              </Card>
            )}

            <p className="text-xs text-gray-400">
              Metrics calculated on a held-out test set.
              {dataset === 'diabetes'
                ? ' Target: early readmission within 30 days (label derived from original readmitted column).'
                : ' Target: death during follow-up period. This is a separate task from readmission prediction.'}
            </p>
          </div>
        ) : null}
      </div>
    </Layout>
  )
}
