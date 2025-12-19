'use client'

import { useState, useEffect } from 'react'
import { UserIcon, EnvelopeIcon, ShieldCheckIcon, CheckIcon } from '@heroicons/react/24/outline'
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid'
import { useI18n } from '@/i18n/client'
import { useUserSettings } from '@/hooks/useUserSettings'

export function ProfileSettings() {
  const { t } = useI18n()
  const { settings, isLoading, updateProfile } = useUserSettings()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Sync form with settings
  useEffect(() => {
    if (!isLoading) {
      setFormData({
        name: settings.name || '',
        email: settings.email || '',
      })
    }
  }, [settings, isLoading])

  const handleSave = async () => {
    setIsSaving(true)
    const success = await updateProfile({ name: formData.name })
    setIsSaving(false)

    if (success) {
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    }
  }

  const planLabels: Record<string, string> = {
    free: 'Free Plan',
    pro: 'Pro Plan',
    enterprise: 'Enterprise Plan',
  }

  return (
    <div className="border border-white/[0.06] rounded-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-medium text-white">{t('dashboard.settings.profile.title') as string}</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{t('dashboard.settings.profile.name') as string}</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Name */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.settings.profile.name') as string}</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            {isLoading ? (
              <div className="w-full h-9 bg-white/[0.04] border border-white/[0.06] rounded animate-pulse" />
            ) : (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('dashboard.settings.profile.namePlaceholder') as string}
                className="w-full h-9 pl-9 pr-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
              />
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.settings.profile.email') as string}</label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            {isLoading ? (
              <div className="w-full h-9 bg-white/[0.04] border border-white/[0.06] rounded animate-pulse" />
            ) : (
              <input
                type="email"
                value={formData.email}
                disabled
                placeholder="email@example.com"
                className="w-full h-9 pl-9 pr-3 bg-white/[0.02] border border-white/[0.04] rounded text-sm text-zinc-400 cursor-not-allowed"
              />
            )}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">{t('dashboard.settings.profile.emailReadonly') as string || 'Email cannot be changed'}</p>
        </div>

        {/* Plan Badge */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.settings.profile.plan') as string}</label>
          {isLoading ? (
            <div className="h-14 bg-white/[0.02] rounded border border-white/[0.06] animate-pulse" />
          ) : (
            <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded border border-white/[0.06]">
              <div className={`w-8 h-8 rounded flex items-center justify-center ${
                settings.plan === 'pro' ? 'bg-violet-500/20' :
                settings.plan === 'enterprise' ? 'bg-amber-500/20' :
                'bg-white/[0.06]'
              }`}>
                <ShieldCheckIcon className={`w-4 h-4 ${
                  settings.plan === 'pro' ? 'text-violet-400' :
                  settings.plan === 'enterprise' ? 'text-amber-400' :
                  'text-zinc-400'
                }`} />
              </div>
              <div>
                <span className="text-sm text-white">{planLabels[settings.plan] || 'Free Plan'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="flex items-center justify-center gap-1.5 w-full h-9 bg-white/[0.08] hover:bg-white/[0.12] disabled:bg-white/[0.04] disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
          >
            {isSaved ? (
              <>
                <CheckIcon className="w-3.5 h-3.5" />
                {t('dashboard.settings.profile.saved') as string}
              </>
            ) : isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                {t('dashboard.settings.profile.save') as string}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
