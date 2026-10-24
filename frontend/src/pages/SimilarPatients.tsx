import { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { RiskBadge } from '../components/ui/Badge'
import { predictionService } from '../services/predictions'
import { Dataset, SimilarPatient } from '../types'
import toast from 'react-hot-toast'
import { Users } from 'lucide-react'
import { formatPercent } from '../utils/formatters'

const SAMPLE = {
  diabetes: {
    age: 5, time_in_hospital: 5, num_lab_procedures: 45, num_procedures: 1,
    num_medications: 18, number_outpatient: 0, number_emergency: 1,
    number_inpatient: 2, number_diagnoses: 8, insulin: 1,
    diabetesMed: 1, change: 1, A1Cresult: 0,
  },
  heart: {
    age: 65, anaemia: 1, creatinine_phosphokinase: 300, diabetes: 0,
    ejection_fraction: 25, high_blood_pressure: 1, platelets: 200000,
    serum_creatinine: 1.5, serum_sodium: 133, sex: 1, smoking: 0, time: 10,
  },
}

export default function SimilarPatients() {
  const [dataset, setDataset] = useState<Dataset>('diabetes')
  const [topK, setTopK] = useState(5)
  const [results, setResults] = useState<{ similar_patients: SimilarPatient[]; total_pool: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const res = await predictionService.similarPatients(dataset, SAMPLE[dataset], topK)
      setResults(res)
      toast.success(`Found ${res.similar_patients.length} similar patients`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Search failed — run predictions first to build history pool')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Similar Patients" subtitle="Find historically similar cases using nearest-neighbor retrieval">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Search Parameters" icon={<Users size={16} />} />
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="label">Dataset</label>
              <select
                className="input w-48"
                value={dataset}
                onChange={e => { setDataset(e.target.value as Dataset); setResults(null) }}
              >
                <option value="diabetes">Diabetes 130-US</option>
                <option value="heart">Heart Failure</option>
              </select>
            </div>
            <div>
              <label className="label">Top K</label>
              <input
                type="number" className="input w-24" min={1} max={20}
                value={topK} onChange={e => setTopK(parseInt(e.target.value))}
              />
            </div>
            <Button onClick={handleSearch} isLoading={loading} leftIcon={<Users size={16} />}>
              Find Similar Patients
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Similarity is computed using cosine distance on scaled feature vectors.
            Reference pool consists of previously saved predictions in the database.
          </p>
        </Card>

        {results && (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              Reference pool: {results.total_pool} saved predictions ·
              Showing top {results.similar_patients.length} matches
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.similar_patients.map(p => (
                <Card key={p.rank}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-400 text-xs font-bold">
                        #{p.rank}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Similar Patient
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Similarity</p>
                      <p className="text-sm font-bold text-brand-600">
                        {(p.similarity_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-3">
                    <div
                      className="bg-brand-600 h-1.5 rounded-full"
                      style={{ width: `${p.similarity_score * 100}%` }}
                    />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {p.probability !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Risk Probability</span>
                        <span className="font-medium">{formatPercent(p.probability as number)}</span>
                      </div>
                    )}
                    {p.risk_level && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Risk Level</span>
                        <RiskBadge level={p.risk_level as string} />
                      </div>
                    )}
                    {p.readmitted !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Readmitted</span>
                        <span className={`font-medium ${p.readmitted ? 'text-red-600' : 'text-green-600'}`}>
                          {p.readmitted ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Similar outcomes in historical records do not predict or guarantee the same outcome
              for the current patient. This tool surfaces associations, not prognoses.
            </p>
          </div>
        )}

        {!results && !loading && (
          <Card>
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Users size={40} className="text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-sm text-gray-500 max-w-sm">
                Run some predictions first to populate the history pool, then use this tool
                to find similar historical cases.
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}
