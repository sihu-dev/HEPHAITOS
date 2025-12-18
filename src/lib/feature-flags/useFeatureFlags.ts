'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

export interface FeatureFlag {
  key: string
  enabled: boolean
  variant?: string
  description?: string
}

// Feature flags for A/B testing and gradual rollout
const DEFAULT_FLAGS: Record<string, FeatureFlag> = {
  // UI/UX Experiments
  'new-dashboard-layout': {
    key: 'new-dashboard-layout',
    enabled: false,
    variant: 'control',
    description: 'New dashboard layout test',
  },
  'improved-onboarding': {
    key: 'improved-onboarding',
    enabled: false,
    variant: 'control',
    description: 'Improved onboarding flow',
  },
  'ai-strategy-assistant': {
    key: 'ai-strategy-assistant',
    enabled: true,
    variant: 'enabled',
    description: 'AI strategy assistant feature',
  },

  // Performance
  'realtime-updates': {
    key: 'realtime-updates',
    enabled: true,
    variant: 'websocket',
    description: 'WebSocket vs Polling for real-time updates',
  },

  // Monetization
  'credit-system-v2': {
    key: 'credit-system-v2',
    enabled: false,
    variant: 'control',
    description: 'New credit pricing model',
  },

  // Features
  'feedback-widget': {
    key: 'feedback-widget',
    enabled: true,
    variant: 'enabled',
    description: 'User feedback widget',
  },
  'password-strength-indicator': {
    key: 'password-strength-indicator',
    enabled: true,
    variant: 'enabled',
    description: 'Real-time password strength indicator',
  },
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>(DEFAULT_FLAGS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFlags = async () => {
      // Skip fetching if Supabase is not configured, use defaults
      if (!isSupabaseConfigured) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) {
          setIsLoading(false)
          return
        }

        // Try to fetch from Supabase (if feature_flags table exists)
        interface FeatureFlagRow {
          key: string
          enabled: boolean
          variant?: string
          description?: string
        }
        const { data, error } = await supabase
          .from('feature_flags')
          .select('*')
          .eq('is_active', true) as { data: FeatureFlagRow[] | null; error: Error | null }

        if (error) {
          // Table doesn't exist yet, use defaults
          console.log('[Feature Flags] Using default flags')
          setIsLoading(false)
          return
        }

        if (data) {
          const fetchedFlags: Record<string, FeatureFlag> = {}
          data.forEach((flag: FeatureFlagRow) => {
            fetchedFlags[flag.key] = {
              key: flag.key,
              enabled: flag.enabled,
              variant: flag.variant || 'control',
              description: flag.description,
            }
          })
          setFlags({ ...DEFAULT_FLAGS, ...fetchedFlags })
        }

        setIsLoading(false)
      } catch (err) {
        console.error('[Feature Flags] Error fetching flags:', err)
        setIsLoading(false)
      }
    }

    fetchFlags()
  }, [])

  const isEnabled = (key: string): boolean => {
    return flags[key]?.enabled ?? false
  }

  const getVariant = (key: string): string => {
    return flags[key]?.variant ?? 'control'
  }

  return { flags, isEnabled, getVariant, isLoading }
}
