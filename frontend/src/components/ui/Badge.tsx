import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
}

const variants = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variants[variant]
      )}
    >
      {children}
    </span>
  )
}

export function RiskBadge({ level }: { level: string }) {
  const map: Record<string, BadgeProps['variant']> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
  }
  return (
    <Badge variant={map[level] || 'default'}>
      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
    </Badge>
  )
}
