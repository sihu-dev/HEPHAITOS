'use client'

// ============================================
// Sonner Toast Provider
// 현대적인 토스트 알림 시스템
// ============================================

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#18181b',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          color: '#fafafa',
          fontSize: '13px',
        },
        classNames: {
          toast: 'font-sans',
          title: 'text-white font-medium',
          description: 'text-zinc-400',
          success: '[&>div>svg]:text-emerald-400',
          error: '[&>div>svg]:text-red-400',
          warning: '[&>div>svg]:text-amber-400',
          info: '[&>div>svg]:text-blue-400',
        },
      }}
      richColors
      closeButton
      duration={4000}
    />
  )
}

// ============================================
// Re-export toast function for convenience
// ============================================

export { toast } from 'sonner'

// ============================================
// Custom toast helpers
// ============================================

import { toast } from 'sonner'

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, { description })
  },
  error: (message: string, description?: string) => {
    toast.error(message, { description })
  },
  warning: (message: string, description?: string) => {
    toast.warning(message, { description })
  },
  info: (message: string, description?: string) => {
    toast.info(message, { description })
  },
  loading: (message: string) => {
    return toast.loading(message)
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return toast.promise(promise, messages)
  },
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId)
  },
}

// ============================================
// Trading-specific toast helpers
// Uses English defaults - for i18n, use Toast.tsx with useI18n hook
// ============================================

export const tradingToast = {
  orderPlaced: (side: 'buy' | 'sell', symbol: string, quantity: number) => {
    const action = side === 'buy' ? 'Buy' : 'Sell'
    const color = side === 'buy' ? '🟢' : '🔴'
    toast.success(`${color} ${action} Order Placed`, {
      description: `${symbol} ${quantity} shares`,
    })
  },
  orderFilled: (side: 'buy' | 'sell', symbol: string, price: number) => {
    const action = side === 'buy' ? 'Buy' : 'Sell'
    toast.success(`${action} Order Filled`, {
      description: `${symbol} @ $${price.toLocaleString()}`,
    })
  },
  orderCancelled: (symbol: string) => {
    toast.info('Order Cancelled', {
      description: `${symbol} order has been cancelled`,
    })
  },
  strategyStarted: (strategyName: string) => {
    toast.success('Strategy Started', {
      description: strategyName,
    })
  },
  strategyStopped: (strategyName: string) => {
    toast.info('Strategy Stopped', {
      description: strategyName,
    })
  },
  backtestComplete: (strategyName: string, returnPercent: number) => {
    toast.success('Backtest Complete', {
      description: `${strategyName}: ${returnPercent >= 0 ? '+' : ''}${returnPercent.toFixed(2)}%`,
    })
  },
  alert: (message: string, type: 'price' | 'indicator' | 'news' = 'price') => {
    const icons = {
      price: '💰',
      indicator: '📊',
      news: '📰',
    }
    toast.info(`${icons[type]} Alert`, {
      description: message,
    })
  },
}
