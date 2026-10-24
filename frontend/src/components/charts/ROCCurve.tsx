import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'

interface ROCCurveProps {
  auc?: number
  dataset?: string
}

// Generate an approximate ROC curve from AUC using a parametric approximation
function generateROCData(auc: number) {
  const points = []
  for (let i = 0; i <= 100; i++) {
    const fpr = i / 100
    // Power model approximation: TPR ≈ FPR^(1/k) where k encodes AUC
    const k = Math.log(0.5) / Math.log(1 - auc)
    const tpr = Math.pow(fpr, 1 / k)
    points.push({ fpr: parseFloat(fpr.toFixed(2)), tpr: parseFloat(tpr.toFixed(4)) })
  }
  return points
}

export function ROCCurve({ auc = 0.8, dataset }: ROCCurveProps) {
  const data = generateROCData(auc)

  return (
    <div>
      {dataset && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          ROC Curve — {dataset.charAt(0).toUpperCase() + dataset.slice(1)} Dataset
        </p>
      )}
      <p className="text-xs text-gray-500 mb-3">AUC = {auc.toFixed(4)}</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="fpr" type="number" domain={[0, 1]}
            label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -4, fontSize: 11 }}
            tick={{ fontSize: 10 }} tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', offset: 8, fontSize: 11 }}
            tick={{ fontSize: 10 }} tickLine={false}
          />
          <Tooltip
            formatter={(val: number) => [val.toFixed(4)]}
            labelFormatter={l => `FPR: ${l}`}
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
          />
          <ReferenceLine x={0} y={0} stroke="transparent" />
          {/* Diagonal reference */}
          <Line
            dataKey={() => undefined}
            stroke="#9ca3af"
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="tpr"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={false}
            name="ROC Curve"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
