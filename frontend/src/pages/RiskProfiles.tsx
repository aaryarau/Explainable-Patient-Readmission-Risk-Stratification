import { useEffect, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Card, CardHeader } from '../components/ui/Card'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { predictionService } from '../services/predictions'
import { ClusterProfile, Dataset } from '../types'
import { TrendingUp, Users, Hash } from 'lucide-react'

const CLUSTER_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

export default function RiskProfiles() {
  const [dataset, setDataset] = useState<Dataset>('diabetes')
  const [profiles, setProfiles] = useState<ClusterProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async (d: Dataset) => {
    setLoading(true)
    setError('')
    try {
      const res = await predictionService.riskProfiles(d)
      setProfiles(res.profiles)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not load profiles — train models first')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(dataset) }, [dataset])

  const topFeatures = (centroid: Record<string, number>, n = 4) =>
    Object.entries(centroid)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, n)

  return (
    <Layout title="Risk Profiles" subtitle="Data-driven patient cohort discovery via K-Means clustering">
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <label className="label">Dataset</label>
              <div className="flex gap-2">
                {(['diabetes', 'heart'] as Dataset[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDataset(d)}
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
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Profiles are descriptive data-driven groups, not clinical diagnoses or validated
            risk categories. Cluster labels are generated from centroid statistics.
          </p>
        </Card>

        {loading ? (
          <PageLoader />
        ) : error ? (
          <Card>
            <p className="text-sm text-red-500">{error}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {profiles.map((p, idx) => (
              <Card key={p.cluster_id}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }}
                  >
                    {p.cluster_id}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      Profile {p.cluster_id}
                    </p>
                    <p className="text-xs text-gray-400">{p.risk_label} Risk Group</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users size={12} />
                    <span>{p.size.toLocaleString()} patients</span>
                  </div>
                </div>

                {/* Top centroid features */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Characteristic Features</p>
                  <div className="space-y-1.5">
                    {topFeatures(p.centroid).map(([feat, val]) => (
                      <div key={feat} className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400 truncate max-w-[140px]">
                          {feat.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {val.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color bar */}
                <div
                  className="mt-4 h-1 rounded-full opacity-40"
                  style={{ backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }}
                />
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
