import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizes = { sm: 16, md: 24, lg: 40 }
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 size={sizes[size]} className="animate-spin text-brand-600 dark:text-brand-400" />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" label="Loading..." />
    </div>
  )
}
