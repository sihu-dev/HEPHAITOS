'use client'

// ============================================
// useUserSettings Hook
// Supabase 연동 사용자 설정 관리
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { UserSettings as SupabaseUserSettings, Profile } from '@/lib/supabase/types'

export interface UserSettings {
  // Profile
  name: string | null
  email: string
  avatarUrl: string | null
  plan: 'free' | 'pro' | 'enterprise'

  // Notifications
  notificationTradeSignals: boolean
  notificationTradeExecution: boolean
  notificationEmailDigest: boolean
  notificationPush: boolean

  // Preferences
  defaultExchange: string | null
  theme: 'dark' | 'light' | 'system'
  language: string
  timezone: string
}

interface UseUserSettingsReturn {
  settings: UserSettings
  isLoading: boolean
  error: Error | null
  updateSettings: (updates: Partial<UserSettings>) => Promise<boolean>
  updateProfile: (updates: { name?: string; avatarUrl?: string }) => Promise<boolean>
  refetch: () => Promise<void>
}

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  name: null,
  email: '',
  avatarUrl: null,
  plan: 'free',

  notificationTradeSignals: true,
  notificationTradeExecution: true,
  notificationEmailDigest: false,
  notificationPush: true,

  defaultExchange: null,
  theme: 'dark',
  language: 'ko',
  timezone: 'Asia/Seoul',
}

export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSettings = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSettings(DEFAULT_SETTINGS)
      setIsLoading(false)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setSettings(DEFAULT_SETTINGS)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSettings(DEFAULT_SETTINGS)
        setIsLoading(false)
        return
      }

      // Fetch profile and settings in parallel
      const [profileResult, settingsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
      ])

      const profile = profileResult.data as Profile | null
      const userSettings = settingsResult.data as SupabaseUserSettings | null

      setSettings({
        name: profile?.name || null,
        email: profile?.email || user.email || '',
        avatarUrl: profile?.avatar_url || null,
        plan: profile?.plan || 'free',

        notificationTradeSignals: userSettings?.notification_trade_signals ?? true,
        notificationTradeExecution: userSettings?.notification_trade_execution ?? true,
        notificationEmailDigest: userSettings?.notification_email_digest ?? false,
        notificationPush: userSettings?.notification_push ?? true,

        defaultExchange: userSettings?.default_exchange || null,
        theme: (userSettings?.theme as UserSettings['theme']) || 'dark',
        language: userSettings?.language || 'ko',
        timezone: userSettings?.timezone || 'Asia/Seoul',
      })
    } catch (err) {
      console.error('[useUserSettings] Fetch error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch settings'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update settings (user_settings table)
  const updateSettings = useCallback(async (updates: Partial<UserSettings>): Promise<boolean> => {
    if (!isSupabaseConfigured) return false

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return false

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const updateData: Record<string, unknown> = {}

      if (updates.notificationTradeSignals !== undefined) {
        updateData.notification_trade_signals = updates.notificationTradeSignals
      }
      if (updates.notificationTradeExecution !== undefined) {
        updateData.notification_trade_execution = updates.notificationTradeExecution
      }
      if (updates.notificationEmailDigest !== undefined) {
        updateData.notification_email_digest = updates.notificationEmailDigest
      }
      if (updates.notificationPush !== undefined) {
        updateData.notification_push = updates.notificationPush
      }
      if (updates.defaultExchange !== undefined) {
        updateData.default_exchange = updates.defaultExchange
      }
      if (updates.theme !== undefined) {
        updateData.theme = updates.theme
      }
      if (updates.language !== undefined) {
        updateData.language = updates.language
      }
      if (updates.timezone !== undefined) {
        updateData.timezone = updates.timezone
      }

      if (Object.keys(updateData).length === 0) return true

      const { error: updateError } = await supabase
        .from('user_settings')
        .update(updateData as never)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      setSettings(prev => ({ ...prev, ...updates }))
      return true
    } catch (err) {
      console.error('[useUserSettings] Update error:', err)
      return false
    }
  }, [])

  // Update profile (profiles table)
  const updateProfile = useCallback(async (updates: { name?: string; avatarUrl?: string }): Promise<boolean> => {
    if (!isSupabaseConfigured) return false

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return false

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const updateData: Record<string, unknown> = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl

      if (Object.keys(updateData).length === 0) return true

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData as never)
        .eq('id', user.id)

      if (updateError) throw updateError

      setSettings(prev => ({
        ...prev,
        name: updates.name ?? prev.name,
        avatarUrl: updates.avatarUrl ?? prev.avatarUrl,
      }))
      return true
    } catch (err) {
      console.error('[useUserSettings] Profile update error:', err)
      return false
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    updateProfile,
    refetch: fetchSettings,
  }
}
