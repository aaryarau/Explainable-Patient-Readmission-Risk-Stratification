import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { ShapFeature } from '../../types'
import { truncateFeatureName } from '../../utils/formatters'

interface ShapChartProps {
  features: ShapFeature[]
  title?: string
}

export function ShapChart({ features, title = 'Feature Contributions' }: ShapChartProps) {
  const data = features.map(f => ({
    name: truncateFeatureName(f.feature),
    value: f.shap_value,
    direction: f.direction,
  }))

  return (
    <div>
      {title && <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{title}</p>}
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category" dataKey="name" width={160}
            tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
          />
          <ReferenceLine x={0} stroke="#6b7280" strokeWidth={1} />
          <Tooltip
            formatter={(val: number) => [val.toFixed(4), 'SHAP value']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.value >= 0 ? '#ef4444' : '#22c55e'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-2">
        Red bars increase risk · Green bars decrease risk
      </p>
    </div>
  )
}
