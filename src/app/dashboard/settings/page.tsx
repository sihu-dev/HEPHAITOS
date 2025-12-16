'use client'

import dynamicImport from 'next/dynamic'
import { useI18n } from '@/i18n/client'

// Force dynamic rendering - prevent SSG
export const dynamic = 'force-dynamic'

const ExchangeSettings = dynamicImport(
  () => import('@/components/settings/ExchangeSettings').then(m => m.ExchangeSettings),
  { ssr: false }
)
const ProfileSettings = dynamicImport(
  () => import('@/components/settings/ProfileSettings').then(m => m.ProfileSettings),
  { ssr: false }
)
const NotificationSettings = dynamicImport(
  () => import('@/components/settings/NotificationSettings').then(m => m.NotificationSettings),
  { ssr: false }
)

export default function SettingsPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-base font-medium text-white">{t('dashboard.settings.title') as string}</h1>
        <p className="text-sm text-zinc-400 mt-0.5">{t('dashboard.settings.description') as string}</p>
      </div>
      <div className="h-px bg-white/[0.06]" />

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Exchange Connections */}
        <ExchangeSettings />

        {/* Profile Settings */}
        <ProfileSettings />

        {/* Notification Settings */}
        <NotificationSettings />
      </div>
    </div>
  )
}
