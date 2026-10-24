interface ProbabilityMeterProps {
  probability: number
  riskLevel: string
}

export function ProbabilityMeter({ probability, riskLevel }: ProbabilityMeterProps) {
  const pct = Math.round(probability * 100)
  const color =
    riskLevel === 'high' ? '#ef4444' : riskLevel === 'medium' ? '#f59e0b' : '#22c55e'

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashoffset = circumference * (1 - probability)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          {/* Track */}
          <circle
            cx="64" cy="64" r={radius}
            strokeWidth="12"
            className="stroke-gray-200 dark:stroke-gray-700"
            fill="none"
          />
          {/* Progress */}
          <circle
            cx="64" cy="64" r={radius}
            strokeWidth="12"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {pct}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">risk</span>
        </div>
      </div>
      <span
        className="mt-2 text-sm font-semibold px-3 py-0.5 rounded-full"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
      </span>
    </div>
  )
}
