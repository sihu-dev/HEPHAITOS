'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // Log to console
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          showDetails={this.props.showDetails}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  onReset: () => void
  showDetails?: boolean
}

function ErrorFallback({ error, errorInfo, onReset, showDetails = false }: ErrorFallbackProps) {
  const { t } = useI18n()

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-white mb-2">
          {t('dashboard.errors.boundary.title') as string}
        </h2>

        {/* Description */}
        <p className="text-zinc-400 mb-6">
          {t('dashboard.errors.boundary.description') as string}
        </p>

        {/* Error Details (Dev mode) */}
        {showDetails && error && (
          <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-left overflow-auto max-h-48">
            <p className="text-red-400 text-sm font-mono mb-2">
              {error.name}: {error.message}
            </p>
            {errorInfo?.componentStack && (
              <pre className="text-zinc-500 text-xs font-mono whitespace-pre-wrap">
                {errorInfo.componentStack}
              </pre>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-[#4F5ABF] text-white rounded-lg font-medium text-sm transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            {t('dashboard.errors.boundary.retry') as string}
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium text-sm transition-colors"
          >
            <HomeIcon className="w-4 h-4" />
            {t('dashboard.errors.boundary.home') as string}
          </a>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary
