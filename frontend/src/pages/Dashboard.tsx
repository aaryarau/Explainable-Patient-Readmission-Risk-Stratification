import { useEffect, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { predictionService } from '../services/predictions'
import { AnalyticsSummary, TrendPoint } from '../types'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Activity, TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react'
import { formatDate } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

const RISK_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t] = await Promise.all([
          predictionService.analyticsSummary(),
          predictionService.analyticsTrends(30),
        ])
        setSummary(s)
        setTrends(t.trends)
      } catch {
        // API not yet connected — show empty state gracefully
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const pieData = summary
    ? [
        { name: 'High Risk', value: summary.risk_distribution.high, color: RISK_COLORS.high },
        { name: 'Medium Risk', value: summary.risk_distribution.medium, color: RISK_COLORS.medium },
        { name: 'Low Risk', value: summary.risk_distribution.low, color: RISK_COLORS.low },
      ]
    : []

  return (
    <Layout title="Dashboard" subtitle="Overview of prediction activity and system health">
      {loading ? (
        <PageLoader />
      ) : (
        <div className="space-y-6">
          {/* Welcome */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Welcome back, {user?.full_name || user?.username}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Here's what's happening with your patient predictions.
              </p>
            </div>
            <Badge variant="info">{user?.role}</Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Predictions',
                value: summary?.total_predictions ?? '—',
                icon: BarChart3,
                color: 'text-brand-600',
                bg: 'bg-brand-50 dark:bg-brand-900/20',
              },
              {
                label: 'High Risk Cases',
                value: summary?.risk_distribution.high ?? '—',
                icon: AlertTriangle,
                color: 'text-red-600',
                bg: 'bg-red-50 dark:bg-red-900/20',
              },
              {
                label: 'Low Risk Cases',
                value: summary?.risk_distribution.low ?? '—',
                icon: CheckCircle,
                color: 'text-green-600',
                bg: 'bg-green-50 dark:bg-green-900/20',
              },
              {
                label: 'Last 7 Days',
                value: summary?.predictions_last_7_days ?? '—',
                icon: TrendingUp,
                color: 'text-amber-600',
                bg: 'bg-amber-50 dark:bg-amber-900/20',
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${bg}`}>
                    <Icon size={20} className={color} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend */}
            <Card className="lg:col-span-2">
              <CardHeader title="Prediction Activity" subtitle="Last 30 days" icon={<Activity size={16} />} />
              {trends.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Area
                      type="monotone" dataKey="count" stroke="#6366f1"
                      strokeWidth={2} fill="url(#colorCount)" name="Predictions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-52 text-sm text-gray-400">
                  No prediction data yet. Run your first analysis to see trends.
                </div>
              )}
            </Card>

            {/* Risk distribution */}
            <Card>
              <CardHeader title="Risk Distribution" icon={<AlertTriangle size={16} />} />
              {pieData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData} dataKey="value" cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80} paddingAngle={3}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-52 text-sm text-gray-400">
                  No risk data yet.
                </div>
              )}
            </Card>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-4">
            This application is developed for academic and research purposes. Its outputs are
            machine-learning predictions and must not be used as a substitute for professional
            medical judgment.
          </p>
        </div>
      )}
    </Layout>
  )
}
