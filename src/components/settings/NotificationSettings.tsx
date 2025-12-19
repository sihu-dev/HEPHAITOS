'use client'

import { useCallback } from 'react'
import { BellIcon, EnvelopeIcon, DevicePhoneMobileIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'
import { useUserSettings, type UserSettings } from '@/hooks/useUserSettings'

interface NotificationSettingItem {
  id: keyof Pick<UserSettings, 'notificationTradeSignals' | 'notificationTradeExecution' | 'notificationEmailDigest' | 'notificationPush'>
  labelKey: string
  descKey: string
  icon: React.ElementType
}

const notificationItems: NotificationSettingItem[] = [
  {
    id: 'notificationTradeSignals',
    labelKey: 'tradeSignals',
    descKey: 'tradeSignalsDesc',
    icon: BellIcon,
  },
  {
    id: 'notificationTradeExecution',
    labelKey: 'tradeExecution',
    descKey: 'tradeExecutionDesc',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    id: 'notificationEmailDigest',
    labelKey: 'emailNotifications',
    descKey: 'emailNotificationsDesc',
    icon: EnvelopeIcon,
  },
  {
    id: 'notificationPush',
    labelKey: 'pushNotifications',
    descKey: 'pushNotificationsDesc',
    icon: DevicePhoneMobileIcon,
  },
]

export function NotificationSettings() {
  const { t } = useI18n()
  const { settings, isLoading, updateSettings } = useUserSettings()

  const toggleSetting = useCallback(async (id: NotificationSettingItem['id']) => {
    const currentValue = settings[id]
    await updateSettings({ [id]: !currentValue })
  }, [settings, updateSettings])

  return (
    <div className="border border-white/[0.06] rounded-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-medium text-white">{t('dashboard.settings.notifications.title') as string}</h2>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          // Loading skeleton
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-white/[0.02] rounded border border-white/[0.06] animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white/[0.04]" />
                <div>
                  <div className="h-4 w-32 bg-white/[0.06] rounded mb-1" />
                  <div className="h-3 w-48 bg-white/[0.04] rounded" />
                </div>
              </div>
              <div className="w-9 h-5 rounded-full bg-white/[0.06]" />
            </div>
          ))
        ) : (
          notificationItems.map((item) => {
            const enabled = settings[item.id]
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded border border-white/[0.06] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white/[0.04] flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div>
                    <h3 className="text-sm text-white">{t(`dashboard.settings.notifications.${item.labelKey}`) as string}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{t(`dashboard.settings.notifications.${item.descKey}`) as string}</p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => toggleSetting(item.id)}
                  title={enabled ? t('dashboard.settings.notifications.enabled') as string : t('dashboard.settings.notifications.disabled') as string}
                  className={`relative w-9 h-5 rounded-full transition-colors ${
                    enabled ? 'bg-violet-500/40' : 'bg-white/[0.06]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                      enabled ? 'left-[18px] bg-violet-400' : 'left-0.5 bg-white'
                    }`}
                  />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
