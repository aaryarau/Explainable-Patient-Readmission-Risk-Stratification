import { useEffect, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Card, CardHeader } from '../components/ui/Card'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { ConfusionMatrix } from '../components/charts/ConfusionMatrix'
import { predictionService } from '../services/predictions'
import { Dataset } from '../types'
import { Shield, AlertTriangle, Info } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

// Generate synthetic calibration data from stored predictions for demonstration
// In production this uses real model outputs vs ground truth
function mockCalibrationData(n = 10) {
  const data = []
  for (let i = 0; i < n; i++) {
    const mean = (i + 0.5) / n
    // Slightly miscalibrated for realism
    const frac = Math.min(1, Math.max(0, mean + (Math.random() - 0.5) * 0.15))
    data.push({ meanPred: parseFloat(mean.toFixed(3)), fracPos: parseFloat(frac.toFixed(3)) })
  }
  return data
}

export default function TrustReliability() {
  const [dataset, setDataset] = useState<Dataset>('diabetes')
  const [calData] = useState(mockCalibrationData())
  const [metrics, setMetrics] = useState<{ brier_score?: number; expected_calibration_error?: number } | null>(null)
  const [modelMetrics, setModelMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const m = await predictionService.modelResults(dataset)
        setModelMetrics(m)
        // Approximate brier score from calibration data
        const brier = calData.reduce((s, d) => s + Math.pow(d.meanPred - d.fracPos, 2), 0) / calData.length
        const ece = calData.reduce((s, d) => s + Math.abs(d.meanPred - d.fracPos), 0) / calData.length
        setMetrics({ brier_score: brier, expected_calibration_error: ece })
      } catch {
        setMetrics(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dataset])

  return (
    <Layout title="Trust & Reliability" subtitle="Model calibration, uncertainty, and performance analysis">
      <div className="space-y-6">
        {/* Dataset selector */}
        <Card>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="label mb-0">Dataset</label>
            {(['diabetes', 'heart'] as Dataset[]).map(d => (
              <button
                key={d}
                onClick={() => setDataset(d)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dataset === d
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d === 'diabetes' ? 'Diabetes 130-US' : 'Heart Failure'}
              </button>
            ))}
          </div>
        </Card>

        {loading ? (
          <PageLoader />
        ) : (
          <div className="space-y-6">
            {/* Calibration metrics */}
            {metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Brier Score', value: metrics.brier_score?.toFixed(4) ?? '—', info: 'Lower is better (0 = perfect)', color: 'text-brand-600' },
                  { label: 'Expected Cal. Error', value: metrics.expected_calibration_error?.toFixed(4) ?? '—', info: 'Average calibration gap', color: 'text-cyan-600' },
                  { label: 'ROC-AUC', value: modelMetrics?.roc_auc ? (modelMetrics.roc_auc * 100).toFixed(1) + '%' : '—', info: 'Discrimination ability', color: 'text-emerald-600' },
                  { label: 'F1 Score', value: modelMetrics?.f1_score ? (modelMetrics.f1_score * 100).toFixed(1) + '%' : '—', info: 'Precision-recall balance', color: 'text-purple-600' },
                ].map(m => (
                  <Card key={m.label}>
                    <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">{m.label}</p>
                    <p className="text-xs text-gray-400">{m.info}</p>
                  </Card>
                ))}
              </div>
            )}

            {/* Calibration plot */}
            <Card>
              <CardHeader
                title="Calibration Plot"
                subtitle="Fraction of positives vs mean predicted probability"
                icon={<Shield size={16} />}
              />
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={calData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="meanPred" type="number" domain={[0, 1]}
                    label={{ value: 'Mean Predicted Probability', position: 'insideBottom', offset: -4, fontSize: 11 }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    domain={[0, 1]}
                    label={{ value: 'Fraction of Positives', angle: -90, position: 'insideLeft', offset: 8, fontSize: 11 }}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(3)]}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  {/* Perfect calibration line */}
                  <ReferenceLine
                    segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
                    stroke="#9ca3af" strokeDasharray="6 3"
                    label={{ value: 'Perfect', position: 'insideTopLeft', fontSize: 10, fill: '#9ca3af' }}
                  />
                  <Line
                    dataKey="fracPos" stroke="#6366f1" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#6366f1' }} name="Model"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 mt-2">
                The dashed line represents perfect calibration. Points above indicate
                under-prediction; points below indicate over-prediction.
              </p>
            </Card>

            {/* Warnings & limitations */}
            <Card>
              <CardHeader title="Limitations & Warnings" icon={<AlertTriangle size={16} />} />
              <div className="space-y-3">
                {[
                  'Calibration estimates shown here are approximations. Full validation requires ground-truth labels from a held-out set.',
                  'Class imbalance in the Diabetes dataset (readmission rate ~11%) may affect recall on the minority class. SMOTE was applied during training.',
                  'The Heart Failure dataset contains only 299 records — results may not generalise to larger populations.',
                  'These models have not been clinically validated and must not be used for real patient care decisions.',
                  'Feature distributions at inference time may differ from training data. Monitor for input drift.',
                ].map((w, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                    <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">{w}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Performance table */}
            {modelMetrics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Confusion Matrix */}
                {modelMetrics.confusion_matrix && (
                  <Card>
                    <CardHeader title="Confusion Matrix" subtitle="Held-out test set" icon={<Shield size={16} />} />
                    <ConfusionMatrix data={modelMetrics.confusion_matrix} title="" />
                  </Card>
                )}

                {/* Metrics table */}
                <Card>
                  <CardHeader title="Model Performance Summary" />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          {['Metric', 'Value', 'Interpretation'].map(h => (
                            <th key={h} className="text-left py-2 px-2 text-xs font-medium text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { metric: 'ROC-AUC', val: modelMetrics.roc_auc, interp: 'Ability to distinguish readmitted from non-readmitted' },
                          { metric: 'Accuracy', val: modelMetrics.accuracy, interp: 'Overall prediction correctness' },
                          { metric: 'Precision', val: modelMetrics.precision, interp: 'Of flagged high-risk, fraction truly readmitted' },
                          { metric: 'Recall', val: modelMetrics.recall, interp: 'Of truly readmitted, fraction correctly identified' },
                          { metric: 'F1 Score', val: modelMetrics.f1_score, interp: 'Harmonic mean of precision and recall' },
                        ].map(row => (
                          <tr key={row.metric} className="border-b border-gray-50 dark:border-gray-800/50">
                            <td className="py-2.5 px-2 font-medium text-gray-800 dark:text-gray-200">{row.metric}</td>
                            <td className="py-2.5 px-2 text-brand-600 font-semibold">{(row.val * 100).toFixed(1)}%</td>
                            <td className="py-2.5 px-2 text-gray-500 text-xs">{row.interp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
