'use client'

import { UserGroupIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

export default function CopyTradingPage() {
  const { t } = useI18n()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] font-medium text-white mb-2">
          {t('dashboard.copyTrading.title') as string}
        </h1>
        <p className="text-sm text-zinc-400">
          {t('dashboard.copyTrading.comingSoon.subtitle') as string}
        </p>
      </div>

      {/* Placeholder */}
      <div className="border border-white/[0.06] rounded-xl p-12 text-center">
        <div className="w-16 h-16 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
          <UserGroupIcon className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-[16px] font-medium text-white mb-2">
          {t('dashboard.copyTrading.comingSoon.title') as string}
        </h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          {t('dashboard.copyTrading.comingSoon.description1') as string}
          <br />
          {t('dashboard.copyTrading.comingSoon.description2') as string}
        </p>
      </div>

      {/* Feature Preview */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-white/[0.06] rounded-lg">
          <h3 className="text-sm font-medium text-white mb-1">
            {t('dashboard.copyTrading.features.celebrityPortfolio.title') as string}
          </h3>
          <p className="text-xs text-zinc-400">
            {t('dashboard.copyTrading.features.celebrityPortfolio.desc') as string}
          </p>
        </div>
        <div className="p-4 border border-white/[0.06] rounded-lg">
          <h3 className="text-sm font-medium text-white mb-1">
            {t('dashboard.copyTrading.features.oneClickMirror.title') as string}
          </h3>
          <p className="text-xs text-zinc-400">
            {t('dashboard.copyTrading.features.oneClickMirror.desc') as string}
          </p>
        </div>
        <div className="p-4 border border-white/[0.06] rounded-lg">
          <h3 className="text-sm font-medium text-white mb-1">
            {t('dashboard.copyTrading.features.realTimeAlerts.title') as string}
          </h3>
          <p className="text-xs text-zinc-400">
            {t('dashboard.copyTrading.features.realTimeAlerts.desc') as string}
          </p>
        </div>
      </div>
    </div>
  )
}
