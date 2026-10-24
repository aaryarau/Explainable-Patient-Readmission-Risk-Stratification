import { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { predictionService } from '../services/predictions'
import { WhatIfResponse, Dataset } from '../types'
import toast from 'react-hot-toast'
import { Sliders, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const DIABETES_BASE = {
  age: 5, time_in_hospital: 4, num_lab_procedures: 40, num_procedures: 1,
  num_medications: 15, number_inpatient: 1, number_emergency: 0,
  number_diagnoses: 7, insulin: 1, diabetesMed: 1,
}
const HEART_BASE = {
  age: 60, anaemia: 0, creatinine_phosphokinase: 250, diabetes: 0,
  ejection_fraction: 38, high_blood_pressure: 0, serum_creatinine: 1.1,
  serum_sodium: 137, sex: 1, smoking: 0, time: 130,
}

interface Scenario { feature: string; value: number }

export default function WhatIfSimulator() {
  const [dataset, setDataset] = useState<Dataset>('diabetes')
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { feature: 'number_inpatient', value: 0 },
  ])
  const [result, setResult] = useState<WhatIfResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const base = dataset === 'diabetes' ? DIABETES_BASE : HEART_BASE

  const addScenario = () => setScenarios(s => [...s, { feature: 'time_in_hospital', value: 2 }])
  const removeScenario = (i: number) => setScenarios(s => s.filter((_, idx) => idx !== i))
  const updateScenario = (i: number, key: keyof Scenario, val: string) =>
    setScenarios(s => s.map((sc, idx) => idx === i ? { ...sc, [key]: key === 'value' ? parseFloat(val) : val } : sc))

  const handleSimulate = async () => {
    setLoading(true)
    try {
      const res = await predictionService.whatIf(dataset, base, scenarios)
      setResult(res)
      toast.success('Simulation complete')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Simulation failed — ensure models are trained')
    } finally {
      setLoading(false)
    }
  }

  const chartData = result?.scenarios.map(s => ({
    name: s.feature.replace(/_/g, ' ').slice(0, 18),
    delta: s.probability_delta,
  })) || []

  return (
    <Layout title="What-If Simulator" subtitle="Change feature values and see how the model output shifts">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card>
          <CardHeader title="Scenarios" icon={<Sliders size={16} />} />
          <div className="mb-4">
            <label className="label">Dataset</label>
            <div className="flex gap-2">
              {(['diabetes', 'heart'] as Dataset[]).map(d => (
                <button
                  key={d}
                  onClick={() => { setDataset(d); setResult(null); setScenarios([{ feature: 'time_in_hospital', value: 2 }]) }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dataset === d
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d === 'diabetes' ? 'Diabetes 130-US' : 'Heart Failure'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {scenarios.map((sc, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="feature name"
                  value={sc.feature}
                  onChange={e => updateScenario(i, 'feature', e.target.value)}
                />
                <input
                  type="number"
                  className="input w-24"
                  value={sc.value}
                  step="any"
                  onChange={e => updateScenario(i, 'value', e.target.value)}
                />
                <button
                  onClick={() => removeScenario(i)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={addScenario} variant="secondary" size="sm" leftIcon={<Plus size={14} />}>
              Add Scenario
            </Button>
            <Button onClick={handleSimulate} isLoading={loading} size="sm" leftIcon={<Sliders size={14} />}>
              Simulate
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Scenarios modify the base patient values. Feature names must match the training feature list.
            Results show model output changes only — not clinical predictions.
          </p>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              <Card>
                <CardHeader title="Baseline vs Scenarios" />
                <div className="flex items-center gap-6 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Baseline</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(result.baseline_probability * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  {result.scenarios.map(s => (
                    <div
                      key={s.feature}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {s.feature.replace(/_/g, ' ')} = {String(s.new_value)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Original: {String(s.original_value)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{(s.probability * 100).toFixed(1)}%</p>
                        <p className={`text-xs font-medium flex items-center gap-0.5 ${
                          s.probability_delta > 0 ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {s.probability_delta > 0
                            ? <TrendingUp size={10} />
                            : <TrendingDown size={10} />}
                          {s.probability_delta > 0 ? '+' : ''}
                          {(s.probability_delta * 100).toFixed(1)} pp
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {chartData.length > 0 && (
                <Card>
                  <CardHeader title="Probability Delta by Feature" />
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ left: 0, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v * 100).toFixed(0)}pp`} />
                      <ReferenceLine y={0} stroke="#9ca3af" />
                      <Tooltip
                        formatter={(v: number) => [`${(v * 100).toFixed(2)} pp`, 'Δ Probability']}
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      />
                      <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
                        {chartData.map((d, i) => (
                          <Cell key={i} fill={d.delta > 0 ? '#ef4444' : '#22c55e'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sliders size={36} className="text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm text-gray-500">Define scenarios and click Simulate.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}
