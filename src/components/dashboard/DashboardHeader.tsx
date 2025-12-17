'use client'

import { useState, memo, useCallback } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationDropdown, NotificationBell } from '@/components/ui/NotificationDropdown'

export const DashboardHeader = memo(function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false)
  const { t } = useI18n()
  const { unreadCount } = useNotifications()

  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => !prev)
  }, [])

  const closeNotifications = useCallback(() => {
    setShowNotifications(false)
  }, [])

  // Open command palette on search click
  const openCommandPalette = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-command-palette'))
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-[#0D0D0F] border-b border-white/[0.06]">
      <div className="flex items-center justify-between h-12 px-4">
        {/* Search - Opens Command Palette */}
        <div className="flex-1 max-w-sm">
          <button
            type="button"
            onClick={openCommandPalette}
            className="w-full h-8 px-3 rounded bg-white/[0.04] border border-white/[0.06] text-sm text-zinc-600 text-left hover:border-white/[0.12] transition-colors flex items-center gap-2"
          >
            <MagnifyingGlassIcon className="w-4 h-4 text-zinc-500" />
            <span>{t('dashboard.header.search') as string}</span>
            <kbd className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-500">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-1 relative">
          {/* Notifications */}
          <NotificationBell
            onClick={toggleNotifications}
            unreadCount={unreadCount}
          />

          {/* Notification Dropdown */}
          <NotificationDropdown
            isOpen={showNotifications}
            onClose={closeNotifications}
          />

          {/* User */}
          <button
            type="button"
            className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-xs text-zinc-300"
          >
            U
          </button>
        </div>
      </div>
    </header>
  )
})

DashboardHeader.displayName = 'DashboardHeader'
