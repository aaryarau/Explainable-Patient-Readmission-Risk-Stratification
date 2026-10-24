import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { ClusterPoint } from '../../types'

interface ClusterScatterProps {
  data: ClusterPoint[]
  nClusters?: number
}

const CLUSTER_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316']

export function ClusterScatter({ data, nClusters = 5 }: ClusterScatterProps) {
  if (!data.length) return <p className="text-sm text-gray-400">No cluster data available.</p>

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="x" type="number" tick={{ fontSize: 10 }} tickLine={false} name="PC1" />
        <YAxis dataKey="y" type="number" tick={{ fontSize: 10 }} tickLine={false} name="PC2" />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={({ payload }) => {
            if (!payload?.length) return null
            const d = payload[0].payload as ClusterPoint
            return (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs shadow">
                <p>Cluster {d.cluster}</p>
                <p>PC1: {d.x.toFixed(2)}</p>
                <p>PC2: {d.y.toFixed(2)}</p>
              </div>
            )
          }}
        />
        <Scatter name="Patients" data={data}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={CLUSTER_COLORS[entry.cluster % CLUSTER_COLORS.length]}
              fillOpacity={0.7}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}
