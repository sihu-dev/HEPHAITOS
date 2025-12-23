'use client'

import { useEffect, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { safeLogger } from '@/lib/utils/safe-logger';

export interface AnalyticsEvent {
  event: string
  properties?: Record<string, unknown>
}

declare global {
  interface Window {
    va?: (event: string, properties?: Record<string, unknown>) => void
    _hephaitosSessionId?: string
  }
}

// Supabase analytics_events 테이블 insert 타입
interface AnalyticsEventInsert {
  user_id: string | null
  session_id: string
  event_name: string
  event_type: string
  page_url: string | null
  referrer: string | null
  properties: Record<string, unknown>
  user_agent: string | null
}

// 세션 ID 생성/재사용
function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  if (!window._hephaitosSessionId) {
    window._hephaitosSessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
  return window._hephaitosSessionId
}

// Supabase에 이벤트 저장
async function saveEventToSupabase(
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const { data: { user } } = await supabase.auth.getUser()

    const eventData: AnalyticsEventInsert = {
      user_id: user?.id || null,
      session_id: getSessionId(),
      event_name: event,
      event_type: event.includes('_') ? event.split('_')[0] : 'custom',
      page_url: typeof window !== 'undefined' ? window.location.href : null,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
      properties: properties || {},
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    }

    await supabase.from('analytics_events').insert(eventData as any)
  } catch (error) {
    // 테이블이 없으면 조용히 실패 (마이그레이션 전)
    if (process.env.NODE_ENV === 'development') {
      safeLogger.info('[Analytics] Supabase save skipped:', error)
    }
  }
}

export function useAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track page views
  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    // Vercel Analytics
    if (typeof window !== 'undefined' && window.va) {
      window.va('pageview', { url })
    }

    // Supabase 저장
    saveEventToSupabase('page_view', { url, path: pathname })
  }, [pathname, searchParams])

  const track = useCallback((event: string, properties?: Record<string, unknown>) => {
    // Vercel Analytics
    if (typeof window !== 'undefined' && window.va) {
      window.va(event, properties)
    }

    // Supabase 저장
    saveEventToSupabase(event, properties)

    // Development 로그
    if (process.env.NODE_ENV === 'development') {
      safeLogger.info('[Analytics]', { event, properties })
    }
  }, [])

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
    safeLogger.info('[Analytics]', { event, properties })
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
