'use client'

import { useState } from 'react'
import { UserIcon, EnvelopeIcon, ShieldCheckIcon, CheckIcon } from '@heroicons/react/24/outline'
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid'
import { useI18n } from '@/i18n/client'

export function ProfileSettings() {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'user@example.com',
  })
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
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
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('dashboard.settings.profile.namePlaceholder') as string}
              className="w-full h-9 pl-9 pr-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.settings.profile.email') as string}</label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              className="w-full h-9 pl-9 pr-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
            />
          </div>
        </div>

        {/* Plan Badge */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.settings.profile.plan') as string}</label>
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded border border-white/[0.06]">
            <div className="w-8 h-8 rounded bg-white/[0.06] flex items-center justify-center">
              <ShieldCheckIcon className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <span className="text-sm text-white">Pro Plan</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center justify-center gap-1.5 w-full h-9 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded text-sm transition-colors"
          >
            {isSaved ? (
              <>
                <CheckIcon className="w-3.5 h-3.5" />
                {t('dashboard.settings.profile.saved') as string}
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
