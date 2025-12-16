'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export interface AnalyticsEvent {
  event: string
  properties?: Record<string, unknown>
}

declare global {
  interface Window {
    va?: (event: string, properties?: Record<string, unknown>) => void
  }
}

export function useAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track page views
  useEffect(() => {
    if (typeof window !== 'undefined' && window.va) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      window.va('pageview', { url })
    }
  }, [pathname, searchParams])

  const track = (event: string, properties?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && window.va) {
      window.va(event, properties)
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, properties)
    }
  }

  return { track }
}

// Convenience hooks for common events
export function usePageViewTracking() {
  useAnalytics()
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.va) {
    window.va(event, properties)
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, properties)
  }
}

// Common event trackers
export const analyticsEvents = {
  // Auth
  signUp: (method: string) => trackEvent('sign_up', { method }),
  signIn: (method: string) => trackEvent('sign_in', { method }),
  signOut: () => trackEvent('sign_out'),

  // Strategy
  strategyCreated: (strategyId: string, type: string) =>
    trackEvent('strategy_created', { strategyId, type }),
  strategyRun: (strategyId: string) => trackEvent('strategy_run', { strategyId }),
  strategyPaused: (strategyId: string) => trackEvent('strategy_paused', { strategyId }),

  // Backtest
  backtestStarted: (strategyId: string, period: string) =>
    trackEvent('backtest_started', { strategyId, period }),
  backtestCompleted: (strategyId: string, result: string) =>
    trackEvent('backtest_completed', { strategyId, result }),

  // Feedback
  feedbackSubmitted: (type: string, severity: string) =>
    trackEvent('feedback_submitted', { type, severity }),

  // Pricing
  packageViewed: (packageId: string) => trackEvent('package_viewed', { packageId }),
  packageSelected: (packageId: string, credits: number) =>
    trackEvent('package_selected', { packageId, credits }),

  // Engagement
  featureUsed: (feature: string) => trackEvent('feature_used', { feature }),
  tutorialCompleted: (step: number) => trackEvent('tutorial_completed', { step }),
}
