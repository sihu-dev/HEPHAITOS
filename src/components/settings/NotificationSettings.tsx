'use client'

import { useState } from 'react'
import { BellIcon, EnvelopeIcon, DevicePhoneMobileIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

interface NotificationSetting {
  id: string
  labelKey: string
  descKey: string
  icon: React.ElementType
  enabled: boolean
}

export function NotificationSettings() {
  const { t } = useI18n()
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'trade_signals',
      labelKey: 'tradeSignals',
      descKey: 'tradeSignalsDesc',
      icon: BellIcon,
      enabled: true,
    },
    {
      id: 'trade_execution',
      labelKey: 'tradeExecution',
      descKey: 'tradeExecutionDesc',
      icon: ChatBubbleLeftRightIcon,
      enabled: true,
    },
    {
      id: 'email_notifications',
      labelKey: 'emailNotifications',
      descKey: 'emailNotificationsDesc',
      icon: EnvelopeIcon,
      enabled: false,
    },
    {
      id: 'push_notifications',
      labelKey: 'pushNotifications',
      descKey: 'pushNotificationsDesc',
      icon: DevicePhoneMobileIcon,
      enabled: true,
    },
  ])

  const toggleSetting = (id: string) => {
    setSettings(settings.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ))
  }

  return (
    <div className="border border-white/[0.06] rounded-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-medium text-white">{t('dashboard.settings.notifications.title') as string}</h2>
        </div>
      </div>

      <div className="space-y-2">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded border border-white/[0.06] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/[0.04] flex items-center justify-center">
                <setting.icon className="w-4 h-4 text-zinc-500" />
              </div>
              <div>
                <h3 className="text-sm text-white">{t(`dashboard.settings.notifications.${setting.labelKey}`) as string}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{t(`dashboard.settings.notifications.${setting.descKey}`) as string}</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => toggleSetting(setting.id)}
              title={setting.enabled ? t('dashboard.settings.notifications.enabled') as string : t('dashboard.settings.notifications.disabled') as string}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                setting.enabled ? 'bg-white/[0.2]' : 'bg-white/[0.06]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  setting.enabled ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
