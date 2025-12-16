'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

// ============================================
// Types
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

// ============================================
// Context
// ============================================

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// ============================================
// Styles
// ============================================

const toastStyles: Record<ToastType, { icon: ReactNode; bg: string; border: string; iconColor: string }> = {
  success: {
    icon: <CheckCircleIcon className="w-5 h-5" />,
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    iconColor: 'text-green-500',
  },
  error: {
    icon: <ExclamationCircleIcon className="w-5 h-5" />,
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    iconColor: 'text-red-500',
  },
  warning: {
    icon: <ExclamationTriangleIcon className="w-5 h-5" />,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    iconColor: 'text-amber-500',
  },
  info: {
    icon: <InformationCircleIcon className="w-5 h-5" />,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    iconColor: 'text-blue-500',
  },
}

// ============================================
// Toast Item Component
// ============================================

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast
  onRemove: () => void
}) {
  const { t } = useI18n()
  const style = toastStyles[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`relative w-full max-w-sm rounded-xl border ${style.bg} ${style.border} backdrop-blur-xl shadow-2xl overflow-hidden`}
    >
      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-white/20"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      )}

      <div className="p-4 flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${style.iconColor}`} aria-hidden="true">
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            {toast.title}
          </p>
          {toast.description && (
            <p className="text-sm text-zinc-400 mt-1">
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick()
                onRemove()
              }}
              className={`text-sm font-medium mt-2 ${style.iconColor} hover:opacity-80 transition-opacity`}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 text-zinc-400 hover:text-white transition-colors"
          aria-label={t('dashboard.toast.closeLabel') as string}
        >
          <XMarkIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  )
}

// ============================================
// Provider
// ============================================

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Auto remove
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [removeToast])

  const success = useCallback((title: string, description?: string) => {
    addToast({ type: 'success', title, description })
  }, [addToast])

  const error = useCallback((title: string, description?: string) => {
    addToast({ type: 'error', title, description })
  }, [addToast])

  const warning = useCallback((title: string, description?: string) => {
    addToast({ type: 'warning', title, description })
  }, [addToast])

  const info = useCallback((title: string, description?: string) => {
    addToast({ type: 'info', title, description })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem
                toast={toast}
                onRemove={() => removeToast(toast.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// ============================================
// Standalone Toast Functions (for use without context)
// ============================================

let toastFunctions: ToastContextType | null = null

export function setToastFunctions(fns: ToastContextType) {
  toastFunctions = fns
}

export const toast = {
  success: (title: string, description?: string) => {
    toastFunctions?.success(title, description)
  },
  error: (title: string, description?: string) => {
    toastFunctions?.error(title, description)
  },
  warning: (title: string, description?: string) => {
    toastFunctions?.warning(title, description)
  },
  info: (title: string, description?: string) => {
    toastFunctions?.info(title, description)
  },
}

// ============================================
// Trade Alert Hook (Real-time trade alerts)
// For COPY feature - Celebrity trade alerts
// ============================================

interface TradeAlert {
  celebrityName: string
  action: 'buy' | 'sell'
  symbol: string
  stockName?: string
  value?: number
}

export function useTradeAlert() {
  const { addToast } = useToast()
  const { t } = useI18n()

  const showTradeAlert = useCallback((alert: TradeAlert) => {
    const isBuy = alert.action === 'buy'
    const actionText = isBuy ? t('dashboard.toast.tradeAlert.buy') as string : t('dashboard.toast.tradeAlert.sell') as string
    const valueText = alert.value ? ` - $${alert.value.toLocaleString()}` : ''

    addToast({
      type: isBuy ? 'success' : 'warning',
      title: `🔔 ${alert.celebrityName} ${actionText}`,
      description: `${alert.symbol}${alert.stockName ? ` (${alert.stockName})` : ''}${valueText}`,
      duration: 8000,
    })
  }, [addToast, t])

  return { showTradeAlert }
}

export default ToastProvider
