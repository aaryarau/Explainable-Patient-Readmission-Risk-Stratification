import { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { predictionService } from '../services/predictions'
import { CounterfactualResponse, Dataset } from '../types'
import toast from 'react-hot-toast'
import { FlaskConical, ArrowRight, CheckCircle, XCircle, TrendingDown } from 'lucide-react'
import { formatPercent } from '../utils/formatters'

const SAMPLE = {
  diabetes: {
    age: 5, time_in_hospital: 7, num_lab_procedures: 60, num_procedures: 2,
    num_medications: 22, number_outpatient: 0, number_emergency: 2,
    number_inpatient: 3, number_diagnoses: 9, insulin: 1, diabetesMed: 1,
    change: 1, A1Cresult: 2,
  },
  heart: {
    age: 75, anaemia: 1, creatinine_phosphokinase: 582, diabetes: 1,
    ejection_fraction: 14, high_blood_pressure: 1, platelets: 127000,
    serum_creatinine: 2.7, serum_sodium: 130, sex: 1, smoking: 1, time: 4,
  },
}

export default function CounterfactualLab() {
  const [dataset, setDataset] = useState<Dataset>('diabetes')
  const [targetProb, setTargetProb] = useState(0.25)
  const [maxChanges, setMaxChanges] = useState(5)
  const [result, setResult] = useState<CounterfactualResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await predictionService.counterfactual(
        dataset,
        SAMPLE[dataset],
        targetProb,
        maxChanges
      )
      setResult(res)
      toast.success('Counterfactual analysis complete')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Analysis failed — ensure models are trained')
    } finally {
      setLoading(false)
    }
  }

  const pctDiff =
    result
      ? Math.abs(result.original_probability - result.counterfactual_probability) * 100
      : 0

  return (
    <Layout title="Counterfactual Lab" subtitle="What would need to change to lower the predicted risk?">
      <div className="space-y-6">
        {/* Controls */}
        <Card>
          <CardHeader title="Scenario Parameters" icon={<FlaskConical size={16} />} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Dataset</label>
              <select
                className="input"
                value={dataset}
                onChange={e => { setDataset(e.target.value as Dataset); setResult(null) }}
              >
                <option value="diabetes">Diabetes 130-US</option>
                <option value="heart">Heart Failure</option>
              </select>
            </div>
            <div>
              <label className="label">Target Probability Threshold</label>
              <input
                type="number" className="input" min={0} max={1} step={0.05}
                value={targetProb}
                onChange={e => setTargetProb(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Max Features to Change</label>
              <input
                type="number" className="input" min={1} max={10}
                value={maxChanges}
                onChange={e => setMaxChanges(parseInt(e.target.value))}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleGenerate} isLoading={loading} leftIcon={<FlaskConical size={16} />}>
              Generate Counterfactual
            </Button>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
            Results are model-based scenario analysis only. Changing a feature value in a scenario
            does not guarantee that outcome in clinical reality.
          </p>
        </Card>

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary */}
            <Card>
              <CardHeader title="Risk Comparison" icon={<TrendingDown size={16} />} />
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <XCircle size={20} className="text-red-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Original Probability</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatPercent(result.original_probability)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight size={20} className="text-gray-400" />
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <CheckCircle size={20} className="text-green-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Counterfactual Probability</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPercent(result.counterfactual_probability)}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Probability Reduction</p>
                  <p className="text-xl font-bold text-brand-600">{pctDiff.toFixed(1)} pp</p>
                </div>
                <div className={`flex items-center gap-2 p-2 rounded-lg text-sm font-medium ${
                  result.target_achieved
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {result.target_achieved ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {result.target_achieved ? 'Target threshold achieved' : 'Could not reach target threshold'}
                </div>
              </div>
            </Card>

            {/* Changes */}
            <Card className="lg:col-span-2">
              <CardHeader
                title="Suggested Feature Changes"
                subtitle={`${result.changes.length} feature(s) modified in this scenario`}
              />
              {result.message && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                  {result.message}
                </div>
              )}
              {result.changes.length === 0 ? (
                <p className="text-sm text-gray-400">No feature changes were needed.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left py-2 text-xs font-medium text-gray-500">Feature</th>
                        <th className="text-right py-2 text-xs font-medium text-gray-500">Original</th>
                        <th className="text-right py-2 text-xs font-medium text-gray-500">Scenario</th>
                        <th className="text-right py-2 text-xs font-medium text-gray-500">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.changes.map(c => (
                        <tr
                          key={c.feature}
                          className="border-b border-gray-50 dark:border-gray-800/50"
                        >
                          <td className="py-2.5 font-medium text-gray-700 dark:text-gray-300">
                            {c.feature.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2.5 text-right text-gray-500">{c.original_value.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-medium">{c.counterfactual_value.toFixed(2)}</td>
                          <td className={`py-2.5 text-right font-medium ${c.delta < 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {c.delta > 0 ? '+' : ''}{c.delta.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4">
                These are hypothetical scenario values — not prescriptions or clinical recommendations.
                Results are based on the trained model only.
              </p>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
