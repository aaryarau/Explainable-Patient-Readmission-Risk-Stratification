import { AlertCircle } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 mb-4">
        <AlertCircle size={32} />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {message && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">{message}</p>
      )}
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm" className="mt-4">
          Try again
        </Button>
      )}
    </div>
  )
}
