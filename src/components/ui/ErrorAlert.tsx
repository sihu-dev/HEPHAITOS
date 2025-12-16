'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from './Button'
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  WifiIcon,
  ClockIcon,
  ShieldExclamationIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

// ============================================
// Types
// ============================================

export type ErrorType =
  | 'network'
  | 'timeout'
  | 'auth'
  | 'permission'
  | 'not_found'
  | 'rate_limit'
  | 'ai_error'
  | 'validation'
  | 'server'
  | 'generic'

export type ErrorSeverity = 'error' | 'warning' | 'info'

interface ErrorConfig {
  icon: ReactNode
  title: string
  description: string
  severity: ErrorSeverity
  retryable: boolean
}

interface ErrorAlertProps {
  type?: ErrorType
  title?: string
  description?: string
  severity?: ErrorSeverity
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

// ============================================
// Error Configurations (icons and metadata only - text from i18n)
// ============================================

const errorIcons: Record<ErrorType, ReactNode> = {
  network: <WifiIcon className="w-5 h-5" />,
  timeout: <ClockIcon className="w-5 h-5" />,
  auth: <ShieldExclamationIcon className="w-5 h-5" />,
  permission: <ShieldExclamationIcon className="w-5 h-5" />,
  not_found: <ExclamationCircleIcon className="w-5 h-5" />,
  rate_limit: <ClockIcon className="w-5 h-5" />,
  ai_error: <ExclamationTriangleIcon className="w-5 h-5" />,
  validation: <ExclamationCircleIcon className="w-5 h-5" />,
  server: <XCircleIcon className="w-5 h-5" />,
  generic: <ExclamationTriangleIcon className="w-5 h-5" />,
}

const errorMeta: Record<ErrorType, { severity: ErrorSeverity; retryable: boolean; translationKey: string }> = {
  network: { severity: 'error', retryable: true, translationKey: 'network' },
  timeout: { severity: 'warning', retryable: true, translationKey: 'timeout' },
  auth: { severity: 'error', retryable: false, translationKey: 'auth' },
  permission: { severity: 'warning', retryable: false, translationKey: 'permission' },
  not_found: { severity: 'warning', retryable: false, translationKey: 'notFound' },
  rate_limit: { severity: 'warning', retryable: true, translationKey: 'rateLimit' },
  ai_error: { severity: 'error', retryable: true, translationKey: 'aiError' },
  validation: { severity: 'warning', retryable: false, translationKey: 'validation' },
  server: { severity: 'error', retryable: true, translationKey: 'server' },
  generic: { severity: 'error', retryable: true, translationKey: 'generic' },
}

// ============================================
// Styles
// ============================================

const severityStyles: Record<ErrorSeverity, { bg: string; border: string; icon: string; text: string }> = {
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'text-red-500',
    text: 'text-red-200',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-500',
    text: 'text-amber-200',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-500',
    text: 'text-blue-200',
  },
}

// ============================================
// Component
// ============================================

export function ErrorAlert({
  type = 'generic',
  title,
  description,
  severity,
  onRetry,
  onDismiss,
  className = '',
}: ErrorAlertProps) {
  const { t } = useI18n()
  const meta = errorMeta[type]
  const effectiveSeverity = severity || meta.severity
  const styles = severityStyles[effectiveSeverity]

  const defaultTitle = t(`dashboard.errors.types.${meta.translationKey}.title`) as string
  const defaultDescription = t(`dashboard.errors.types.${meta.translationKey}.description`) as string

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-xl border ${styles.bg} ${styles.border} p-4 ${className}`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {errorIcons[type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${styles.text}`}>
            {title || defaultTitle}
          </h4>
          <p className="mt-1 text-sm text-zinc-400">
            {description || defaultDescription}
          </p>

          {/* Actions */}
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && meta.retryable && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRetry}
                  className={styles.text}
                >
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  {t('dashboard.errors.actions.retry') as string}
                </Button>
              )}
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="text-zinc-400"
                >
                  {t('dashboard.errors.actions.dismiss') as string}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// Specialized Error Alerts
// ============================================

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return <ErrorAlert type="network" onRetry={onRetry} />
}

export function AIError({ onRetry }: { onRetry?: () => void }) {
  return <ErrorAlert type="ai_error" onRetry={onRetry} />
}

export function RateLimitError() {
  return <ErrorAlert type="rate_limit" />
}

export function AuthError() {
  return <ErrorAlert type="auth" />
}

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return <ErrorAlert type="server" onRetry={onRetry} />
}

// ============================================
// Inline Error (for form fields)
// ============================================

export function InlineError({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="text-sm text-red-400 mt-1 flex items-center gap-1"
    >
      <ExclamationCircleIcon className="w-4 h-4" />
      {message}
    </motion.p>
  )
}

export default ErrorAlert
