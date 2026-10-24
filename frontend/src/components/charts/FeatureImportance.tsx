import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { GlobalFeature } from '../../types'
import { truncateFeatureName } from '../../utils/formatters'

interface FeatureImportanceProps {
  features: GlobalFeature[]
  title?: string
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#10b981', '#14b8a6', '#f59e0b', '#f97316', '#ef4444',
]

export function FeatureImportance({ features, title = 'Global Feature Importance' }: FeatureImportanceProps) {
  const data = features.slice(0, 15).map(f => ({
    name: truncateFeatureName(f.feature),
    value: f.importance,
  }))

  return (
    <div>
      {title && <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{title}</p>}
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category" dataKey="name" width={150}
            tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
          />
          <Tooltip
            formatter={(val: number) => [val.toFixed(4), 'Importance']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
