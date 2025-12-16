'use client'

import { useState, memo, useCallback } from 'react'
import { MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

export const DashboardHeader = memo(function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false)
  const { t } = useI18n()

  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => !prev)
  }, [])

  const closeNotifications = useCallback(() => {
    setShowNotifications(false)
  }, [])
  const unreadCount = 2

  return (
    <header className="sticky top-0 z-30 bg-[#0D0D0F] border-b border-white/[0.06]">
      <div className="flex items-center justify-between h-12 px-4">
        {/* Search */}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder={t('dashboard.header.search') as string}
              className="w-full h-8 pl-8 pr-3 rounded bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.12] transition-colors"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button
            type="button"
            onClick={toggleNotifications}
            className="relative w-8 h-8 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors"
            aria-label={t('dashboard.header.notifications') as string}
          >
            <BellIcon className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>

          {/* User */}
          <button
            type="button"
            className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-xs text-zinc-300"
          >
            U
          </button>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={closeNotifications}
          />
          <div className="absolute right-4 top-12 w-72 bg-[#111113] border border-white/[0.06] rounded-lg z-20">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
              <span className="text-sm font-medium text-white">{t('dashboard.header.notifications')}</span>
              <button type="button" className="text-xs text-zinc-400 hover:text-zinc-400">
                {t('dashboard.header.markAllRead')}
              </button>
            </div>
            <div className="py-1">
              <div className="px-3 py-2 hover:bg-white/[0.04] cursor-pointer">
                <p className="text-sm text-zinc-300">{t('dashboard.header.buySignal')}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{t('dashboard.header.justNow')}</p>
              </div>
              <div className="px-3 py-2 hover:bg-white/[0.04] cursor-pointer">
                <p className="text-sm text-zinc-300">{t('dashboard.header.backtestComplete')}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{t('dashboard.header.hourAgo')}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
})

DashboardHeader.displayName = 'DashboardHeader'
