'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ============================================
// Subscription Types
// ============================================

export type PlanType = 'free' | 'starter' | 'pro' | 'team'
export type BillingCycle = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due'

export interface Subscription {
  id: string
  userId: string
  planId: PlanType
  billingCycle: BillingCycle
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  cancelledAt: Date | null
  paymentMethod: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UseSubscriptionResult {
  subscription: Subscription | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  updatePlan: (planId: PlanType, billingCycle?: BillingCycle) => Promise<boolean>
  cancelSubscription: () => Promise<boolean>
}

// ============================================
// Fallback Subscription (for development)
// ============================================

const FALLBACK_SUBSCRIPTION: Subscription = {
  id: 'fallback',
  userId: 'fallback-user',
  planId: 'free',
  billingCycle: 'monthly',
  status: 'active',
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  cancelAtPeriodEnd: false,
  cancelledAt: null,
  paymentMethod: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ============================================
// useSubscription Hook
// ============================================

export function useSubscription(): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Get supabase client - may be null if not configured
  const supabase = (() => {
    try {
      return createClient()
    } catch {
      return null
    }
  })()

  // Transform database row to Subscription object
  const transformSubscription = useCallback((row: Record<string, unknown>): Subscription => {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      planId: row.plan_id as PlanType,
      billingCycle: row.billing_cycle as BillingCycle,
      status: row.status as SubscriptionStatus,
      currentPeriodStart: new Date(row.current_period_start as string),
      currentPeriodEnd: new Date(row.current_period_end as string),
      cancelAtPeriodEnd: row.cancel_at_period_end as boolean,
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at as string) : null,
      paymentMethod: row.payment_method as string | null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    }
  }, [])

  // Fetch subscription data
  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if Supabase is configured
      if (!supabase) {
        console.warn('[useSubscription] Supabase not configured, using fallback')
        setSubscription(FALLBACK_SUBSCRIPTION)
        setIsLoading(false)
        return
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl === 'REDACTED') {
        console.warn('[useSubscription] Supabase not configured, using fallback')
        setSubscription(FALLBACK_SUBSCRIPTION)
        return
      }

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        throw authError
      }

      if (!user) {
        setSubscription(null)
        return
      }

      // Fetch subscription from database
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        // PGRST116: Row not found - create default subscription
        if (fetchError.code === 'PGRST116') {
          console.log('[useSubscription] No subscription found, using default')
          setSubscription({
            ...FALLBACK_SUBSCRIPTION,
            userId: user.id,
          })
          return
        }
        throw fetchError
      }

      setSubscription(transformSubscription(data))
    } catch (err) {
      console.error('[useSubscription] Error fetching subscription:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch subscription'))
      // Use fallback on error
      setSubscription(FALLBACK_SUBSCRIPTION)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, transformSubscription])

  // Update subscription plan
  const updatePlan = useCallback(async (
    planId: PlanType,
    billingCycle: BillingCycle = 'monthly'
  ): Promise<boolean> => {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured')
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Call RPC function to update subscription
      const { data, error } = await supabase.rpc('update_subscription', {
        p_user_id: user.id,
        p_plan_id: planId,
        p_billing_cycle: billingCycle,
      } as unknown as undefined)

      if (error) throw error

      const result = data as { success?: boolean; subscription?: Record<string, unknown> } | null
      if (result?.success && result?.subscription) {
        setSubscription(transformSubscription(result.subscription))
        return true
      }

      return false
    } catch (err) {
      console.error('[useSubscription] Error updating plan:', err)
      setError(err instanceof Error ? err : new Error('Failed to update plan'))
      return false
    }
  }, [supabase, transformSubscription])

  // Cancel subscription
  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured')
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase.rpc('cancel_subscription', {
        p_user_id: user.id,
      } as unknown as undefined)

      if (error) throw error

      const result = data as { success?: boolean; subscription?: Record<string, unknown> } | null
      if (result?.success && result?.subscription) {
        setSubscription(transformSubscription(result.subscription))
        return true
      }

      return false
    } catch (err) {
      console.error('[useSubscription] Error cancelling subscription:', err)
      setError(err instanceof Error ? err : new Error('Failed to cancel subscription'))
      return false
    }
  }, [supabase, transformSubscription])

  // Initial fetch
  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Subscribe to auth changes
  useEffect(() => {
    if (!supabase) return

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          fetchSubscription()
        } else {
          setSubscription(null)
          setIsLoading(false)
        }
      }
    )

    return () => {
      authSubscription.unsubscribe()
    }
  }, [supabase, fetchSubscription])

  return {
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription,
    updatePlan,
    cancelSubscription,
  }
}

// ============================================
// Plan Helpers
// ============================================

export interface PlanDetails {
  id: PlanType
  name: string
  nameKo: string
  monthlyPriceKrw: number
  monthlyPriceUsd: number
  yearlyPriceKrw: number
  yearlyPriceUsd: number
  features: string[]
  featuresKo: string[]
  limits: {
    strategies: number
    backtests: number
    alerts: number
  }
}

export const PLANS: Record<PlanType, PlanDetails> = {
  free: {
    id: 'free',
    name: 'Free',
    nameKo: '무료',
    monthlyPriceKrw: 0,
    monthlyPriceUsd: 0,
    yearlyPriceKrw: 0,
    yearlyPriceUsd: 0,
    features: ['50 free credits', 'Basic AI strategy', '3 strategies'],
    featuresKo: ['50 무료 크레딧', '기본 AI 전략', '3개 전략'],
    limits: { strategies: 3, backtests: 5, alerts: 1 },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    nameKo: '스타터',
    monthlyPriceKrw: 9900,
    monthlyPriceUsd: 7.99,
    yearlyPriceKrw: 99000,
    yearlyPriceUsd: 79.99,
    features: ['100 credits/month', 'All AI features', '10 strategies'],
    featuresKo: ['월 100 크레딧', '모든 AI 기능', '10개 전략'],
    limits: { strategies: 10, backtests: 20, alerts: 5 },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    nameKo: '프로',
    monthlyPriceKrw: 29900,
    monthlyPriceUsd: 24.99,
    yearlyPriceKrw: 299000,
    yearlyPriceUsd: 249.99,
    features: ['500 credits/month', 'Priority support', 'Unlimited strategies'],
    featuresKo: ['월 500 크레딧', '우선 지원', '무제한 전략'],
    limits: { strategies: -1, backtests: -1, alerts: 20 },
  },
  team: {
    id: 'team',
    name: 'Team',
    nameKo: '팀',
    monthlyPriceKrw: 99000,
    monthlyPriceUsd: 79.99,
    yearlyPriceKrw: 990000,
    yearlyPriceUsd: 799.99,
    features: ['2000 credits/month', 'Team management', 'Custom integrations'],
    featuresKo: ['월 2000 크레딧', '팀 관리', '커스텀 연동'],
    limits: { strategies: -1, backtests: -1, alerts: -1 },
  },
}

export function getPlanById(planId: PlanType): PlanDetails {
  return PLANS[planId] || PLANS.free
}

export function getDaysRemaining(periodEnd: Date): number {
  const now = new Date()
  const diff = periodEnd.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
