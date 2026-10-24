interface ConfusionMatrixData {
  tn: number
  fp: number
  fn: number
  tp: number
}

interface ConfusionMatrixProps {
  data: ConfusionMatrixData
  title?: string
}

export function ConfusionMatrix({ data, title = 'Confusion Matrix' }: ConfusionMatrixProps) {
  const total = data.tn + data.fp + data.fn + data.tp
  const cells = [
    { label: 'True Negative', value: data.tn, color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', sub: 'Correctly predicted not readmitted' },
    { label: 'False Positive', value: data.fp, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300', sub: 'Incorrectly flagged as high risk' },
    { label: 'False Negative', value: data.fn, color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', sub: 'Missed readmission cases' },
    { label: 'True Positive', value: data.tp, color: 'bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-300', sub: 'Correctly predicted readmitted' },
  ]

  return (
    <div>
      {title && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{title}</p>
      )}

      {/* Axis labels */}
      <div className="flex">
        <div className="w-24" />
        <div className="flex-1 flex">
          <div className="flex-1 text-center text-xs font-medium text-gray-400 mb-1">Predicted: No</div>
          <div className="flex-1 text-center text-xs font-medium text-gray-400 mb-1">Predicted: Yes</div>
        </div>
      </div>

      <div className="flex items-stretch gap-0">
        {/* Y axis */}
        <div className="flex flex-col justify-around w-24">
          <div className="text-xs font-medium text-gray-400 text-right pr-2 leading-tight">Actual: No</div>
          <div className="text-xs font-medium text-gray-400 text-right pr-2 leading-tight">Actual: Yes</div>
        </div>

        {/* Grid */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          {cells.map((c) => (
            <div key={c.label} className={`p-4 rounded-xl ${c.color} text-center`}>
              <p className="text-2xl font-bold">{c.value.toLocaleString()}</p>
              <p className="text-xs font-semibold mt-0.5">{c.label}</p>
              <p className="text-xs opacity-70 mt-0.5 leading-tight">{c.sub}</p>
              <p className="text-xs font-medium mt-1">
                {total > 0 ? ((c.value / total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500">Precision</p>
          <p className="font-bold text-gray-900 dark:text-white">
            {data.tp + data.fp > 0
              ? `${((data.tp / (data.tp + data.fp)) * 100).toFixed(1)}%`
              : '—'}
          </p>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500">Recall</p>
          <p className="font-bold text-gray-900 dark:text-white">
            {data.tp + data.fn > 0
              ? `${((data.tp / (data.tp + data.fn)) * 100).toFixed(1)}%`
              : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
