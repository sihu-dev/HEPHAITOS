'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ============================================
// Credit Balance Types
// ============================================

export interface CreditWallet {
  id: string
  userId: string
  balance: number
  lifetimePurchased: number
  lifetimeSpent: number
  createdAt: Date
  updatedAt: Date
}

export interface CreditTransaction {
  id: string
  userId: string
  type: 'purchase' | 'spend' | 'refund' | 'bonus' | 'referral'
  amount: number
  balanceAfter: number
  feature?: string
  description?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export interface UseCreditBalanceResult {
  balance: number
  wallet: CreditWallet | null
  transactions: CreditTransaction[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  hasEnoughCredits: (required: number) => boolean
}

// ============================================
// Fallback Data (for development)
// ============================================

const FALLBACK_WALLET: CreditWallet = {
  id: 'fallback',
  userId: 'fallback-user',
  balance: 50, // Free signup bonus
  lifetimePurchased: 0,
  lifetimeSpent: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ============================================
// useCreditBalance Hook
// ============================================

export function useCreditBalance(): UseCreditBalanceResult {
  const [wallet, setWallet] = useState<CreditWallet | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Transform database row to CreditWallet
  const transformWallet = useCallback((row: Record<string, unknown>): CreditWallet => {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      balance: row.balance as number,
      lifetimePurchased: row.lifetime_purchased as number,
      lifetimeSpent: row.lifetime_spent as number,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    }
  }, [])

  // Transform database row to CreditTransaction
  const transformTransaction = useCallback((row: Record<string, unknown>): CreditTransaction => {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      type: row.type as CreditTransaction['type'],
      amount: row.amount as number,
      balanceAfter: row.balance_after as number,
      feature: row.feature as string | undefined,
      description: row.description as string | undefined,
      metadata: row.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(row.created_at as string),
    }
  }, [])

  // Fetch credit balance and recent transactions
  const fetchCreditData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl === 'REDACTED') {
        console.warn('[useCreditBalance] Supabase not configured, using fallback')
        setWallet(FALLBACK_WALLET)
        setTransactions([])
        return
      }

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        throw authError
      }

      if (!user) {
        setWallet(null)
        setTransactions([])
        return
      }

      // Fetch wallet and transactions in parallel
      const [walletResponse, transactionsResponse] = await Promise.all([
        supabase
          .from('credit_wallets')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      // Handle wallet
      if (walletResponse.error) {
        if (walletResponse.error.code === 'PGRST116') {
          // No wallet found - will be created by trigger on signup
          console.log('[useCreditBalance] No wallet found, using fallback')
          setWallet({ ...FALLBACK_WALLET, userId: user.id })
        } else {
          throw walletResponse.error
        }
      } else {
        setWallet(transformWallet(walletResponse.data))
      }

      // Handle transactions
      if (transactionsResponse.error) {
        console.warn('[useCreditBalance] Error fetching transactions:', transactionsResponse.error)
        setTransactions([])
      } else {
        setTransactions(
          (transactionsResponse.data || []).map(transformTransaction)
        )
      }
    } catch (err) {
      console.error('[useCreditBalance] Error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch credit balance'))
      // Use fallback on error
      setWallet(FALLBACK_WALLET)
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }, [supabase, transformWallet, transformTransaction])

  // Check if user has enough credits
  const hasEnoughCredits = useCallback((required: number): boolean => {
    return (wallet?.balance ?? 0) >= required
  }, [wallet])

  // Initial fetch
  useEffect(() => {
    fetchCreditData()
  }, [fetchCreditData])

  // Subscribe to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          fetchCreditData()
        } else {
          setWallet(null)
          setTransactions([])
          setIsLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchCreditData])

  // Real-time subscription for wallet updates
  useEffect(() => {
    if (!wallet?.userId) return

    const channel = supabase
      .channel('credit-wallet-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'credit_wallets',
          filter: `user_id=eq.${wallet.userId}`,
        },
        (payload) => {
          console.log('[useCreditBalance] Wallet updated:', payload)
          setWallet(transformWallet(payload.new as Record<string, unknown>))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, wallet?.userId, transformWallet])

  return {
    balance: wallet?.balance ?? 0,
    wallet,
    transactions,
    isLoading,
    error,
    refetch: fetchCreditData,
    hasEnoughCredits,
  }
}

// ============================================
// Feature Credit Costs
// ============================================

export const FEATURE_COSTS: Record<string, number> = {
  celebrity_mirror: 0,
  ai_tutor: 1,
  ai_strategy: 10,
  backtest_1y: 3,
  backtest_5y: 10,
  live_coaching_30m: 20,
  live_coaching_60m: 35,
  realtime_alert_1d: 5,
  realtime_alert_7d: 30,
  realtime_alert_30d: 100,
  portfolio_analysis: 5,
  risk_assessment: 5,
  market_report: 3,
}

export function getFeatureCost(feature: string): number {
  return FEATURE_COSTS[feature] ?? 0
}

export function formatCredits(credits: number): string {
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`
  }
  return credits.toString()
}
