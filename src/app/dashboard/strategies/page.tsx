'use client'

import Link from 'next/link'
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

export default function StrategiesPage() {
  const { t } = useI18n()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-medium text-white mb-2">
            {t('dashboard.strategies.title') as string}
          </h1>
          <p className="text-sm text-zinc-400">
            {t('dashboard.strategies.description') as string}
          </p>
        </div>
        <Link
          href="/dashboard/strategy-builder"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.08] text-white rounded-lg text-sm font-medium hover:bg-white/[0.12] transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          {t('dashboard.strategies.newStrategy') as string}
        </Link>
      </div>

      {/* Empty State */}
      <div className="border border-white/[0.06] rounded-xl p-12 text-center">
        <div className="w-16 h-16 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
          <SparklesIcon className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-[16px] font-medium text-white mb-2">
          {t('dashboard.strategies.empty.title') as string}
        </h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
          {t('dashboard.strategies.empty.description') as string}
          <br />
          {t('dashboard.strategies.empty.example') as string}
        </p>
        <Link
          href="/dashboard/strategy-builder"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.08] text-white rounded-lg text-sm font-medium hover:bg-white/[0.12] transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          {t('dashboard.strategies.createStrategy') as string}
        </Link>
      </div>
    </div>
  )
}
