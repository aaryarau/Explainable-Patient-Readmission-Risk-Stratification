import { useEffect, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Card, CardHeader } from '../components/ui/Card'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { predictionService } from '../services/predictions'
import { AnalyticsSummary, TrendPoint } from '../types'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { formatPercent } from '../utils/formatters'

const COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

export default function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [dsDist, setDsDist] = useState<{ dataset: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, d] = await Promise.all([
          predictionService.analyticsSummary(),
          predictionService.analyticsTrends(30),
          fetch('/api/analytics/dataset-distribution', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }).then(r => r.json()),
        ])
        setSummary(s)
        setTrends(t.trends)
        setDsDist(d.distribution || [])
      } catch {
        // gracefully degrade
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const pieData = summary
    ? [
        { name: 'High', value: summary.risk_distribution.high, color: COLORS.high },
        { name: 'Medium', value: summary.risk_distribution.medium, color: COLORS.medium },
        { name: 'Low', value: summary.risk_distribution.low, color: COLORS.low },
      ]
    : []

  return (
    <Layout title="Analytics" subtitle="Dataset statistics and prediction activity">
      {loading ? (
        <PageLoader />
      ) : (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Predictions', value: summary?.total_predictions ?? 0 },
              { label: 'High Risk', value: summary?.risk_distribution.high ?? 0 },
              { label: 'Medium Risk', value: summary?.risk_distribution.medium ?? 0 },
              { label: 'This Week', value: summary?.predictions_last_7_days ?? 0 },
            ].map(s => (
              <Card key={s.label} className="text-center">
                <p className="text-3xl font-bold text-brand-600">{s.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend chart */}
            <Card className="lg:col-span-2">
              <CardHeader title="Prediction Trend (30 days)" icon={<BarChart3 size={16} />} />
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#grad)" name="Predictions" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-52 text-sm text-gray-400">
                  No prediction history yet.
                </div>
              )}
            </Card>

            {/* Risk pie */}
            <Card>
              <CardHeader title="Risk Distribution" />
              {pieData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-52 text-sm text-gray-400">No data.</div>
              )}
            </Card>
          </div>

          {/* Dataset distribution */}
          {dsDist.length > 0 && (
            <Card>
              <CardHeader title="Predictions by Dataset" />
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dsDist} margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="dataset" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Predictions" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Avg probability trend */}
          {trends.length > 0 && (
            <Card>
              <CardHeader title="Average Risk Probability Over Time" />
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tickFormatter={v => formatPercent(v)} tick={{ fontSize: 10 }} domain={[0, 1]} />
                  <Tooltip formatter={(v: number) => [formatPercent(v), 'Avg Probability']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="avg_probability" stroke="#ef4444" strokeWidth={2} fill="url(#probGrad)" name="Avg Probability" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}
    </Layout>
  )
}
