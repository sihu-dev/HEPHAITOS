'use client'

import { useI18n } from '@/i18n/client'

// ============================================
// Spinner
// ============================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const { t } = useI18n()
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
  }

  return (
    <div
      className={`${sizes[size]} border-white/[0.1] border-t-white/60 rounded-full animate-spin ${className}`}
      role="status"
      aria-label={t('dashboard.loading.loadingAria') as string}
    />
  )
}

// ============================================
// Full Page Loading
// ============================================

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message }: PageLoadingProps) {
  const { t } = useI18n()
  const displayMessage = message || (t('dashboard.loading.default') as string)
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0F]">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-3" />
        <p className="text-sm text-zinc-400">{displayMessage}</p>
      </div>
    </div>
  )
}

// ============================================
// Card Loading Skeleton
// ============================================

interface CardSkeletonProps {
  count?: number
  className?: string
}

export function CardSkeleton({ count = 1, className = '' }: CardSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-white/[0.04] rounded" />
            <div className="flex-1">
              <div className="h-3 bg-white/[0.04] rounded w-3/4 mb-2" />
              <div className="h-2.5 bg-white/[0.04] rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2.5 bg-white/[0.04] rounded w-full" />
            <div className="h-2.5 bg-white/[0.04] rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================
// Table Loading Skeleton
// ============================================

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({ rows = 5, columns = 4, className = '' }: TableSkeletonProps) {
  return (
    <div className={`bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-white/[0.06] flex gap-3 animate-pulse">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 h-3 bg-white/[0.04] rounded" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="p-3 border-b border-white/[0.04] last:border-0 flex gap-3 animate-pulse"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="flex-1 h-3 bg-white/[0.04] rounded"
              style={{ width: `${60 + Math.random() * 40}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ============================================
// Chart Loading Skeleton
// ============================================

interface ChartSkeletonProps {
  height?: number
  className?: string
}

export function ChartSkeleton({ height = 300, className = '' }: ChartSkeletonProps) {
  return (
    <div
      className={`bg-white/[0.02] rounded-lg border border-white/[0.06] p-4 animate-pulse ${className}`}
      style={{ height }}
    >
      <div className="h-full flex items-end gap-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-white/[0.04] rounded-t"
            style={{ height: `${20 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================
// Inline Loading
// ============================================

interface InlineLoadingProps {
  text?: string
  className?: string
}

export function InlineLoading({ text, className = '' }: InlineLoadingProps) {
  const { t } = useI18n()
  const displayText = text || (t('dashboard.loading.inline') as string)
  return (
    <div className={`inline-flex items-center gap-2 text-sm text-zinc-500 ${className}`}>
      <Spinner size="sm" />
      <span>{displayText}</span>
    </div>
  )
}

// ============================================
// Button Loading
// ============================================

interface ButtonLoadingProps {
  children: React.ReactNode
  isLoading: boolean
  loadingText?: string
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export function ButtonLoading({
  children,
  isLoading,
  loadingText,
  className = '',
  disabled,
  onClick,
  type = 'button',
}: ButtonLoadingProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center gap-2 ${className} ${
        isLoading ? 'cursor-not-allowed' : ''
      }`}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" />
          {loadingText && <span className="ml-2">{loadingText}</span>}
        </span>
      )}
      <span className={isLoading ? 'invisible' : ''}>{children}</span>
    </button>
  )
}

// ============================================
// Shimmer Effect Component
// ============================================

interface ShimmerProps {
  className?: string
}

export function Shimmer({ className = '' }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
    </div>
  )
}

// ============================================
// Data Loading Empty State
// ============================================

function DataLoadingEmptyState() {
  const { t } = useI18n()
  return (
    <div className="p-6 text-center">
      <p className="text-sm text-zinc-400">{t('dashboard.loading.noData') as string}</p>
    </div>
  )
}

// ============================================
// Data Loading Container
// ============================================

interface DataLoadingContainerProps<T> {
  data: T | null | undefined
  isLoading: boolean
  error: string | null
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
  children: (data: T) => React.ReactNode
}

export function DataLoadingContainer<T>({
  data,
  isLoading,
  error,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
}: DataLoadingContainerProps<T>) {
  if (isLoading) {
    return <>{loadingComponent || <CardSkeleton count={3} />}</>
  }

  if (error) {
    return (
      <>
        {errorComponent || (
          <div className="p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </>
    )
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <>
        {emptyComponent || (
          <DataLoadingEmptyState />
        )}
      </>
    )
  }

  return <>{children(data)}</>
}

const LoadingStates = {
  Spinner,
  PageLoading,
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  InlineLoading,
  ButtonLoading,
  Shimmer,
  DataLoadingContainer,
}

export default LoadingStates
