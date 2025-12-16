'use client'

import { memo } from 'react'
import Link from 'next/link'
import {
  PlusIcon,
  SparklesIcon,
  BeakerIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

const actionsConfig = [
  { icon: PlusIcon, labelKey: 'newStrategy', href: '/dashboard/builder/new' },
  { icon: SparklesIcon, labelKey: 'aiGenerate', href: '/dashboard/ai-strategy' },
  { icon: BeakerIcon, labelKey: 'backtest', href: '/dashboard/backtest' },
  { icon: LinkIcon, labelKey: 'connectExchange', href: '/dashboard/settings/exchanges' },
]

export const QuickActions = memo(function QuickActions() {
  const { t } = useI18n()

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {actionsConfig.map((action) => {
        const label = t(`dashboard.components.quickActions.${action.labelKey}`) as string
        return (
          <Link
            key={action.labelKey}
            href={action.href}
            className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-md transition-colors"
            title={label}
          >
            <action.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        )
      })}
    </div>
  )
})

QuickActions.displayName = 'QuickActions'
