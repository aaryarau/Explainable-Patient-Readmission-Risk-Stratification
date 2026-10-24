import { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ShapChart } from '../components/charts/ShapChart'
import { FeatureImportance } from '../components/charts/FeatureImportance'
import { predictionService } from '../services/predictions'
import { Dataset, ExplainResponse, GlobalFeature } from '../types'
import toast from 'react-hot-toast'
import { Brain, Info } from 'lucide-react'

const SAMPLE_DIABETES = {
  age: 5, time_in_hospital: 4, num_lab_procedures: 40, num_procedures: 1,
  num_medications: 15, number_outpatient: 0, number_emergency: 0,
  number_inpatient: 2, number_diagnoses: 7, insulin: 1,
  diabetesMed: 1, change: 1, A1Cresult: 0,
}

const SAMPLE_HEART = {
  age: 65, anaemia: 1, creatinine_phosphokinase: 582, diabetes: 0,
  ejection_fraction: 20, high_blood_pressure: 1, platelets: 265000,
  serum_creatinine: 1.9, serum_sodium: 130, sex: 1, smoking: 0, time: 4,
}

export default function ExplainablePredictions() {
  const [dataset, setDataset] = useState<Dataset>('diabetes')
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null)
  const [globalFeatures, setGlobalFeatures] = useState<GlobalFeature[]>([])
  const [loading, setLoading] = useState(false)

  const handleExplain = async () => {
    setLoading(true)
    const sample = dataset === 'diabetes' ? SAMPLE_DIABETES : SAMPLE_HEART
    try {
      const [exp, glob] = await Promise.all([
        predictionService.explain(dataset, sample),
        predictionService.globalImportance(dataset),
      ])
      setExplanation(exp)
      setGlobalFeatures(glob.features || [])
      toast.success('Explanation generated')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Explanation failed — ensure models are trained')
    } finally {
      setLoading(false)
    }
  }

  const humanReadable = (feature: string, val: number) => {
    const direction = val > 0 ? 'increases' : 'decreases'
    const name = feature.replace(/_/g, ' ')
    return `"${name}" contributed a SHAP value of ${val.toFixed(4)}, which ${direction} readmission risk in this model prediction. This is an association in the model, not a proven clinical cause.`
  }

  return (
    <Layout title="Explainable AI" subtitle="Why did the model predict this?">
      <div className="space-y-6">
        {/* Dataset selector */}
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Dataset</p>
              <div className="flex gap-2">
                {(['diabetes', 'heart'] as Dataset[]).map(d => (
                  <button
                    key={d}
                    onClick={() => { setDataset(d); setExplanation(null); setGlobalFeatures([]) }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      dataset === d
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {d === 'diabetes' ? 'Diabetes 130-US' : 'Heart Failure'}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleExplain} isLoading={loading} leftIcon={<Brain size={16} />}>
              Generate SHAP Explanation
            </Button>
          </div>
        </Card>

        {explanation && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Individual SHAP */}
            <Card>
              <CardHeader
                title="Individual Feature Contributions"
                subtitle="SHAP values for this prediction"
                icon={<Brain size={16} />}
              />
              <ShapChart features={explanation.top_features} />
              <div className="mt-4 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                <p className="text-xs font-medium text-brand-700 dark:text-brand-400 flex items-center gap-1 mb-1">
                  <Info size={12} /> How to read this
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Each bar shows a feature's contribution to the model's prediction. Red bars push
                  the prediction toward higher risk; green bars push toward lower risk.
                  These are model associations, not proven clinical causes.
                </p>
              </div>
            </Card>

            {/* Global importance */}
            <Card>
              <CardHeader
                title="Global Feature Importance"
                subtitle="Across all training data"
                icon={<Brain size={16} />}
              />
              {globalFeatures.length ? (
                <FeatureImportance features={globalFeatures} title="" />
              ) : (
                <p className="text-sm text-gray-400">Global importance not available.</p>
              )}
            </Card>

            {/* Narrative */}
            <Card className="lg:col-span-2">
              <CardHeader title="Plain-Language Explanation" subtitle="Top contributing factors" />
              <div className="space-y-2">
                {explanation.top_features.slice(0, 5).map(f => (
                  <div
                    key={f.feature}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${f.shap_value >= 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {humanReadable(f.feature, f.shap_value)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Base value (average model output): {explanation.base_value.toFixed(4)}.
                SHAP values are additive contributions from each feature on top of this base.
              </p>
            </Card>
          </div>
        )}

        {!explanation && !loading && (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Brain size={40} className="text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-sm text-gray-500">
                Select a dataset and click "Generate SHAP Explanation" to see why the model made
                its prediction.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Requires trained models. Run training scripts first.
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}
